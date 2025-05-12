import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// TODO: add authentication if needed
// Fetch a file by its fileId
export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
    const { fileId } = params;

    if (!fileId) {
        return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
    }

    try {
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
