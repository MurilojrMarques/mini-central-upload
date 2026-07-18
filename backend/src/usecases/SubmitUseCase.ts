import { randomUUID } from 'node:crypto';
import {
  ExecutePreFlightUseCase,
  PreFlightPayload,
  CheckResult,
} from './ExecutePreFlightUseCase.js';

export type JobStatus = 'PAUSED';

export interface Job {
  jobId: string;
  status: JobStatus;
  createdAt: string;
}

export interface JobStore {
  findByKey(key: string): Promise<Job | undefined>;
  /**
   * Persiste o job apenas se a chave ainda não existir (atômico na camada de storage).
   * Retorna o job efetivamente persistido — o novo, ou o pré-existente em caso de corrida.
   * Em produção isso vira uma constraint UNIQUE (SQL) ou SET NX (Redis).
   */
  saveIfAbsent(key: string, job: Job): Promise<Job>;
}

export class GateBlockedError extends Error {
  constructor(public readonly failedChecks: CheckResult[]) {
    super('Gate reprovado: existem checks obrigatórios pendentes.');
    this.name = 'GateBlockedError';
  }
}

export class MissingIdempotencyKeyError extends Error {
  constructor() {
    super('Idempotency-Key é obrigatória.');
    this.name = 'MissingIdempotencyKeyError';
  }
}

export class SubmitUseCase {
  constructor(
    private readonly preFlight: ExecutePreFlightUseCase,
    private readonly jobs: JobStore,
  ) {}

  public async execute(payload: PreFlightPayload, idempotencyKey: string): Promise<Job> {
    if (!idempotencyKey?.trim()) {
      throw new MissingIdempotencyKeyError();
    }
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload inválido.');
    }

    const existing = await this.jobs.findByKey(idempotencyKey);
    if (existing) return existing;

    const results = await this.preFlight.execute(payload);
    const blocking = results.filter((r) => r.isObligatory && !r.passed);
    if (blocking.length > 0) {
      throw new GateBlockedError(blocking);
    }

    const job: Job = {
      jobId: `job_${randomUUID()}`,
      status: 'PAUSED',
      createdAt: new Date().toISOString(),
    };
    return this.jobs.saveIfAbsent(idempotencyKey, job);
  }
}