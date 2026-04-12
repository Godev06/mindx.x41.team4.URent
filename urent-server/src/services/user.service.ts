import crypto from 'crypto';
import { env } from '../config/env';
import { UserModel } from '../models/user.model';
import { hashPassword } from '../utils/hash';
import { generateOtp } from '../utils/otp';
import { sendOtpEmail, sendResetTokenEmail } from './email.service';

const otpExpiry = () => new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000);
const resetExpiry = () => new Date(Date.now() + env.resetTokenExpiresMinutes * 60 * 1000);

export const createUserWithOtp = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    console.warn(`[auth] register skipped, email already exists: ${normalizedEmail}`);
    return null;
  }

  const otp = generateOtp();
  const user = await UserModel.create({
    email: normalizedEmail,
    password: await hashPassword(password),
    otpCode: otp,
    otpExpiresAt: otpExpiry()
  });

  await sendOtpEmail(normalizedEmail, otp);
  console.log(`[auth] register OTP generated for ${normalizedEmail}`);
  return user;
};

export const issueResetToken = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    console.warn(`[auth] forgot-password skipped, user not found: ${normalizedEmail}`);
    return null;
  }

  const token = crypto.randomInt(100000, 999999).toString();
  user.resetToken = token;
  user.resetTokenExpiresAt = resetExpiry();
  await user.save();

  await sendResetTokenEmail(normalizedEmail, token);
  console.log(`[auth] reset token generated for ${normalizedEmail}`);
  return user;
};
