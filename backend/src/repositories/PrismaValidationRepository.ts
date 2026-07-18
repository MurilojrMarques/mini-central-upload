import { PrismaClient } from '@prisma/client';
import { PreFlightValidationRepository } from '../usecases/ExecutePreFlightUseCase.js';

export class PrismaValidationRepository implements PreFlightValidationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async verifyProfileApp(profileId: string, appId: string): Promise<boolean> {
    const app = await this.prisma.app.findFirst({ where: { id: appId, profileId } });
    return app !== null;
  }

  async verifyProfileAccount(profileId: string, accountId: string): Promise<boolean> {
    const acc = await this.prisma.account.findFirst({ where: { actId: accountId, profileId } });
    return acc !== null;
  }

  async verifyAccountPage(accountId: string, pageId: string): Promise<boolean> {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, account: { actId: accountId } },
    });
    return page !== null;
  }

  async verifyAccountPixel(accountId: string, pixelId: string): Promise<boolean> {
    const pixel = await this.prisma.pixel.findFirst({
      where: { id: pixelId, account: { actId: accountId } },
    });
    return pixel !== null;
  }
}