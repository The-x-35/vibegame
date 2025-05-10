import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { wallet, email, name, profileImage } = await request.json();
    const result = await query(
      `INSERT INTO users (wallet, email, name, profile_image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (wallet) DO UPDATE
         SET email = EXCLUDED.email,
             name = EXCLUDED.name,
             profile_image = EXCLUDED.profile_image,
             updated_at = NOW()
       RETURNING *;`,
      [wallet, email, name, profileImage]
    );
    const user = result.rows[0];
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    console.error('API error creating user:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 