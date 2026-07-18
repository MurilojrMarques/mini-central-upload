// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpa antes, para o seed poder rodar várias vezes sem estourar id duplicado.
  // Ordem importa por causa das FKs: filhos antes dos pais.
  await prisma.pixel.deleteMany();
  await prisma.page.deleteMany();
  await prisma.account.deleteMany();
  await prisma.app.deleteMany();
  await prisma.profile.deleteMany();

  // PERFIL ALPHA — duas contas, de propósito (permite a demo de invalidação da seção 6)
  await prisma.profile.create({
    data: {
      id: 'prof_alpha',
      name: 'Perfil Alpha',
      proxy: 'proxy-alpha.test:8001',
      apps: {
        create: [
          { id: 'app_alpha_1', name: 'App Alpha 1', token: 'tok_alpha_1_ficticio' },
          { id: 'app_alpha_2', name: 'App Alpha 2', token: 'tok_alpha_2_ficticio' },
        ],
      },
      accounts: {
        create: [
          {
            id: 'uuid_act_1001',
            actId: 'act_1001',
            pages: { create: [{ id: 'page_101', name: 'Página 101' }] },
            pixels: { create: [{ id: 'pixel_101', name: 'Pixel 101' }] },
          },
          {
            id: 'uuid_act_1002',
            actId: 'act_1002',
            pages: { create: [{ id: 'page_102', name: 'Página 102' }] },
            pixels: { create: [{ id: 'pixel_102', name: 'Pixel 102' }] },
          },
        ],
      },
    },
  });

  // PERFIL BETA — uma conta
  await prisma.profile.create({
    data: {
      id: 'prof_beta',
      name: 'Perfil Beta',
      proxy: 'proxy-beta.test:8002',
      apps: {
        create: [{ id: 'app_beta_1', name: 'App Beta 1', token: 'tok_beta_1_ficticio' }],
      },
      accounts: {
        create: [
          {
            id: 'uuid_act_2001',
            actId: 'act_2001',
            pages: { create: [{ id: 'page_201', name: 'Página 201' }] },
            pixels: { create: [{ id: 'pixel_201', name: 'Pixel 201' }] },
          },
        ],
      },
    },
  });

  console.log('Seed concluído: Alpha (2 contas) e Beta (1 conta).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });