import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { jwtDecode } from 'jwt-decode';
import { AppTokenPayload } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode token and get user's wallet
    const payload = jwtDecode<AppTokenPayload>(token);
    if (!payload || !payload.wallet) {
      console.log('Invalid token payload:', payload);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const wallet = payload.wallet;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
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
      [id, wallet, content.trim()]
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

    // Get comments with user info
    const comments = await client.query(
      `SELECT c.id, c.content, c.created_at, c.wallet, u.name, u.profile_image
       FROM comments c
       LEFT JOIN users u ON c.wallet = u.wallet
       WHERE c.project_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    await client.query('COMMIT');

    return NextResponse.json(comments.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[GAME_COMMENTS_GET]', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal error' 
    }, { status: 500 });
  } finally {
    client.release();
  }
} 