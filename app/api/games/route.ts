import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Query returns a result object with 'rows' containing the data
    const result = await query(
      'SELECT id, name, url, description, likes_count, wallet, thumbnail, ca FROM projects WHERE is_public = true ORDER BY created_at DESC',
      []
    );
    const games = result.rows;
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.error();
  }
} 