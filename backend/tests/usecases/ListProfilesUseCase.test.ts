import { describe, it, expect } from 'vitest';
import { ListProfilesUseCase } from '../../src/usecases/ListProfilesUseCase.js';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.js';

// Mock da interface. findAllWithRelations é o único usado aqui;
// os outros dois existem só para satisfazer o contrato.
const makeFakeRepo = (): ProfileRepository => ({
  findAllWithRelations: async () => [
    {
      id: 'prof_alpha',
      name: 'Perfil Alpha',
      proxy: 'proxy-alpha.test:8001',
      apps: [{ id: 'app_1', name: 'App Alpha 1', token: 'token_super_secreto_abc' }],
      accounts: [
        {
          id: 'acc_1',
          actId: 'act_1001',
          pages: [{ id: 'page_101', name: 'Página 101' }],
          pixels: [{ id: 'pixel_101', name: 'Pixel 101' }],
        },
      ],
    },
  ],
  createWithRelations: async () => { throw new Error('não usado neste teste'); },
  isActIdTaken: async () => false,
});

describe('ListProfilesUseCase', () => {
  it('mascara proxy e token na resposta', async () => {
    const sut = new ListProfilesUseCase(makeFakeRepo());
    const [profile] = await sut.execute();

    expect(profile.proxyMasked).not.toBe('proxy-alpha.test:8001');
    expect(profile.apps[0].tokenMasked).not.toBe('token_super_secreto_abc');
    // o miolo do segredo não aparece
    expect(profile.proxyMasked).not.toContain('proxy-alpha');
  });

  it('não expõe os campos crus (proxy/token) na view', async () => {
    const sut = new ListProfilesUseCase(makeFakeRepo());
    const [profile] = await sut.execute();

    // a view mascarada não deve carregar o valor original
    expect((profile as any).proxy).toBeUndefined();
    expect((profile.apps[0] as any).token).toBeUndefined();
  });

  it('preserva a estrutura não-secreta (ids, nomes, hierarquia)', async () => {
    const sut = new ListProfilesUseCase(makeFakeRepo());
    const [profile] = await sut.execute();

    expect(profile.id).toBe('prof_alpha');
    expect(profile.name).toBe('Perfil Alpha');
    expect(profile.accounts[0].actId).toBe('act_1001');
    expect(profile.accounts[0].pages[0].name).toBe('Página 101');
    expect(profile.accounts[0].pixels[0].id).toBe('pixel_101');
  });

  it('lida com lista vazia sem erro', async () => {
    const repo = makeFakeRepo();
    repo.findAllWithRelations = async () => [];
    const sut = new ListProfilesUseCase(repo);
    expect(await sut.execute()).toEqual([]);
  });
});