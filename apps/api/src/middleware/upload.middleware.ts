import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
}

/**
 * Single-file upload middleware — stores file in memory as a Buffer.
 * Use `upload.single('image')` or `upload.single('avatar')` in routes.
 * Access the file via `req.file`.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});
