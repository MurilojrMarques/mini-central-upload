import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadConfig, MAX_SIZE_MB } from '../config/upload.config.js';

export const uploadVideoMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  uploadConfig.single('video')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `O arquivo excede o limite máximo permitido de ${MAX_SIZE_MB}MB.`
          : err.message;
      res.status(400).json({ error: 'Bad Request', message });
      return;
    }
    if (err instanceof Error && err.message === 'INVALID_MIME_TYPE') {
      res.status(400).json({ error: 'Bad Request', message: 'Apenas arquivos de vídeo no formato .mp4 são aceitos.' });
      return;
    }
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: 'Erro durante o upload do vídeo.' });
      return;
    }
    next();
  });
};