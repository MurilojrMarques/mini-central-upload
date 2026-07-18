import multer from 'multer';
import { randomUUID } from 'node:crypto';
export const MAX_SIZE_MB = 20;

export const uploadConfig = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('INVALID_MIME_TYPE'));
    }
  },
});