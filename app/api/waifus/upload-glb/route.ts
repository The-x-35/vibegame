import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload?.wallet) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });
    if (!file.name.endsWith('.glb')) return NextResponse.json({ error: 'Only .glb files allowed' }, { status: 400 });

    const fileBuffer = await file.arrayBuffer();
    const key = `waifus/${payload.wallet}/${Date.now()}-${file.name}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: 'model/gltf-binary',
      ACL: 'public-read',
    }));

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Error uploading glb:', error);
    return NextResponse.json({ error: 'Failed to upload glb' }, { status: 500 });
  }
}


