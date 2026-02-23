import { Router, Request, Response, NextFunction } from 'express';
import { UserRepository } from '@owl-mentors/database';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { CloudinaryService } from '../services/cloudinary.service';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let userRepo: UserRepository;
function getUserRepo() {
  if (!userRepo) userRepo = new UserRepository();
  return userRepo;
}

/**
 * POST /api/upload/avatar
 * Upload (or replace) the authenticated user's profile picture.
 * Form field name: "avatar"  (multipart/form-data)
 *
 * Response:
 *   { success: true, data: { avatarUrl: string } }
 */
router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'NO_FILE', 'No image file provided');
      }

      if (!CloudinaryService.isConfigured()) {
        throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Image upload is not available — Cloudinary env vars missing');
      }

      const userId = req.userId!;
      const result = await CloudinaryService.uploadAvatar(req.file.buffer, userId);

      // Persist the new avatar URL on the user record
      await getUserRepo().update(userId, { avatar: result.url } as any);

      res.json({
        success: true,
        data: { avatarUrl: result.url },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/upload/image
 * General-purpose image upload (mentor covers, content images, etc.).
 * Form field name: "image"  (multipart/form-data)
 * Optional query param: ?folder=mentor-covers|general (default: general)
 *
 * Response:
 *   { success: true, data: { url, publicId, width, height, format, bytes } }
 */
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'NO_FILE', 'No image file provided');
      }

      if (!CloudinaryService.isConfigured()) {
        throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Image upload is not available — Cloudinary env vars missing');
      }

      const folder = (req.query.folder as string) === 'mentor-covers' ? 'mentor-covers' : 'general';
      const result = await CloudinaryService.uploadImage(req.file.buffer, folder);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /api/upload/image
 * Delete an image by its Cloudinary public_id.
 * Body: { publicId: string }
 *
 * Only authenticated users can call this — no ownership check here,
 * enforce that in the calling feature (e.g. mentor profile update).
 */
router.delete(
  '/image',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId } = req.body as { publicId?: string };
      if (!publicId) {
        throw new AppError(400, 'MISSING_PUBLIC_ID', 'publicId is required');
      }

      if (!CloudinaryService.isConfigured()) {
        throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Image service is not available');
      }

      await CloudinaryService.deleteImage(publicId);

      res.json({ success: true, data: { message: 'Image deleted' } });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
