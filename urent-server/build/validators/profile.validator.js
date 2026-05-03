"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().min(1).max(100).optional(),
    bio: zod_1.z.string().trim().max(200).optional(),
    phone: zod_1.z.string().trim().min(7).max(20).optional(),
    currentPassword: zod_1.z.string().min(6).optional(),
    newPassword: zod_1.z.string().min(6).optional()
});
exports.verifyPhoneSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1)
});
