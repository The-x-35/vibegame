import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Query the projects table with likes count, views count, and comments count
    const result = await query(
      'SELECT id, name, url, description, ca, likes_count, views_count, comments_count FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return new NextResponse('Game not found', { status: 404 });
    }

    const game = result.rows[0];
    
    // Return with camelCase field names
    return NextResponse.json({
      id: game.id,
      name: game.name,
      url: game.url,
      description: game.description,
      ca: game.ca,
      likesCount: game.likes_count,
      viewsCount: game.views_count,
      commentsCount: game.comments_count
    });
  } catch (error) {
    console.error('[GAME_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 