import { PrismaClient } from '@prisma/client';
import { ProfileView } from './ListProfilesUseCase.js';
import { maskSecret } from '../utils/masker.js';

export interface CreateProfileInput {
  name: string;
  proxy: string;
  apps: { name: string; token: string }[];
  accounts: {
    actId: string;
    pages: { name: string }[];
    pixels: { name: string }[];
  }[];
}

export class InvalidProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProfileError';
    Object.setPrototypeOf(this, InvalidProfileError.prototype);
  }
}

export class CreateProfileUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  public async execute(input: CreateProfileInput): Promise<ProfileView> {
    this.validate(input);

    const created = await this.prisma.profile.create({
      data: {
        name: input.name.trim(),
        proxy: input.proxy.trim(),
        apps: {
          create: input.apps.map((a) => ({ name: a.name.trim(), token: a.token.trim() })),
        },
        accounts: {
          create: input.accounts.map((acc) => ({
            actId: acc.actId.trim(),
            pages: { create: acc.pages.map((p) => ({ name: p.name.trim() })) },
            pixels: { create: acc.pixels.map((px) => ({ name: px.name.trim() })) },
          })),
        },
      },
      include: {
        apps: true,
        accounts: { include: { pages: true, pixels: true } },
      },
    });

    return {
      id: created.id,
      name: created.name,
      proxyMasked: maskSecret(created.proxy),
      apps: created.apps.map((a) => ({ id: a.id, name: a.name, tokenMasked: maskSecret(a.token) })),
      accounts: created.accounts.map((acc) => ({
        id: acc.id,
        actId: acc.actId,
        pages: acc.pages.map((pg) => ({ id: pg.id, name: pg.name })),
        pixels: acc.pixels.map((px) => ({ id: px.id, name: px.name })),
      })),
    };
  }

  private validate(input: CreateProfileInput): void {
    if (!input || typeof input !== 'object') {
      throw new InvalidProfileError('Corpo da requisição inválido.');
    }
    if (!input.name?.trim()) {
      throw new InvalidProfileError('Nome do perfil é obrigatório.');
    }
    if (!input.proxy?.trim()) {
      throw new InvalidProfileError('Proxy é obrigatório.');
    }
    if (!Array.isArray(input.apps) || input.apps.length === 0) {
      throw new InvalidProfileError('O perfil precisa de pelo menos um aplicativo.');
    }
    if (input.apps.some((a) => !a.name?.trim() || !a.token?.trim())) {
      throw new InvalidProfileError('Cada aplicativo precisa de nome e token.');
    }
    if (!Array.isArray(input.accounts) || input.accounts.length === 0) {
      throw new InvalidProfileError('O perfil precisa de pelo menos uma conta.');
    }
    for (const acc of input.accounts) {
      if (!acc.actId?.trim()) {
        throw new InvalidProfileError('Cada conta precisa de um actId.');
      }
      if (!Array.isArray(acc.pages) || acc.pages.length === 0) {
        throw new InvalidProfileError(`A conta ${acc.actId} precisa de ao menos uma página.`);
      }
      if (!Array.isArray(acc.pixels) || acc.pixels.length === 0) {
        throw new InvalidProfileError(`A conta ${acc.actId} precisa de ao menos um pixel.`);
      }
    }
  }
}