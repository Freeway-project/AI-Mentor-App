import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { UserRepository, MentorRepository } from '@owl-mentors/database';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload, uploadDoc, uploadVideo } from '../middleware/upload.middleware';
import { CloudinaryService } from '../services/cloudinary.service';
import { R2Service } from '../services/r2.service';
import { AppError } from '../middleware/error.middleware';

const router: Router = Router();

let userRepo: UserRepository;
let mentorRepo: MentorRepository;
function getUserRepo() { if (!userRepo) userRepo = new UserRepository(); return userRepo; }
function getMentorRepo() { if (!mentorRepo) mentorRepo = new MentorRepository(); return mentorRepo; }

// ─── Avatar (Cloudinary) ────────────────────────────────────────────────────

/**
 * POST /api/upload/avatar
 * Replaces the authenticated user's profile picture on Cloudinary.
 * Field: "avatar" (multipart/form-data, image, max 5 MB)
 */
router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'NO_FILE', 'No image file provided');
      if (!CloudinaryService.isConfigured()) {
        throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary env vars missing');
      }

      const result = await CloudinaryService.uploadAvatar(req.file.buffer, req.userId!);
      await getUserRepo().update(req.userId!, { avatar: result.url } as any);

      res.json({ success: true, data: { avatarUrl: result.url } });
    } catch (error) { next(error); }
  },
);

// ─── General image (Cloudinary) ─────────────────────────────────────────────

/**
 * POST /api/upload/image
 * General-purpose image upload.
 * Field: "image" (multipart/form-data)
 * Query: ?folder=mentor-covers|general
 */
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'NO_FILE', 'No image file provided');
      if (!CloudinaryService.isConfigured()) {
        throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary env vars missing');
      }

      const folder = (req.query.folder as string) === 'mentor-covers' ? 'mentor-covers' : 'general';
      const result = await CloudinaryService.uploadImage(req.file.buffer, folder);

      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
);

/**
 * DELETE /api/upload/image
 * Delete a Cloudinary image by publicId.
 * Body: { publicId: string }
 */
router.delete(
  '/image',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId } = req.body as { publicId?: string };
      if (!publicId) throw new AppError(400, 'MISSING_PUBLIC_ID', 'publicId is required');
      if (!CloudinaryService.isConfigured()) {
        throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Cloudinary env vars missing');
      }

      await CloudinaryService.deleteImage(publicId);
      res.json({ success: true, data: { message: 'Image deleted' } });
    } catch (error) { next(error); }
  },
);

// ─── Certifications (R2) ────────────────────────────────────────────────────

/**
 * POST /api/upload/certification
 * Upload a certification file (PDF or image) for the authenticated mentor.
 * Fields: "file" (multipart), "name" (text — certification title)
 */
router.post(
  '/certification',
  authenticate,
  authorize('mentor'),
  uploadDoc.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'NO_FILE', 'No file provided');
      if (!R2Service.isConfigured()) {
        throw new AppError(503, 'R2_NOT_CONFIGURED', 'R2 env vars missing');
      }

      const certName = (req.body.name as string)?.trim();
      if (!certName) throw new AppError(400, 'MISSING_NAME', 'Certification name is required');

      const mentor = await getMentorRepo().findByUserId(req.userId!);
      if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');

      const ext = path.extname(req.file.originalname) || '.pdf';
      const key = `certifications/${mentor.id}/${Date.now()}${ext}`;
      const { url } = await R2Service.upload(req.file.buffer, key, req.file.mimetype);

      const updated = await getMentorRepo().addCertification(mentor.id, {
        name: certName,
        fileUrl: url,
        fileKey: key,
      });

      res.status(201).json({ success: true, data: { certifications: updated.certifications } });
    } catch (error) { next(error); }
  },
);

/**
 * DELETE /api/upload/certification
 * Remove a certification from R2 and the mentor record.
 * Body: { fileKey: string }
 */
router.delete(
  '/certification',
  authenticate,
  authorize('mentor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileKey } = req.body as { fileKey?: string };
      if (!fileKey) throw new AppError(400, 'MISSING_KEY', 'fileKey is required');
      if (!R2Service.isConfigured()) {
        throw new AppError(503, 'R2_NOT_CONFIGURED', 'R2 env vars missing');
      }

      const mentor = await getMentorRepo().findByUserId(req.userId!);
      if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');

      // Verify the key belongs to this mentor before deleting
      const owns = mentor.certifications.some(c => c.fileKey === fileKey);
      if (!owns) throw new AppError(403, 'FORBIDDEN', 'This file does not belong to your profile');

      await R2Service.delete(fileKey);
      const updated = await getMentorRepo().removeCertification(mentor.id, fileKey);

      res.json({ success: true, data: { certifications: updated.certifications } });
    } catch (error) { next(error); }
  },
);

// ─── Intro Video (R2) ───────────────────────────────────────────────────────

/**
 * POST /api/upload/intro-video
 * Upload or replace the mentor's intro video (optional).
 * Field: "video" (multipart/form-data, max 200 MB)
 */
router.post(
  '/intro-video',
  authenticate,
  authorize('mentor'),
  uploadVideo.single('video'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError(400, 'NO_FILE', 'No video file provided');
      if (!R2Service.isConfigured()) {
        throw new AppError(503, 'R2_NOT_CONFIGURED', 'R2 env vars missing');
      }

      const mentor = await getMentorRepo().findByUserId(req.userId!);
      if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');

      // Delete the old video from R2 if there is one
      if (mentor.introVideoKey) {
        await R2Service.delete(mentor.introVideoKey).catch(() => {});
      }

      const ext = path.extname(req.file.originalname) || '.mp4';
      const key = `intro-videos/${mentor.id}/${Date.now()}${ext}`;
      const { url } = await R2Service.upload(req.file.buffer, key, req.file.mimetype);

      await getMentorRepo().updateIntroVideo(mentor.id, url, key);

      res.json({ success: true, data: { introVideoUrl: url } });
    } catch (error) { next(error); }
  },
);

/**
 * DELETE /api/upload/intro-video
 * Remove the mentor's intro video from R2 and clear it from the profile.
 */
router.delete(
  '/intro-video',
  authenticate,
  authorize('mentor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentor = await getMentorRepo().findByUserId(req.userId!);
      if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor profile not found');
      if (!mentor.introVideoKey) {
        return res.json({ success: true, data: { message: 'No video to delete' } });
      }
      if (!R2Service.isConfigured()) {
        throw new AppError(503, 'R2_NOT_CONFIGURED', 'R2 env vars missing');
      }

      await R2Service.delete(mentor.introVideoKey);
      await getMentorRepo().clearIntroVideo(mentor.id);

      res.json({ success: true, data: { message: 'Intro video removed' } });
    } catch (error) { next(error); }
  },
);

export default router;
