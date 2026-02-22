import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@owl-mentors/utils';
import crypto from 'crypto';

/**
 * Configure the S3 Client for Cloudflare R2.
 * Requires the following environment variables:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL (Optional: if you have a custom domain mapped to the bucket)
 */
const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || '';
const publicUrl = process.env.R2_PUBLIC_URL || '';

// Initialize S3 Client compatible with Cloudflare R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export const StorageService = {
    /**
     * Upload an object (e.g., a PDF resume) to Cloudflare R2.
     *
     * @param fileBuffer The file data buffer.
     * @param mimeType The file mime type (e.g., 'application/pdf').
     * @param originalName The original file name.
     * @param folder Optional folder path (e.g., 'resumes').
     * @returns The generated key (filepath) and the public/presigned URL.
     */
    async uploadFile(fileBuffer: Buffer, mimeType: string, originalName: string, folder = 'uploads') {
        if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
            logger.warn('[StorageService] Missing R2 credentials. Upload bypassed.');
            return { key: null, url: null };
        }

        try {
            // Create a unique file key
            const fileExtension = originalName.split('.').pop() || 'tmp';
            const uniqueId = crypto.randomBytes(16).toString('hex');
            const key = `${folder}/${uniqueId}.${fileExtension}`;

            // Upload to R2
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
            });

            await s3Client.send(command);
            logger.info(`[StorageService] Uploaded file to R2: ${key}`);

            // Return generated URLs
            return {
                key,
                // If there's a custom domain, use it. Otherwise, rely on presigned URLs later.
                url: publicUrl ? `${publicUrl}/${key}` : null,
            };
        } catch (error) {
            logger.error('[StorageService] R2 Upload Error:', error);
            throw new Error('Failed to upload file to storage');
        }
    },

    /**
     * Get a temporary, presigned URL to securely view/download a private file.
     * Useful if your R2 bucket is private and not mapped to a public custom domain.
     * 
     * @param key The file key in the bucket
     * @param expiresIn Seconds until the link expires (default 1 hour)
     */
    async getPresignedDownloadUrl(key: string, expiresIn = 3600) {
        if (!accountId || !key) return null;

        try {
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            });

            return await getSignedUrl(s3Client, command, { expiresIn });
        } catch (error) {
            logger.error('[StorageService] R2 Presign Error:', error);
            throw new Error('Failed to generate download link');
        }
    },

    /**
     * Delete a file from Cloudflare R2.
     * 
     * @param key The file key in the bucket
     */
    async deleteFile(key: string) {
        if (!accountId || !key) return;

        try {
            const command = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            });
            await s3Client.send(command);
            logger.info(`[StorageService] Deleted file from R2: ${key}`);
        } catch (error) {
            logger.error('[StorageService] R2 Delete Error:', error);
            throw new Error('Failed to delete file from storage');
        }
    }
};
