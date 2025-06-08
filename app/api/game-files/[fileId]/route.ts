import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    try {
        const { fileId } = await props.params;
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
        }

        // Delete the file from S3
        const s3Client = new S3Client({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: fileId,
            })
        );

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error deleting file:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
