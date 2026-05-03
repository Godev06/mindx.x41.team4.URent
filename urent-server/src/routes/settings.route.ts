import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateTwoFactorSchema } from '../validators/auth.validator';

export const settingsRouter = Router();

/**
 * @openapi
 * /api/v1/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Lấy cài đặt của user hiện tại
 *     description: Tự tạo document settings với giá trị mặc định nếu chưa tồn tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cài đặt của user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 */
settingsRouter.get('/', authGuard, getSettings);

/**
 * @openapi
 * /api/v1/settings:
 *   patch:
 *     tags: [Settings]
 *     summary: Cập nhật cài đặt bảo mật
 *     description: Hiện tại chỉ hỗ trợ bật/tắt xác thực 2 lớp (2FA) qua email OTP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsBody'
 *     responses:
 *       200:
 *         description: Cài đặt đã cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 */
settingsRouter.patch('/', authGuard, validateBody(updateTwoFactorSchema), updateSettings);
