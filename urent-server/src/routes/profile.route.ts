import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { getProfile, updateProfile, uploadAvatar, getFavorites, toggleFavorite } from '../controllers/profile.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../validators/profile.validator';

export const profileRouter = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

profileRouter.get('/', authGuard, getProfile);
profileRouter.patch('/', authGuard, validateBody(updateProfileSchema), updateProfile);
profileRouter.post('/avatar', authGuard, upload.single('avatar'), uploadAvatar);

// --- ROUTES CHO WISHLIST ---
profileRouter.get('/favorites', authGuard, getFavorites);
profileRouter.post('/favorites/:productId', authGuard, toggleFavorite);