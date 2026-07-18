import { PreFlightValidationRepository } from '../usecases/ExecutePreFlightUseCase.js';

const DB: Record<string, {
  apps: string[];
  accounts: Record<string, { pages: string[]; pixels: string[] }>;
}> = {
  prof_alpha: {
    apps: ['app_alpha_1', 'app_alpha_2'],
    accounts: {
      act_1001: { pages: ['page_101'], pixels: ['pixel_101'] },
      act_1002: { pages: ['page_102'], pixels: ['pixel_102'] },
    },
  },
  prof_beta: {
    apps: ['app_beta_1'],
    accounts: {
      act_2001: { pages: ['page_201'], pixels: ['pixel_201'] },
    },
  },
};

export class InMemoryValidationRepository implements PreFlightValidationRepository {
  async verifyProfileApp(profileId: string, appId: string) {
    return !!DB[profileId]?.apps.includes(appId);
  }
  async verifyProfileAccount(profileId: string, accountId: string) {
    return !!DB[profileId]?.accounts[accountId];
  }
  async verifyAccountPage(accountId: string, pageId: string) {
    return Object.values(DB).some(p => p.accounts[accountId]?.pages.includes(pageId));
  }
  async verifyAccountPixel(accountId: string, pixelId: string) {
    return Object.values(DB).some(p => p.accounts[accountId]?.pixels.includes(pixelId));
  }
}