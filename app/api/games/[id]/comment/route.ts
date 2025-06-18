import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { authenticateRequest, commentRateLimiter, validateCSRFToken, validateWalletAddress } from '@/lib/auth-middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id } = await params;
    
    // CSRF protection
    if (!validateCSRFToken(request as any)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    let wallet: string;
    let content: string;

    // Try JWT authentication first
    const authResult = await authenticateRequest(request as any);
    if (authResult instanceof NextResponse) {
      // JWT auth failed, try to get wallet and content from request body
      const body = await request.json();
      wallet = body.wallet;
      content = body.content;
      
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet address required. Please connect your wallet.' }, { status: 401 });
      }
    } else {
      // JWT auth successful
      const authenticatedRequest = authResult;
      wallet = authenticatedRequest.user!.wallet;
      const body = await request.json();
      content = body.content;
    }
    
    // Validate wallet address
    if (!validateWalletAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Rate limiting
    const rateLimitKey = `comment:${wallet}:${id}`;
    if (!commentRateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = commentRateLimiter.getRemainingTime(rateLimitKey);
      return NextResponse.json({ 
        error: 'Rate limit exceeded', 
        retryAfter: Math.ceil(remainingTime / 1000)
      }, { status: 429 });
    }

    // Input validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Sanitize and validate content
    const sanitizedContent = content.trim();
    if (sanitizedContent.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 });
    }

    if (sanitizedContent.length < 1) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    await client.query('BEGIN');

    // First check if the project exists
    const projectExists = await client.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );

    if (projectExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Add the comment
    const result = await client.query(
      'INSERT INTO comments (project_id, wallet, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
      [id, wallet, sanitizedContent]
    );

    // Update comments count
    await client.query('UPDATE projects SET comments_count = comments_count + 1 WHERE id = $1', [id]);

    await client.query('COMMIT');

    return NextResponse.json({
      id: result.rows[0].id,
      content: result.rows[0].content,
      createdAt: result.rows[0].created_at,
      wallet
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[GAME_COMMENT]', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id } = await params;
    
    // CSRF protection for GET requests too
    if (!validateCSRFToken(request as any)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    await client.query('BEGIN');

    // First check if the project exists
    const projectExists = await client.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );

    if (projectExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get comments with pagination to prevent abuse
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 comments per request
    const offset = (page - 1) * limit;

    const result = await client.query(
      'SELECT id, content, created_at, wallet FROM comments WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [id, limit, offset]
    );

    await client.query('COMMIT');

    return NextResponse.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[GAME_COMMENT_GET]', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, { status: 500 });
  } finally {
    client.release();
  }
} 