import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { logger } from '@owl-mentors/utils';

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export type ImageFolder = 'avatars' | 'mentor-covers' | 'general';

export interface UploadResult {
  publicId: string;
  url: string;         // https, CDN-optimized secure URL
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const CloudinaryService = {
  /**
   * Upload an image from a Buffer (memory-stored multer file).
   * Returns the upload result including secure URL and public_id.
   */
  async uploadImage(
    buffer: Buffer,
    folder: ImageFolder = 'general',
    options: Partial<UploadApiOptions> = {},
  ): Promise<UploadResult> {
    configure();

    const defaultOptions: UploadApiOptions = {
      folder: `owlmentors/${folder}`,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      max_bytes: 5 * 1024 * 1024, // 5 MB
      ...options,
    };

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
        if (error || !result) {
          logger.error(`[CLOUDINARY] Upload failed: ${error?.message}`);
          return reject(error ?? new Error('Upload returned no result'));
        }
        logger.info(`[CLOUDINARY] Uploaded ${result.public_id} (${result.bytes} bytes)`);
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      });
      stream.end(buffer);
    });
  },

  /**
   * Upload an avatar with automatic square cropping and face detection.
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<UploadResult> {
    return CloudinaryService.uploadImage(buffer, 'avatars', {
      public_id: `user_${userId}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  },

  /**
   * Delete an image by its Cloudinary public_id.
   */
  async deleteImage(publicId: string): Promise<void> {
    configure();
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Unexpected result: ${result.result}`);
      }
      logger.info(`[CLOUDINARY] Deleted ${publicId}`);
    } catch (error) {
      logger.error(`[CLOUDINARY] Delete failed for ${publicId}: ${(error as Error).message}`);
      throw error;
    }
  },

  /**
   * Build an optimized URL for an existing asset without a new upload.
   * Useful for on-the-fly resizing/format conversion.
   *
   * @example
   * getOptimizedUrl('owlmentors/avatars/user_abc', { width: 100, height: 100, crop: 'fill' })
   */
  getOptimizedUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string; quality?: string | number; format?: string } = {},
  ): string {
    configure();
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop ?? 'fill',
          quality: options.quality ?? 'auto',
          fetch_format: options.format ?? 'auto',
        },
      ],
    });
  },

  /**
   * Check if Cloudinary is configured (all three env vars present).
   */
  isConfigured(): boolean {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
  },
};
