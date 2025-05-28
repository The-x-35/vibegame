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

    // Check if user already liked the game
    const existingLike = await client.query(
      'SELECT id FROM likes WHERE project_id = $1 AND wallet = $2',
      [id, wallet]
    );

    if (existingLike.rows.length > 0) {
      // Unlike the game
      await client.query('DELETE FROM likes WHERE project_id = $1 AND wallet = $2', [id, wallet]);
      await client.query('UPDATE projects SET likes_count = likes_count - 1 WHERE id = $1', [id]);
      await client.query('COMMIT');
      return NextResponse.json({ liked: false });
    } else {
      // Like the game
      await client.query(
        'INSERT INTO likes (project_id, wallet) VALUES ($1, $2)',
        [id, wallet]
      );
      await client.query('UPDATE projects SET likes_count = likes_count + 1 WHERE id = $1', [id]);
      await client.query('COMMIT');
      return NextResponse.json({ liked: true });
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
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
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

    // Get total likes count - this is available to everyone
    const likesCount = await client.query(
      'SELECT likes_count FROM projects WHERE id = $1',
      [id]
    );

    // Only check if user has liked if they're authenticated
    let liked = false;
    if (token) {
      const payload = jwtDecode<AppTokenPayload>(token);
      if (payload?.wallet) {
        const result = await client.query(
          'SELECT EXISTS(SELECT 1 FROM likes WHERE project_id = $1 AND wallet = $2) as has_liked',
          [id, payload.wallet]
        );
        liked = result.rows[0].has_liked;
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      liked,
      likesCount: likesCount.rows[0]?.likes_count || 0
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