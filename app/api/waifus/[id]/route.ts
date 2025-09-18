import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query(
      `SELECT id, name, url, description, ca, likes_count, views_count, comments_count, thumbnail, glb_url, rpm_avatar_id, system_prompt
       FROM projects WHERE id = $1 AND type = 'waifu'`,
      [id]
    );
    if (result.rows.length === 0) {
      return new NextResponse('Waifu not found', { status: 404 });
    }
    const w = result.rows[0];
    return NextResponse.json({
      id: w.id,
      name: w.name,
      url: w.url,
      description: w.description,
      ca: w.ca,
      likesCount: w.likes_count,
      viewsCount: w.views_count,
      commentsCount: w.comments_count,
      thumbnail: w.thumbnail,
      glbUrl: w.glb_url,
      rpmAvatarId: w.rpm_avatar_id,
      systemPrompt: w.system_prompt
    });
  } catch (error) {
    console.error('[WAIFU_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


