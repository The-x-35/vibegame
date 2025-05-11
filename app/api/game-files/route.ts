import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

// Get all files in the bucket
//TODO: add authentication
export async function GET(req: NextRequest) {
    const command = new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME!,
        Prefix: "",
    });
    const response = await s3.send(command);
    return NextResponse.json(response.Contents, { status: 200 });
}
