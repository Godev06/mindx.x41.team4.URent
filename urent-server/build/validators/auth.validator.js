"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTwoFactorSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyOtpSchema = exports.otpSchema = exports.loginIdentitySchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const googleAuthSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1)
});
exports.registerSchema = zod_1.z.union([
    zod_1.z.object({
        username: zod_1.z.string().min(3).max(30),
        displayName: zod_1.z.string().min(1).max(100).optional(),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6)
    }),
    googleAuthSchema
]);
exports.loginSchema = zod_1.z.union([
    zod_1.z
        .object({
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().trim().min(7).max(20).optional(),
        password: zod_1.z.string().min(6)
    })
        .refine((v) => v.email !== undefined || v.phone !== undefined, {
        message: 'Provide either email or phone',
        path: ['email']
    }),
    googleAuthSchema
]);
exports.loginIdentitySchema = zod_1.z.object({
    identifier: zod_1.z.string().trim().min(1)
});
exports.otpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    otp: zod_1.z.string().length(6)
});
exports.verifyOtpSchema = exports.otpSchema.extend({
    purpose: zod_1.z.enum(['register', 'login', 'reset password'])
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.resetPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.string().email(),
    token: zod_1.z.string().min(6).optional(),
    otp: zod_1.z.string().length(6).optional(),
    newPassword: zod_1.z.string().min(6)
})
    .refine((data) => Boolean(data.token || data.otp), {
    message: 'token or otp is required',
    path: ['token']
});
exports.updateTwoFactorSchema = zod_1.z.object({
    twoFactorEnabled: zod_1.z.boolean()
});
