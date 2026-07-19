import { PrismaClient } from '@prisma/client';
import { ProfileRepository, ProfileWithRelations } from './ProfileRepository.js';

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllWithRelations(): Promise<ProfileWithRelations[]> {
    return this.prisma.profile.findMany({
      include: {
        apps: true,
        accounts: { include: { pages: true, pixels: true } },
      },
    });
  }
}