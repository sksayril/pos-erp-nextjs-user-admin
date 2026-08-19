import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../../lib/s3';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Make unique file name to prevent collision
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const bucketName = process.env.AWS_S3_BUCKET;

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('S3 Upload Error:', error);
    return NextResponse.json({ error: error.message || 'S3 upload failed' }, { status: 500 });
  }
}
