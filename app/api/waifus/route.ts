import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/utils/slug';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const validSortFields = ['created_at', 'views_count', 'likes_count', 'name'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ error: 'Invalid sort field' }, { status: 400 });
    }
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, name, url, description, likes_count, wallet, thumbnail, ca, views_count, created_at 
       FROM projects 
       WHERE type = 'waifu' AND ca IS NOT NULL 
       ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`,
      []
    );
    const waifus = result.rows;
    return NextResponse.json(waifus);
  } catch (error) {
    console.error('Error fetching waifus:', error);
    return NextResponse.error();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, url, name, description, thumbnail, glbUrl, rpmAvatarId, systemPrompt } = body;
    if (!wallet || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const id = await generateUniqueSlug(name);
    const urlToUse = url || `/waifus/${id}`;

    const result = await query(
      `INSERT INTO projects (id, wallet, url, name, description, thumbnail, type, glb_url, rpm_avatar_id, system_prompt, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'waifu', $7, $8, $9, NOW(), NOW())
       RETURNING *;`,
      [id, wallet, urlToUse, name, description || '', thumbnail || null, glbUrl || null, rpmAvatarId || null, systemPrompt || null]
    );
    return NextResponse.json({ waifu: result.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('API error creating waifu:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


