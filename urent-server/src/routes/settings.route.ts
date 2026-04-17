import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateTwoFactorSchema } from '../validators/auth.validator';

export const settingsRouter = Router();

settingsRouter.get('/', authGuard, getSettings);
settingsRouter.patch('/', authGuard, validateBody(updateTwoFactorSchema), updateSettings);