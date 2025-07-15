import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { authenticateRequest } from '@/lib/auth-middleware';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Get all files in the user's folder from s3
export async function GET(req: NextRequest) {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const authenticatedRequest = authResult;

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
        return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // Verify that the authenticated user is requesting their own files
    if (userId !== authenticatedRequest.user!.wallet) {
        return NextResponse.json({ error: "Not authorized to access these files" }, { status: 403 });
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME!,
            Prefix: userId,
        });
        const response = await s3.send(command);
        return NextResponse.json(response.Contents, { status: 200 });
    } catch (error) {
        console.error('Error listing user files:', error);
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}
