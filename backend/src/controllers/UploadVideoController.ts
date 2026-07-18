import { Request, Response, NextFunction } from 'express';
import { UploadVideoUseCase, InvalidVideoError } from '../usecases/UploadVideoUseCase.js';

export class UploadVideoController {
  constructor(private readonly uploadVideoUseCase: UploadVideoUseCase) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file; 
      const record = await this.uploadVideoUseCase.execute(
        file
          ? { originalName: file.originalname, sizeBytes: file.size, mimeType: file.mimetype }
          : undefined,
      );
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof InvalidVideoError) {
        res.status(400).json({ error: 'Bad Request', message: error.message });
        return;
      }
      next(error);
    }
  };
}