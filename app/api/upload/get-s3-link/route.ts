import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Generate signed URL for file upload/update
export async function POST(req: NextRequest) {
    const { filename, userId, fileId } = await req.json();

    if (!filename || typeof filename !== "string" || !filename.endsWith(".sb3")) {
        return NextResponse.json({ error: "Invalid or missing filename" }, { status: 400 });
    }

    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // If fileId is provided, we're updating an existing file
    // Otherwise, we're creating a new file with timestamp
    const key = fileId ? `${userId}/${fileId}` : `${userId}/${filename.replace(".sb3", "")}-${Date.now()}.sb3`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        ContentType: "binary/octet-stream",
        ACL: "public-read",
    });

    try {
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return NextResponse.json({ url, key }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to generate pre-signed URL" }, { status: 500 });
    }
}
