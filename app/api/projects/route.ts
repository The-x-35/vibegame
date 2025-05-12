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
      `SELECT id, wallet, url, name, description, is_public, created_at, updated_at
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
    const { wallet, url, name, description, isPublic } = await request.json();
    if (!wallet || !url || !name || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO projects (wallet, url, name, description, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *;`,
      [wallet, url, name, description, isPublic ?? false]
    );

    return NextResponse.json({ project: result.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('API error creating project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, isPublic } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
    }
    const result = await query(
      `UPDATE projects
         SET is_public = $1,
             updated_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [isPublic ?? false, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ project: result.rows[0] }, { status: 200 });
  } catch (err: any) {
    console.error('API error updating project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 