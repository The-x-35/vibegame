import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const fileBuffer = await file.arrayBuffer();
        const key = `thumbnails/${Date.now()}-${file.name}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            Body: Buffer.from(fileBuffer),
            ContentType: file.type,
            ACL: 'public-read',
        }));

        const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return NextResponse.json({ url }, { status: 200 });
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 });
    }
} 