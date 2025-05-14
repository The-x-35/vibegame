import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Generate signed URL for file upload/update
export async function POST(req: NextRequest) {
    // authenticate user
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token and get wallet address
    const payload = await verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const wallet = payload.wallet;

    if (!wallet) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, userId, fileId } = await req.json();

    if (!filename || typeof filename !== "string" || !filename.endsWith(".sb3")) {
        return NextResponse.json({ error: "Invalid or missing filename" }, { status: 400 });
    }

    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Check here that if the request contains the userId it should be the same as the wallet address
    if (userId && userId !== wallet) {
        return NextResponse.json({ error: "User not authorised to upload to this file" }, { status: 401 });
    }

    // Determine S3 key: if updating, use provided fileId directly; otherwise create new key with timestamp
    const key = fileId
        ? fileId
        : `${userId}/${filename.replace(".sb3", "")}-${Date.now()}.sb3`;

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
