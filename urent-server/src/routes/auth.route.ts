import { Router } from 'express';
import {
  checkLoginIdentity,
  forgotPassword,
  getFirebaseCustomToken,
  getMe,
  login,
  register,
  resetPassword,
  verifyAuthOtp
} from '../controllers/auth.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  forgotPasswordSchema,
  loginIdentitySchema,
  loginSchema,
  otpSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema
} from '../validators/auth.validator';

export const authRouter = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản
 *     description: |
 *       **Email/password**: Tạo tài khoản và gửi OTP xác minh email.  
 *       **Google (`idToken`)**: Tạo hoặc đăng nhập ngay bằng Firebase ID token — trả về JWT.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: Đăng ký email — OTP đã gửi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleMessage'
 *       200:
 *         description: Đăng ký / đăng nhập Google thành công — trả về JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       409:
 *         description: Email đã tồn tại
 */
authRouter.post('/register', validateBody(registerSchema), register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     description: |
 *       **Email + password**: Đăng nhập bằng email. Nếu bật 2FA sẽ gửi OTP và yêu cầu xác minh.  
 *       **Phone + password**: Đăng nhập bằng số điện thoại đã xác minh. Nếu bật 2FA sẽ gửi OTP và yêu cầu xác minh.  
 *       **Google (`idToken`)**: Đăng nhập bằng Firebase ID token — tạo tài khoản nếu chưa có, trả về JWT ngay.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công hoặc yêu cầu 2FA
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/TokenResponse'
 *                 - type: object
 *                   properties:
 *                     message: { type: string }
 *                     requiresTwoFactor: { type: boolean, example: true }
 *       401:
 *         description: Email/số điện thoại hoặc mật khẩu không đúng / Firebase token không hợp lệ
 */
authRouter.post('/login', validateBody(loginSchema), login);

authRouter.post('/check-login-identity', validateBody(loginIdentitySchema), checkLoginIdentity);

/**
 * @openapi
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Xác minh OTP theo purpose (register | login | reset password)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpBody'
 *     responses:
 *       200:
 *         description: Xác minh thành công
 *       400:
 *         description: OTP không hợp lệ
 */
authRouter.post('/verify-otp', validateBody(verifyOtpSchema), verifyAuthOtp);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Yêu cầu reset mật khẩu — gửi OTP về email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordBody'
 *     responses:
 *       200:
 *         description: OTP đã gửi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleMessage'
 *       404:
 *         description: Email không tồn tại
 */
authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Đặt lại mật khẩu bằng OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordBody'
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại
 *       400:
 *         description: OTP không hợp lệ hoặc hết hạn
 */
authRouter.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy thông tin user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa xác thực
 */
authRouter.get('/me', authGuard, getMe);

/**
 * @openapi
 * /api/v1/auth/firebase/custom-token:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy Firebase Custom Token để sử dụng Phone Auth
 *     description: Dùng để đăng nhập vào Firebase session trước khi xác minh số điện thoại qua SMS OTP
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Firebase custom token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *       503:
 *         description: Firebase chưa được cấu hình
 */
authRouter.get('/firebase/custom-token', authGuard, getFirebaseCustomToken);

