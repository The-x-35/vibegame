import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const { id } = await params;
    const { wallet, content } = await request.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

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

    // Get comments
    const result = await client.query(
      'SELECT id, content, created_at, wallet FROM comments WHERE project_id = $1 ORDER BY created_at DESC',
      [id]
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