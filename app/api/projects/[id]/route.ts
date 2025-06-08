import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const result = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
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

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
    }

    // Get the project's URL before deleting it
    const projectResult = await query(
      'SELECT url FROM projects WHERE id = $1 AND wallet = $2',
      [id, wallet]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectUrl = projectResult.rows[0].url;

    // Delete the project from the database
    await query(
      'DELETE FROM projects WHERE id = $1 AND wallet = $2',
      [id, wallet]
    );

    // Delete the associated file from S3
    try {
      const urlObj = new URL(projectUrl);
      const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      
      // Construct absolute URL for the API endpoint
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/game-files/${encodeURIComponent(key)}?wallet=${wallet}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error deleting file from S3:', errorText);
        // Don't throw the error, as the project is already deleted from the database
      }
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Don't throw the error, as the project is already deleted from the database
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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