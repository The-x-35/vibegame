import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { authenticateRequest, likeRateLimiter, validateCSRFToken, validateWalletAddress } from '@/lib/auth-middleware';

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

    // Try JWT authentication first
    const authResult = await authenticateRequest(request as any);
    if (authResult instanceof NextResponse) {
      // JWT auth failed, try to get wallet from request body
      const body = await request.json();
      wallet = body.wallet;
      
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet address required. Please connect your wallet.' }, { status: 401 });
      }
    } else {
      // JWT auth successful
      const authenticatedRequest = authResult;
      wallet = authenticatedRequest.user!.wallet;
    }
    
    // Validate wallet address
    if (!validateWalletAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Rate limiting
    const rateLimitKey = `like:${wallet}:${id}`;
    if (!likeRateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime = likeRateLimiter.getRemainingTime(rateLimitKey);
      return NextResponse.json({ 
        error: 'Rate limit exceeded', 
        retryAfter: Math.ceil(remainingTime / 1000)
      }, { status: 429 });
    }

    await client.query('BEGIN');

    // First check if the project exists
    const projectExists = await client.query(
      'SELECT id, likes_count FROM projects WHERE id = $1',
      [id]
    );

    if (projectExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const currentLikesCount = projectExists.rows[0].likes_count || 0;

    // Check if user already liked the game
    const existingLike = await client.query(
      'SELECT id FROM likes WHERE project_id = $1 AND wallet = $2',
      [id, wallet]
    );

    if (existingLike.rows.length > 0) {
      // Unlike the game - ensure count doesn't go negative
      await client.query('DELETE FROM likes WHERE project_id = $1 AND wallet = $2', [id, wallet]);
      
      const newLikesCount = Math.max(0, currentLikesCount - 1);
      await client.query('UPDATE projects SET likes_count = $1 WHERE id = $2', [newLikesCount, id]);
      
      await client.query('COMMIT');
      return NextResponse.json({ 
        liked: false, 
        likesCount: newLikesCount 
      });
    } else {
      // Like the game
      await client.query(
        'INSERT INTO likes (project_id, wallet) VALUES ($1, $2)',
        [id, wallet]
      );
      
      const newLikesCount = currentLikesCount + 1;
      await client.query('UPDATE projects SET likes_count = $1 WHERE id = $2', [newLikesCount, id]);
      
      await client.query('COMMIT');
      return NextResponse.json({ 
        liked: true, 
        likesCount: newLikesCount 
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[GAME_LIKE]', error);
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
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    // CSRF protection for GET requests too
    if (!validateCSRFToken(request as any)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    // Validate wallet address if provided
    if (wallet && !validateWalletAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    await client.query('BEGIN');

    // First check if the project exists
    const projectExists = await client.query(
      'SELECT id, likes_count FROM projects WHERE id = $1',
      [id]
    );

    if (projectExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const likesCount = projectExists.rows[0].likes_count || 0;

    // Only check if user has liked if they provided a wallet
    let liked = false;
    if (wallet) {
      const result = await client.query(
        'SELECT EXISTS(SELECT 1 FROM likes WHERE project_id = $1 AND wallet = $2) as has_liked',
        [id, wallet]
      );
      liked = result.rows[0].has_liked;
    }

    await client.query('COMMIT');

    return NextResponse.json({
      liked,
      likesCount: Math.max(0, likesCount) // Ensure non-negative
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[GAME_LIKE_GET]', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, { status: 500 });
  } finally {
    client.release();
  }
} 