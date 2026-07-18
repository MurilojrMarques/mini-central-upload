import { describe, it, expect } from 'vitest';
import {
  ExecutePreFlightUseCase,
  CheckStatus,
  PreFlightPayload,
} from '../../src/usecases/ExecutePreFlightUseCase.js';
import { InMemoryValidationRepository } from '../../src/repositories/InMemoryValidationRepository.js';

const makeSut = () => new ExecutePreFlightUseCase(new InMemoryValidationRepository());

const validPayload: PreFlightPayload = {
  profileId: 'prof_alpha',
  appId: 'app_alpha_1',
  accountId: 'act_1001',
  pageId: 'page_101',
  pixelId: 'pixel_101',
  mediaId: 'video_1',
  campaignName: 'Campanha Teste',
  adSetCount: 3,
  budget: 100,
  link: 'https://exemplo.com',
  tracking: 'utm_source=fb',
};

const byId = (results: Awaited<ReturnType<ExecutePreFlightUseCase['execute']>>) =>
  Object.fromEntries(results.map((r) => [r.id, r]));

describe('ExecutePreFlightUseCase — reteste por escopo', () => {
  it('primeira execução: tudo é EXECUTED', async () => {
    const sut = makeSut();
    const results = await sut.execute(validPayload);
    expect(results.every((r) => r.status === CheckStatus.EXECUTED)).toBe(true);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('detecta pertencimento: pixel de outra conta reprova', async () => {
    const sut = makeSut();
    // act_2001 é do Beta; page_101/pixel_101 são da act_1001 → não pertencem
    const results = await sut.execute({
      ...validPayload,
      profileId: 'prof_beta',
      appId: 'app_beta_1',
      accountId: 'act_2001',
    });
    const checks = byId(results);
    expect(checks.check_pixel.passed).toBe(false);
    expect(checks.check_page.passed).toBe(false);
  });

  it('trocar a CONTA invalida conta/página/pixel e mantém o perfil REUSED', async () => {
    const sut = makeSut();

    // 1ª rodada: tudo válido em act_1001
    const first = await sut.execute(validPayload);

    // 2ª rodada: troca só a conta para act_1002, reenviando o resultado anterior
    const second = await sut.execute(
      { ...validPayload, accountId: 'act_1002' },
      validPayload,
      first,
    );
    const checks = byId(second);

    // Proxy/credencial pertencem ao perfil → não mudam
    expect(checks.check_profile.status).toBe(CheckStatus.REUSED);
    // Conta mudou → reexecuta
    expect(checks.check_account.status).toBe(CheckStatus.EXECUTED);
    // Página/pixel dependem da conta → reexecutam E reprovam (são da 1001)
    expect(checks.check_page.status).toBe(CheckStatus.EXECUTED);
    expect(checks.check_page.passed).toBe(false);
    expect(checks.check_pixel.status).toBe(CheckStatus.EXECUTED);
    expect(checks.check_pixel.passed).toBe(false);
    // Checks locais não tocados → reutilizados
    expect(checks.check_budget.status).toBe(CheckStatus.REUSED);
    expect(checks.check_link.status).toBe(CheckStatus.REUSED);
  });

  it('corrigir apenas o pixel reexecuta só ele; o resto vira REUSED', async () => {
    const sut = makeSut();

    // 1ª rodada com pendência: sem pixel
    const { pixelId, ...semPixel } = validPayload;
    const first = await sut.execute(semPixel as PreFlightPayload);
    expect(byId(first).check_pixel.passed).toBe(false);

    // 2ª rodada: adiciona o pixel, reenviando o estado anterior
    const second = await sut.execute(validPayload, semPixel as PreFlightPayload, first);
    const checks = byId(second);

    expect(checks.check_pixel.status).toBe(CheckStatus.EXECUTED);
    expect(checks.check_pixel.passed).toBe(true);
    // nada mais dependia do pixel → reutilizado
    ['check_video', 'check_campaign', 'check_budget', 'check_link'].forEach((id) => {
      expect(checks[id].status).toBe(CheckStatus.REUSED);
    });
  });

  it('mudar o PERFIL invalida tudo (nada é REUSED)', async () => {
    const sut = makeSut();
    const first = await sut.execute(validPayload);
    const second = await sut.execute(
      { ...validPayload, profileId: 'prof_beta', appId: 'app_beta_1', accountId: 'act_2001', pageId: 'page_201', pixelId: 'pixel_201' },
      validPayload,
      first,
    );
    expect(second.every((r) => r.status === CheckStatus.EXECUTED)).toBe(true);
  });
});     