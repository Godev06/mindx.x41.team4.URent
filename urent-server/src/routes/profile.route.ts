import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/profile.controller';
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

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Lấy hồ sơ user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin hồ sơ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy user
 */
profileRouter.get('/', authGuard, getProfile);

/**
 * @openapi
 * /api/v1/profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Cập nhật hồ sơ
 *     description: |
 *       Cập nhật displayName, bio, phone, hoặc đổi mật khẩu.
 *       **Lưu ý:** Nếu truyền `phone` ở đây thì `isPhoneVerified` sẽ bị reset về `false`.
 *       Dùng `POST /api/v1/profile/verify-phone` để lưu số điện thoại đã xác minh qua Firebase SMS OTP.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileBody'
 *     responses:
 *       200:
 *         description: Hồ sơ đã cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Mật khẩu hiện tại không đúng
 */
profileRouter.patch('/', authGuard, validateBody(updateProfileSchema), updateProfile);

/**
 * @openapi
 * /api/v1/profile/avatar:
 *   post:
 *     tags: [Profile]
 *     summary: Upload ảnh đại diện
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh JPEG/PNG/WebP/GIF, tối đa 5 MB
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatarUrl: { type: string }
 *                 publicId: { type: string }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Không có file hoặc định dạng không hợp lệ
 */
profileRouter.post('/avatar', authGuard, upload.single('avatar'), uploadAvatar);

