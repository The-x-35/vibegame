import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT * FROM users WHERE wallet = $1;`,
      [wallet]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    console.error('API error fetching user:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO users (wallet, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       ON CONFLICT (wallet) DO UPDATE
         SET updated_at = NOW()
       RETURNING *;`,
      [wallet]
    );
    
    const user = result.rows[0];
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    console.error('API error creating user:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 