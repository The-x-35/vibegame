import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    // Get project data
    const result = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = result.rows[0];

    console.log('[PROJECT_API] Requested project', {
      id,
      projectWallet: project.wallet,
      isPublic: project.is_public,
    });

    // If project is public, return it
    if (project.is_public) {
      return NextResponse.json({ project });
    }

    // For private projects, verify ownership
    const authResult = await authenticateRequest(request as any);
    if (authResult instanceof NextResponse) {
      return NextResponse.json({ error: 'Authentication required to view private project' }, { status: 401 });
    }

    const authenticatedRequest = authResult;

    console.log('[PROJECT_API] Authenticated request wallet', authenticatedRequest.user?.wallet);

    if (!authenticatedRequest.user?.wallet) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    if (authenticatedRequest.user.wallet !== project.wallet) {
      console.warn('[PROJECT_API] Wallet mismatch', {
        tokenWallet: authenticatedRequest.user.wallet,
        projectWallet: project.wallet,
      });
      return NextResponse.json({ error: 'Not authorized to view this project' }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (err: any) {
    console.error('Error fetching project:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Verify project exists and user owns it
    const projectResult = await query(
      'SELECT wallet FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Simple wallet check like editor and project pages
    if (projectResult.rows[0].wallet !== wallet) {
      return NextResponse.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    // Delete the project
    await query(
      'DELETE FROM projects WHERE id = $1',
      [id]
    );

    return NextResponse.json({ message: 'Project deleted successfully' });
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
    const body = await request.json();
    const { name, description, isPublic, ca, wallet } = body;

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get project data
    const projectResult = await query(
      'SELECT wallet FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Simple wallet check like editor and project pages
    if (projectResult.rows[0].wallet !== wallet) {
      return NextResponse.json({ error: 'Not authorized to modify this project' }, { status: 403 });
    }

    // Update the project
    const result = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_public = COALESCE($3, is_public),
           ca = COALESCE($4, ca),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, isPublic, ca, id]
    );

    return NextResponse.json({ project: result.rows[0] });
  } catch (err: any) {
    console.error('Error updating project:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 