import { describe, it, expect } from 'vitest';
import { ExecutePreFlightUseCase } from '../../src/usecases/ExecutePreFlightUseCase.js';
import { SubmitUseCase, GateBlockedError } from '../../src/usecases/SubmitUseCase.js';
import { InMemoryValidationRepository } from '../../src/repositories/InMemoryValidationRepository.js';
import { InMemoryJobStore } from '../../src/repositories/InMemoryJobStore.js';

const validPayload = {
  profileId: 'prof_alpha', appId: 'app_alpha_1', accountId: 'act_1001',
  pageId: 'page_101', pixelId: 'pixel_101', mediaId: 'video_1',
  campaignName: 'Campanha Teste', adSetCount: 3, budget: 100,
  link: 'https://exemplo.com', tracking: 'utm_source=fb',
};

const makeSut = () => {
  const preflight = new ExecutePreFlightUseCase(new InMemoryValidationRepository());
  return new SubmitUseCase(preflight, new InMemoryJobStore());
};

describe('SubmitUseCase — gate e idempotência', () => {
  it('mesma Idempotency-Key devolve o mesmo jobId', async () => {
    const sut = makeSut();
    const a = await sut.execute(validPayload, 'chave-1');
    const b = await sut.execute(validPayload, 'chave-1');
    expect(b.jobId).toBe(a.jobId);
    expect(b.status).toBe('PAUSED');
  });

  it('chaves diferentes criam jobs diferentes', async () => {
    const sut = makeSut();
    const a = await sut.execute(validPayload, 'chave-A');
    const b = await sut.execute(validPayload, 'chave-B');
    expect(b.jobId).not.toBe(a.jobId);
  });

  it('gate bloqueia quando falta pixel, independente do front', async () => {
    const sut = makeSut();
    const { pixelId, ...semPixel } = validPayload;
    await expect(sut.execute(semPixel as typeof validPayload, 'chave-2'))
      .rejects.toBeInstanceOf(GateBlockedError);
  });

  it('gate bloqueia quando o ativo não pertence à conta', async () => {
    const sut = makeSut();
    // pixel_101 não pertence à act_2001
    const errado = { ...validPayload, profileId: 'prof_beta', appId: 'app_beta_1', accountId: 'act_2001' };
    await expect(sut.execute(errado, 'chave-3'))
      .rejects.toBeInstanceOf(GateBlockedError);
  });

  it('erro do gate carrega os checks que falharam', async () => {
    const sut = makeSut();
    const { pixelId, ...semPixel } = validPayload;
    try {
      await sut.execute(semPixel as typeof validPayload, 'chave-4');
      expect.fail('deveria ter lançado GateBlockedError');
    } catch (e) {
      expect(e).toBeInstanceOf(GateBlockedError);
      expect((e as GateBlockedError).failedChecks.some((c) => c.id === 'check_pixel')).toBe(true);
    }
  });
});