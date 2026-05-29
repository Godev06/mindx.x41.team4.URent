import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { uploadImage } from '../services/cloudinary.service';
import { authGuard } from '../middlewares/auth.middleware';

export const uploadRouter = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed') as any, false);
    }
  },
});

uploadRouter.post('/upload', authGuard, upload.single('image'), async (req: any, res: any, next: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'No file provided' } });
    }
    const { url } = await uploadImage(req.file.buffer, 'products');
    return res.json({ success: true, url });
  } catch (error) {
    next(error);
  }
});
