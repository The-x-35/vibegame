import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function GET() {
  try {
    // Query returns a result object with 'rows' containing the data
    const result = await query(
      'SELECT id, name, url, description FROM templates ORDER BY created_at',
      []
    );
    const templates = result.rows;
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.error();
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!name || !description || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!file.name.endsWith('.sb3')) {
      return NextResponse.json({ error: "File must be a .sb3 file" }, { status: 400 });
    }

    // Upload file to S3
    const fileBuffer = await file.arrayBuffer();
    const key = `templates/${name.replace(/\s+/g, '')}-${Date.now()}.sb3`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: 'binary/octet-stream',
      ACL: 'public-read',
    }));

    // Construct the public URL
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Add template to database
    const result = await query(
      'INSERT INTO templates (name, url, description) VALUES ($1, $2, $3) RETURNING id, name, url, description',
      [name, url, description]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Get the template URL before deleting
    const templateResult = await query(
      'SELECT url FROM templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const templateUrl = templateResult.rows[0].url;

    // Delete from database
    await query(
      'DELETE FROM templates WHERE id = $1',
      [id]
    );

    // Extract the key from the URL
    const urlParts = templateUrl.split('/');
    const key = urlParts.slice(urlParts.indexOf('templates')).join('/');

    // Delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
} 