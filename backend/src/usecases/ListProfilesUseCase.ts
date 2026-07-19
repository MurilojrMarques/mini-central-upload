import { maskSecret } from '../utils/masker.js';
import { ProfileRepository } from '../repositories/ProfileRepository.js';

export interface ProfileView {
  id: string;
  name: string;
  proxyMasked: string;
  apps: { id: string; name: string; tokenMasked: string }[];
  accounts: {
    id: string;
    actId: string;
    pages: { id: string; name: string }[];
    pixels: { id: string; name: string }[];
  }[];
}

export class ListProfilesUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  public async execute(): Promise<ProfileView[]> {
    try {
      const profiles = await this.profileRepository.findAllWithRelations();

      return profiles.map((p) => ({
        id: p.id,
        name: p.name,
        proxyMasked: maskSecret(p.proxy),
        apps: p.apps.map((a) => ({
          id: a.id,
          name: a.name,
          tokenMasked: maskSecret(a.token),
        })),
        accounts: p.accounts.map((acc) => ({
          id: acc.id,
          actId: acc.actId,
          pages: acc.pages.map((pg) => ({ id: pg.id, name: pg.name })),
          pixels: acc.pixels.map((px) => ({ id: px.id, name: px.name })),
        })),
      }));
    } catch (error) {
      console.error('[ListProfilesUseCase] Erro ao buscar perfis:', error);
      throw new Error('Não foi possível carregar a lista de perfis no momento.');
    }
  }
}