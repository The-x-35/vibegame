import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Incrementing views for game ID:', id);
    
    // Increment the views count for the game
    const result = await query(
      'UPDATE projects SET views_count = views_count + 1 WHERE id = $1 RETURNING views_count',
      [id]
    );

    console.log('Update result:', result);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ viewsCount: result.rows[0].views_count });
  } catch (error) {
    console.error('[GAME_VIEW]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
} 