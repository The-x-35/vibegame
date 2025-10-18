import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const result = await query(
      `SELECT id, wallet, name, description, s3_prefix, index_key, files, is_public, thumbnail, created_at, updated_at
       FROM v2_games WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ game: result.rows[0] }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching v2 game:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { name, description, isPublic, thumbnail, files, indexKey } = await req.json();

    // Verify ownership
    const owner = await query('SELECT wallet FROM v2_games WHERE id = $1', [id]);
    if (owner.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (owner.rows[0].wallet !== auth.user?.wallet) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const result = await query(
      `UPDATE v2_games SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         is_public = COALESCE($3, is_public),
         thumbnail = COALESCE($4, thumbnail),
         files = COALESCE($5, files),
         index_key = COALESCE($6, index_key),
         updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, description, isPublic, thumbnail, files ? JSON.stringify(files) : null, indexKey, id]
    );

    return NextResponse.json({ game: result.rows[0] }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating v2 game:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


