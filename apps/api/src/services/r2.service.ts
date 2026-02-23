import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { logger } from '@owl-mentors/utils';
import { Readable } from 'stream';

function createClient(): S3Client {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

function bucket(): string {
  const b = process.env.R2_BUCKET_NAME;
  if (!b) throw new Error('R2_BUCKET_NAME is not set.');
  return b;
}

function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  if (!base) throw new Error('R2_PUBLIC_URL is not set.');
  return `${base}/${key}`;
}

export interface R2UploadResult {
  key: string;   // object key in the bucket (use this for deletion)
  url: string;   // public URL
}

export const R2Service = {
  /**
   * Upload a file from a Buffer.
   * key — the full object path, e.g. "certifications/mentorId/file.pdf"
   */
  async upload(buffer: Buffer, key: string, contentType: string): Promise<R2UploadResult> {
    const client = createClient();
    const upload = new Upload({
      client,
      params: {
        Bucket: bucket(),
        Key: key,
        Body: buffer,
        ContentType: contentType,
      },
    });
    await upload.done();
    const url = publicUrl(key);
    logger.info(`[R2] Uploaded ${key} (${buffer.byteLength} bytes)`);
    return { key, url };
  },

  /**
   * Delete an object by key.
   */
  async delete(key: string): Promise<void> {
    const client = createClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    logger.info(`[R2] Deleted ${key}`);
  },

  isConfigured(): boolean {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
    return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);
  },
};
