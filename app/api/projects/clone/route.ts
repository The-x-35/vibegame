import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { query } from '@/lib/db';
import { Readable } from 'stream';
import { generateUniqueSlug } from '@/lib/utils/slug';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper to convert a Readable stream into a Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    // Copy chunk into a plain Uint8Array for ArrayBuffer backing
    chunks.push(new Uint8Array(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

// POST /api/projects/clone
export async function POST(request: NextRequest) {
  try {
    // Read wallet and project details from request
    const { projectId, name: newName, description: newDescription, isPublic, wallet } = await request.json();
    if (!wallet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Fetch template metadata from database
    const templateResult = await query(
      'SELECT url, name, description, thumbnail FROM templates WHERE id = $1',
      [projectId]
    );
    const templateRows = templateResult.rows;
    if (!templateRows || templateRows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    const sourceUrl = templateRows[0].url;
    const originalName = templateRows[0].name;
    const originalDescription = templateRows[0].description;
    const originalThumbnail = templateRows[0].thumbnail || "/og/og1.png";

    // Extract S3 key and bucket from source URL
    let sourceKey: string;
    let sourceBucket: string;
    let urlObj: URL;
    try {
      urlObj = new URL(sourceUrl);
      sourceBucket = urlObj.host.split('.')[0];
      sourceKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    } catch {
      return NextResponse.json({ error: 'Invalid source URL' }, { status: 400 });
    }

    // Download file from S3 (from the source bucket)
    const getCommand = new GetObjectCommand({
      Bucket: sourceBucket,
      Key: sourceKey,
    });
    const getResponse = await s3.send(getCommand);
    if (!getResponse.Body) {
      return NextResponse.json({ error: 'Failed to download project file' }, { status: 500 });
    }
    const fileBuffer = await streamToBuffer(getResponse.Body as Readable);

    // Prepare new S3 key for the cloned file
    const originalFilename = sourceKey.split('/').pop() || `${originalName}.sb3`;
    const timestamp = Date.now();
    const newKey = `${wallet}/${originalFilename.replace('.sb3', '')}-${timestamp}.sb3`;

    // Upload cloned project to user's folder in S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: newKey,
      Body: fileBuffer,
      ContentType: 'binary/octet-stream',
      ACL: 'public-read',
    });
    await s3.send(putCommand);

    // Construct new public URL
    const region = process.env.AWS_REGION;
    const bucket = process.env.S3_BUCKET_NAME;
    const newUrl = `https://${bucket}.s3.${region}.amazonaws.com/${newKey}`;

    // Generate a unique slug from the project name
    const id = await generateUniqueSlug(newName || originalName);

    // Insert new project record into database
    const insertResult = await query(
      `INSERT INTO projects (id, wallet, url, name, description, is_public, thumbnail, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, wallet, url, name, description, is_public, thumbnail, created_at, updated_at;`,
      [id, wallet, newUrl, newName || originalName, newDescription || originalDescription, isPublic ?? false, originalThumbnail]
    );

    const newProject = insertResult.rows[0];
    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: any) {
    console.error('Error cloning project:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
} 