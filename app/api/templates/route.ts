import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Query returns a result object with 'rows' containing the data
    const result = await query(
      'SELECT id, name, url, description FROM templates ORDER BY created_at',
      []
    );
    const templates = result.rows;
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.error();
  }
} 