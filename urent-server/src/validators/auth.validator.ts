import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = registerSchema;

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
