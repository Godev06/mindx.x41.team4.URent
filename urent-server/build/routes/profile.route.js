"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = require("express");
const multer_1 = __importStar(require("multer"));
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const profile_validator_1 = require("../validators/profile.validator");
exports.profileRouter = (0, express_1.Router)();
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = (0, multer_1.default)({
    storage: (0, multer_1.memoryStorage)(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
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
exports.profileRouter.get('/', auth_middleware_1.authGuard, profile_controller_1.getProfile);
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
exports.profileRouter.patch('/', auth_middleware_1.authGuard, (0, validate_middleware_1.validateBody)(profile_validator_1.updateProfileSchema), profile_controller_1.updateProfile);
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
exports.profileRouter.post('/avatar', auth_middleware_1.authGuard, upload.single('avatar'), profile_controller_1.uploadAvatar);
/**
 * @openapi
 * /api/v1/profile/verify-phone:
 *   post:
 *     tags: [Profile]
 *     summary: Xác minh & lưu số điện thoại qua Firebase SMS OTP
 *     description: |
 *       Luồng:
 *       1. Client lấy Firebase Custom Token từ `GET /api/auth/firebase/custom-token`
 *       2. Dùng token đó để `signInWithCustomToken` vào Firebase
 *       3. Gọi `signInWithPhoneNumber` → Firebase gửi SMS OTP
 *       4. Xác minh OTP → `linkWithCredential`
 *       5. Lấy ID token mới (`getIdToken(true)`) — token này chứa `phone_number` claim
 *       6. Gửi ID token đó lên endpoint này để lưu số điện thoại đã xác minh
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPhoneBody'
 *     responses:
 *       200:
 *         description: Số điện thoại đã xác minh và lưu vào profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Token không chứa phone_number claim
 *       401:
 *         description: Firebase ID token không hợp lệ
 *       403:
 *         description: Firebase ID token không thuộc về user hiện tại
 *       409:
 *         description: Số điện thoại đã liên kết với tài khoản khác
 *       503:
 *         description: Firebase chưa được cấu hình
 */
exports.profileRouter.post('/verify-phone', auth_middleware_1.authGuard, (0, validate_middleware_1.validateBody)(profile_validator_1.verifyPhoneSchema), profile_controller_1.verifyPhone);
