import { Router } from 'express';

import { ExecutePreFlightUseCase } from '../usecases/ExecutePreFlightUseCase.js';
import { SubmitUseCase } from '../usecases/SubmitUseCase.js';

import { InMemoryValidationRepository } from '../repositories/InMemoryValidationRepository.js';
import { InMemoryJobStore } from '../repositories/InMemoryJobStore.js';
import { PreFlightSessionStore } from '../repositories/PreFlightSessionStore.js';

import { PreFlightController } from '../controllers/PreFlightController.js';
import { SubmitController } from '../controllers/SubmitController.js';
import { prisma } from '../config/prisma.config.js';
import { PrismaValidationRepository } from '../repositories/PrismaValidationRepository.js';

const router = Router();
const validationRepo = process.env.DATABASE_URL
  ? new PrismaValidationRepository(prisma)
  : new InMemoryValidationRepository();
const jobStore = new InMemoryJobStore();
const sessionStore = new PreFlightSessionStore();

const preFlightUseCase = new ExecutePreFlightUseCase(validationRepo);
const submitUseCase = new SubmitUseCase(preFlightUseCase, jobStore);

const preFlightController = new PreFlightController(preFlightUseCase, sessionStore);
const submitController = new SubmitController(submitUseCase);

router.post('/preflight', preFlightController.execute);
router.post('/submit', submitController.execute);

export default router;