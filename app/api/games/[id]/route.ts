import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Query the projects table with likes count
    const result = await query(
      'SELECT id, name, url, description, ca, likes_count FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return new NextResponse('Game not found', { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[GAME_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 