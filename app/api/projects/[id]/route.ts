import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(
      'SELECT * FROM projects WHERE id = $1',
      [params.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project: result.rows[0] });
  } catch (err: any) {
    console.error('Error fetching project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, ca, is_public } = await request.json();

    const result = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           ca = COALESCE($3, ca),
           is_public = COALESCE($4, is_public),
           updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [name, description, ca, is_public, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project: result.rows[0] });
  } catch (err: any) {
    console.error('Error updating project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 