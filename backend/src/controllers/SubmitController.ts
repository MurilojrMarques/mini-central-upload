import { Request, Response, NextFunction } from 'express';
import { PreFlightPayload } from '../usecases/ExecutePreFlightUseCase.js';
import { SubmitUseCase, GateBlockedError } from '../usecases/SubmitUseCase.js';

export class SubmitController {
  constructor(private readonly submitUseCase: SubmitUseCase) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { payload } = req.body as { payload?: PreFlightPayload };
      const idempotencyKey = req.header('Idempotency-Key');

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        res.status(400).json({ error: 'Bad Request', message: 'payload obrigatório.' });
        return;
      }
      if (!idempotencyKey) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Header Idempotency-Key é obrigatório.',
        });
        return;
      }

      const job = await this.submitUseCase.execute(payload, idempotencyKey);
      res.status(201).json({ job });
    } catch (error) {
      if (error instanceof GateBlockedError) {
        res.status(409).json({
          error: 'Gate Blocked',
          message: 'Existem checks obrigatórios pendentes.',
          failedChecks: error.failedChecks,
        });
        return;
      }
      next(error);
    }
  };
}