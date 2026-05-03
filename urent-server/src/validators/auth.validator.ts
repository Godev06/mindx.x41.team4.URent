import { z } from 'zod';

const googleAuthSchema = z.object({
  idToken: z.string().min(1)
});

export const registerSchema = z.union([
  z.object({
    username: z.string().min(3).max(30),
    displayName: z.string().min(1).max(100).optional(),
    email: z.string().email(),
    password: z.string().min(6)
  }),
  googleAuthSchema
]);

export const loginSchema = z.union([
  z
    .object({
      email: z.string().email().optional(),
      phone: z.string().trim().min(7).max(20).optional(),
      password: z.string().min(6)
    })
    .refine((v) => v.email !== undefined || v.phone !== undefined, {
      message: 'Provide either email or phone',
      path: ['email']
    }),
  googleAuthSchema
]);

export const loginIdentitySchema = z.object({
  identifier: z.string().trim().min(1)
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
