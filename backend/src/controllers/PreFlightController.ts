import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import {
  ExecutePreFlightUseCase,
  PreFlightPayload,
} from '../usecases/ExecutePreFlightUseCase.js';
import { PreFlightSessionStore } from '../repositories/PreFlightSessionStore.js';

export class PreFlightController {
  constructor(
    private readonly executePreFlightUseCase: ExecutePreFlightUseCase,
    private readonly sessions: PreFlightSessionStore,
  ) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { payload, sessionId } = req.body as {
        payload?: PreFlightPayload;
        sessionId?: string;
      };

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'O payload é obrigatório e deve ser um objeto válido.',
        });
        return;
      }
      const prev = sessionId ? this.sessions.get(sessionId) : undefined;

      const results = await this.executePreFlightUseCase.execute(
        payload,
        prev?.payload,
        prev?.results,
      );

      const id = sessionId ?? randomUUID();
      this.sessions.set(id, { payload, results });

      res.status(200).json({ sessionId: id, checks: results });
    } catch (error) {
      next(error);
    }
  };
}