import { Router } from 'express';

import { ExecutePreFlightUseCase } from '../usecases/ExecutePreFlightUseCase.js';
import { SubmitUseCase } from '../usecases/SubmitUseCase.js';
import { UploadVideoUseCase } from '../usecases/UploadVideoUseCase.js';

import { InMemoryValidationRepository } from '../repositories/InMemoryValidationRepository.js';
import { InMemoryJobStore } from '../repositories/InMemoryJobStore.js';
import { PreFlightSessionStore } from '../repositories/PreFlightSessionStore.js';
import { PrismaValidationRepository } from '../repositories/PrismaValidationRepository.js';

import { PreFlightController } from '../controllers/PreFlightController.js';
import { SubmitController } from '../controllers/SubmitController.js';
import { UploadVideoController } from '../controllers/UploadVideoController.js';

import { prisma } from '../config/prisma.config.js';
import { uploadVideoMiddleware } from '../middlewares/uploadVideo.middleware.js';

import { ListProfilesUseCase } from '../usecases/ListProfilesUseCase.js';
import { ProfileController } from '../controllers/ProfileController.js';
import { PrismaProfileRepository } from '../repositories/PrismaProfileRepository.js';
import { CreateProfileUseCase } from '../usecases/CreateProfileUseCase.js';

const router = Router();

const validationRepo = process.env.DATABASE_URL
  ? new PrismaValidationRepository(prisma)
  : new InMemoryValidationRepository();
const jobStore = new InMemoryJobStore();
const sessionStore = new PreFlightSessionStore();

const preFlightUseCase = new ExecutePreFlightUseCase(validationRepo);
const submitUseCase = new SubmitUseCase(preFlightUseCase, jobStore);
const uploadVideoUseCase = new UploadVideoUseCase();
const profileRepository = new PrismaProfileRepository(prisma)
const listProfilesUseCase = new ListProfilesUseCase(profileRepository);
const createProfileUseCase = new CreateProfileUseCase(prisma);

const preFlightController = new PreFlightController(preFlightUseCase, sessionStore);
const submitController = new SubmitController(submitUseCase);
const uploadVideoController = new UploadVideoController(uploadVideoUseCase);
const profileController = new ProfileController(listProfilesUseCase, createProfileUseCase);

router.post('/preflight', preFlightController.execute);
router.post('/submit', submitController.execute);
router.post('/upload', uploadVideoMiddleware, uploadVideoController.execute);
router.get('/profiles', profileController.list);
router.post('/profiles', profileController.create)

export default router;