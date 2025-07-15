import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authenticateRequest } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Fetch a file by its fileId
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
    const { fileId } = await props.params;

    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
    }

    try {
        // For public files, check if they belong to a public project
        const projectResult = await query(
            'SELECT is_public, wallet FROM projects WHERE url LIKE $1',
            [`%${fileId}%`]
        );

        // If file is associated with a project
        if (projectResult.rows.length > 0) {
            const project = projectResult.rows[0];
            
            // If project is not public, verify ownership
            if (!project.is_public) {
                const authResult = await authenticateRequest(request);
                if (authResult instanceof NextResponse) {
                    return NextResponse.json({ error: "Authentication required to access private file" }, { status: 401 });
                }
                
                const authenticatedRequest = authResult;
                if (authenticatedRequest.user!.wallet !== project.wallet) {
                    return NextResponse.json({ error: "Not authorized to access this file" }, { status: 403 });
                }
            }
        } else {
            // If file is not associated with any project, require authentication
            const authResult = await authenticateRequest(request);
            if (authResult instanceof NextResponse) {
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }
        }

        // Create a pre-signed URL for accessing the file
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: fileId,
        });

        // Generate a signed URL that will be valid for 1 hour
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return NextResponse.json({ url, fileId }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }
}

// Delete a file
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
    const { fileId } = await props.params;

    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
    }

    try {
        // Authenticate request
        const authResult = await authenticateRequest(request);
        if (authResult instanceof NextResponse) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        const authenticatedRequest = authResult;

        // Check if file belongs to a project and verify ownership
        const projectResult = await query(
            'SELECT wallet FROM projects WHERE url LIKE $1',
            [`%${fileId}%`]
        );

        if (projectResult.rows.length > 0) {
            const project = projectResult.rows[0];
            if (authenticatedRequest.user!.wallet !== project.wallet) {
                return NextResponse.json({ error: "Not authorized to delete this file" }, { status: 403 });
            }
        }

        // Delete the file from S3
        const command = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: fileId,
        });

        await s3.send(command);
        return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
