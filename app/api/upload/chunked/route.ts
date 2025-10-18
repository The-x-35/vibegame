import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { verifyToken } from "@/lib/auth";

// Configure maximum duration for Vercel Pro plan
export const maxDuration = 800;
export const dynamic = 'force-dynamic';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// In-memory storage for chunks (in production, use Redis or similar)
const chunkStorage = new Map<string, {
    chunks: Map<number, Buffer>;
    totalChunks: number;
    filename: string;
    userId: string;
    fileId?: string;
    uploadType: 'project' | 'template' | 'thumbnail' | 'webgame';
    metadata?: any;
}>();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const uploadType = formData.get('uploadType') as 'project' | 'template' | 'thumbnail' | 'webgame';
        
        // Authenticate user for project and webgame uploads
        let wallet: string | undefined;
        if (uploadType === 'project' || uploadType === 'webgame') {
            const token = req.headers.get("Authorization")?.split(" ")[1];
            if (!token) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const payload = await verifyToken(token);
            if (!payload) {
                return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
            }

            wallet = payload.wallet;
            if (!wallet) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }
        const chunkData = formData.get('chunk') as File;
        const chunkIndex = parseInt(formData.get('chunkIndex') as string);
        const totalChunks = parseInt(formData.get('totalChunks') as string);
        const uploadId = formData.get('uploadId') as string;
        const filename = formData.get('filename') as string;
        const userId = formData.get('userId') as string;
        const fileId = formData.get('fileId') as string || undefined;
        const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined;

        // Validate required fields
        if (!chunkData || chunkIndex === null || !totalChunks || !uploadId || !filename || !userId || !uploadType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check authorization for project and webgame uploads
        if ((uploadType === 'project' || uploadType === 'webgame') && userId !== wallet) {
            return NextResponse.json({ error: "User not authorized to upload to this file" }, { status: 401 });
        }

        // Convert chunk to buffer
        const chunkBuffer = Buffer.from(await chunkData.arrayBuffer());

        console.log(`📦 Received chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`);
        console.log(`📁 File: ${filename}, Size: ${chunkBuffer.length} bytes, Type: ${uploadType}`);

        // Initialize or get existing upload session
        if (!chunkStorage.has(uploadId)) {
            chunkStorage.set(uploadId, {
                chunks: new Map(),
                totalChunks,
                filename,
                userId,
                fileId,
                uploadType,
                metadata
            });
        }

        const uploadSession = chunkStorage.get(uploadId)!;
        uploadSession.chunks.set(chunkIndex, chunkBuffer);

        // Check if all chunks have been received
        if (uploadSession.chunks.size === totalChunks) {
            console.log(`✅ All chunks received for ${uploadId}, assembling file...`);

            // Assemble the complete file
            const sortedChunks = Array.from(uploadSession.chunks.entries())
                .sort(([a], [b]) => a - b)
                .map(([, buffer]) => new Uint8Array(buffer));
            
            const totalLength = sortedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const completeFile = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of sortedChunks) {
                completeFile.set(chunk, offset);
                offset += chunk.length;
            }
            console.log(`🔧 Assembled file size: ${completeFile.length} bytes`);

            // Generate S3 key based on upload type
            let key: string;
            let contentType: string;

            switch (uploadType) {
                case 'project':
                    if (!filename.endsWith('.sb3')) {
                        return NextResponse.json({ error: "Project files must be .sb3 format" }, { status: 400 });
                    }
                    key = fileId || `${userId}/${filename.replace(".sb3", "")}-${Date.now()}.sb3`;
                    contentType = 'binary/octet-stream';
                    break;
                
                case 'template':
                    if (!filename.endsWith('.sb3')) {
                        return NextResponse.json({ error: "Template files must be .sb3 format" }, { status: 400 });
                    }
                    key = `templates/${filename.replace(/\s+/g, '').replace('.sb3', '')}-${Date.now()}.sb3`;
                    contentType = 'binary/octet-stream';
                    break;
                
                case 'thumbnail':
                    key = `thumbnails/${Date.now()}-${filename}`;
                    contentType = metadata?.mimeType || 'image/jpeg';
                    break;
                case 'webgame':
                    // For web games, allow common web asset extensions and construct keys under a prefix
                    const lower = filename.toLowerCase();
                    const ext = lower.split('.').pop() || '';
                    const allowed = ['html','htm','css','js','json','png','jpg','jpeg','gif','svg','webp','ico','txt','mp3','wav','ogg'];
                    if (!allowed.includes(ext)) {
                        return NextResponse.json({ error: "Unsupported webgame file extension" }, { status: 400 });
                    }
                    // fileId acts as the folder prefix (e.g., wallet/v2/<id>/)
                    const path = (metadata?.path as string) || filename;
                    const basePrefix = fileId ? (fileId.endsWith('/') ? fileId : `${fileId}/`) : `${userId}/v2/${Date.now()}/`;
                    key = `${basePrefix}${path}`;
                    // Basic content type inference
                    const ctMap: Record<string,string> = {
                        html: 'text/html; charset=utf-8',
                        htm: 'text/html; charset=utf-8',
                        css: 'text/css; charset=utf-8',
                        js: 'application/javascript; charset=utf-8',
                        json: 'application/json; charset=utf-8',
                        png: 'image/png',
                        jpg: 'image/jpeg',
                        jpeg: 'image/jpeg',
                        gif: 'image/gif',
                        svg: 'image/svg+xml',
                        webp: 'image/webp',
                        ico: 'image/x-icon',
                        txt: 'text/plain; charset=utf-8',
                        mp3: 'audio/mpeg',
                        wav: 'audio/wav',
                        ogg: 'audio/ogg',
                    };
                    contentType = ctMap[ext] || 'application/octet-stream';
                    break;
                
                default:
                    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
            }

            console.log(`🎯 Uploading to S3 with key: ${key}`);

            // Upload to S3
            const uploadCommand = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: key,
                Body: completeFile,
                ContentType: contentType,
                ACL: 'public-read',
                ...((uploadType === 'project' || uploadType === 'webgame') && {
                    CacheControl: 'no-cache, no-store, must-revalidate, max-age=0',
                    Expires: new Date(Date.now() - 1000 * 60 * 60 * 24),
                    Metadata: {
                        'last-modified': new Date().toISOString(),
                        'cache-bust': Date.now().toString(),
                        'version': Math.random().toString(36).substring(7)
                    }
                })
            });

            await s3.send(uploadCommand);

            // Construct the public URL
            const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

            console.log(`✅ Successfully uploaded ${uploadType} file to S3: ${key}`);

            // Clean up chunk storage
            chunkStorage.delete(uploadId);

            return NextResponse.json({ 
                success: true, 
                key, 
                url,
                uploadType,
                metadata: uploadSession.metadata
            }, { status: 200 });
        }

        // Return progress if not all chunks received yet
        return NextResponse.json({ 
            success: true, 
            progress: uploadSession.chunks.size / totalChunks,
            chunksReceived: uploadSession.chunks.size,
            totalChunks
        }, { status: 200 });

    } catch (err) {
        console.error('❌ Chunked upload error:', err);
        return NextResponse.json({ error: "Failed to process chunked upload" }, { status: 500 });
    }
} 