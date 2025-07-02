import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { verifyToken } from "@/lib/auth";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Direct S3 upload (like template upload)
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

    const { filename, userId, fileId, fileData } = await req.json();

    if (!filename || typeof filename !== "string" || !filename.endsWith(".sb3")) {
        return NextResponse.json({ error: "Invalid or missing filename" }, { status: 400 });
    }

    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!fileData) {
        return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    // Check here that if the request contains the userId it should be the same as the wallet address
    if (userId && userId !== wallet) {
        return NextResponse.json({ error: "User not authorised to upload to this file" }, { status: 401 });
    }

    // Determine S3 key: if updating, use provided fileId directly; otherwise create new key with timestamp
    const key = fileId
        ? fileId
        : `${userId}/${filename.replace(".sb3", "")}-${Date.now()}.sb3`;

    console.log('🔑 S3 Upload Debug:');
    console.log('📁 Provided fileId:', fileId);
    console.log('👤 UserId:', userId);
    console.log('📄 Filename:', filename);
    console.log('🎯 Final S3 key:', key);
    console.log('🔄 Is update operation:', !!fileId);

    try {
        // Convert base64 to buffer (same as template upload)
        const fileBuffer = Buffer.from(fileData, 'base64');
        console.log('📦 File buffer size:', fileBuffer.length, 'bytes');

        // Direct upload to S3 (exactly like template upload)
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            Body: fileBuffer,
            ContentType: 'binary/octet-stream',
            ACL: 'public-read',
            CacheControl: 'no-cache, no-store, must-revalidate, max-age=0',
            Expires: new Date(Date.now() - 1000 * 60 * 60 * 24),
            Metadata: {
                'last-modified': new Date().toISOString(),
                'cache-bust': Date.now().toString(),
                'version': Math.random().toString(36).substring(7)
            }
        }));

        console.log('✅ Successfully uploaded file to S3:', key);

        // Construct the public URL (same as template upload)
        const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return NextResponse.json({ success: true, key, url }, { status: 200 });
    } catch (err) {
        console.error('❌ S3 upload error:', err);
        return NextResponse.json({ error: "Failed to upload file to S3" }, { status: 500 });
    }
}
