import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { authenticateRequest } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Get all files in the bucket
export async function GET(req: NextRequest) {
    // Authenticate request - only admins should be able to list all files
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const authenticatedRequest = authResult;

    // Check if user is an admin (you can modify this check based on your admin criteria)
    const isAdmin = authenticatedRequest.user!.wallet === 'AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8';
    if (!isAdmin) {
        return NextResponse.json({ error: "Not authorized to list all files" }, { status: 403 });
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME!,
            Prefix: "",
        });
        const response = await s3.send(command);
        return NextResponse.json(response.Contents, { status: 200 });
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}
