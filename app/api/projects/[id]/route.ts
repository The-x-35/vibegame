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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
    }

    // First verify that the project belongs to the user
    const verifyResult = await query(
      'SELECT url FROM projects WHERE id = $1 AND wallet = $2',
      [id, wallet]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    const projectUrl = verifyResult.rows[0].url;

    // Delete the project from the database
    await query('DELETE FROM projects WHERE id = $1', [id]);

    // Delete the file from S3
    try {
      const urlObj = new URL(projectUrl);
      const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      
      const response = await fetch(`/api/game-files/${encodeURIComponent(key)}?userId=${wallet}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${request.headers.get('Authorization')?.split(' ')[1]}`
        }
      });

      if (!response.ok) {
        console.error('Failed to delete file from S3:', await response.text());
      }
    } catch (err) {
      console.error('Error deleting file from S3:', err);
    }

    return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 