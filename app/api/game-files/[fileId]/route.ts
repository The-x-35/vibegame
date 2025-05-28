import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifyToken } from "@/lib/auth";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// TODO: add authentication if needed
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

// delete a file by its fileId
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
    const { fileId } = await props.params;
    const userId = request.nextUrl.searchParams.get("userId");

    // authenticate user
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token and get wallet address
    const payload = await verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const wallet = payload.wallet;

    if (userId !== wallet) {
        return NextResponse.json({ error: "User not authorised to delete this file" }, { status: 401 });
    }

    try {
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
