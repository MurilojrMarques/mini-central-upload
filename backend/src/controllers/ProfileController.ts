import { Request, Response, NextFunction } from 'express';
import { ListProfilesUseCase } from '../usecases/ListProfilesUseCase.js';
import { CreateProfileUseCase, InvalidProfileError } from '../usecases/CreateProfileUseCase.js';

export class ProfileController {
  constructor(
    private readonly listProfilesUseCase: ListProfilesUseCase,
    private readonly createProfileUseCase: CreateProfileUseCase,
  ) {}

  public list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this.listProfilesUseCase.execute();
      res.status(200).json({ profiles });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.createProfileUseCase.execute(req.body);
      res.status(201).json({ profile });
    } catch (error) {
      if (error instanceof InvalidProfileError) {
        res.status(400).json({ error: 'Bad Request', message: error.message });
        return;
      }
      next(error);
    }
  };
}