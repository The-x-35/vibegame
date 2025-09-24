import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Validate sort parameters
    const validSortFields = ['created_at', 'views_count', 'likes_count', 'name'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ error: 'Invalid sort field' }, { status: 400 });
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 });
    }

    // Query returns a result object with 'rows' containing the data
    const result = await query(
      `SELECT id, name, url, description, likes_count, wallet, thumbnail, ca, views_count, created_at 
       FROM projects 
       WHERE ca IS NOT NULL AND type = 'game'
       ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`,
      []
    );
    const games = result.rows;
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.error();
  }
} 