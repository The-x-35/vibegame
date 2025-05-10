import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT id, wallet, url, is_public, created_at, updated_at
       FROM projects
       WHERE wallet = $1
       ORDER BY created_at DESC;`,
      [wallet]
    );
    return NextResponse.json({ projects: result.rows }, { status: 200 });
  } catch (err: any) {
    console.error('API error fetching projects:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { wallet, url, isPublic } = await request.json();
    if (!wallet || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO projects (wallet, url, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *;`,
      [wallet, url, isPublic ?? false]
    );

    return NextResponse.json({ project: result.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('API error creating project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 