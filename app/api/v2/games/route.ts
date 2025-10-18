import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

// GET /api/v2/games?wallet=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
    }

    const result = await query(
      `SELECT id, wallet, name, description, s3_prefix, index_key, files, is_public, thumbnail, created_at, updated_at
       FROM v2_games
       WHERE wallet = $1
       ORDER BY updated_at DESC`,
      [wallet]
    );

    return NextResponse.json({ games: result.rows }, { status: 200 });
  } catch (err: any) {
    console.error('Error listing v2 games:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/v2/games
// Body: { id, wallet, name, description, s3Prefix, indexKey, files[], isPublic }
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { id, wallet, name, description, s3Prefix, indexKey, files, isPublic, thumbnail } = await req.json();
    if (!id || !wallet || !name || !s3Prefix || !indexKey || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (auth.user?.wallet !== wallet) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await query(
      `INSERT INTO v2_games (id, wallet, name, description, s3_prefix, index_key, files, is_public, thumbnail, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         s3_prefix = EXCLUDED.s3_prefix,
         index_key = EXCLUDED.index_key,
         files = EXCLUDED.files,
         is_public = EXCLUDED.is_public,
         thumbnail = EXCLUDED.thumbnail,
         updated_at = NOW()
       RETURNING *`,
      [id, wallet, name, description ?? '', s3Prefix, indexKey, JSON.stringify(files), !!isPublic, thumbnail ?? null]
    );

    return NextResponse.json({ game: result.rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating v2 game:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


