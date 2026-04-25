import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
});

export const verifyOtpSchema = otpSchema.extend({
  purpose: z.enum(['register', 'login', 'reset password'])
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(6).optional(),
    otp: z.string().length(6).optional(),
    newPassword: z.string().min(6)
  })
  .refine((data) => Boolean(data.token || data.otp), {
    message: 'token or otp is required',
    path: ['token']
  });

export const updateTwoFactorSchema = z.object({
  twoFactorEnabled: z.boolean()
});
