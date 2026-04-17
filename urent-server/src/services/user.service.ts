import { env } from '../config/env';
import { UserDocument, UserModel } from '../models/user.model';
import { hashPassword } from '../utils/hash';
import { generateOtp } from '../utils/otp';
import { OtpPurpose, sendOtpEmail } from './email.service';

const otpExpiry = () => new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000);
const resetExpiry = () => new Date(Date.now() + env.resetTokenExpiresMinutes * 60 * 1000);
type AuthOtpPurpose = Extract<OtpPurpose, 'register' | 'login'>;

const normalizedPurpose = (purpose: AuthOtpPurpose) => (purpose === 'register' ? 'register' : 'login');

const setOtpByPurpose = (user: UserDocument, otp: string, purpose: AuthOtpPurpose) => {
  if (purpose === 'register') {
    user.otpCode = otp;
    user.otpExpiresAt = otpExpiry();
    return;
  }

  user.loginOtpCode = otp;
  user.loginOtpExpiresAt = otpExpiry();
};

const clearOtpByPurpose = (user: UserDocument, purpose: AuthOtpPurpose) => {
  if (purpose === 'register') {
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    return;
  }

  user.loginOtpCode = undefined;
  user.loginOtpExpiresAt = undefined;
};

export const issueOtp = async (user: UserDocument, purpose: AuthOtpPurpose) => {
  const otp = generateOtp();
  setOtpByPurpose(user, otp, purpose);
  await user.save();
  await sendOtpEmail(user.email, otp, purpose);
  console.log(`[auth] ${normalizedPurpose(purpose)} OTP generated for ${user.email}`);
  return user;
};

export const verifyOtp = async (email: string, otp: string, purpose: AuthOtpPurpose) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) return null;

  const isValidRegisterOtp =
    purpose === 'register' &&
    user.otpCode === otp &&
    !!user.otpExpiresAt &&
    user.otpExpiresAt.getTime() >= Date.now();

  const isValidLoginOtp =
    purpose === 'login' &&
    user.loginOtpCode === otp &&
    !!user.loginOtpExpiresAt &&
    user.loginOtpExpiresAt.getTime() >= Date.now();

  if (!isValidRegisterOtp && !isValidLoginOtp) return null;

  if (purpose === 'register') {
    user.isEmailVerified = true;
  }

  clearOtpByPurpose(user, purpose);
  await user.save();
  return user;
};

export const verifyResetOtp = async (email: string, otp: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) return null;

  const isValidResetOtp =
    user.resetToken === otp &&
    !!user.resetTokenExpiresAt &&
    user.resetTokenExpiresAt.getTime() >= Date.now();

  return isValidResetOtp ? user : null;
};

export const createUserWithOtp = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    if (!existing.isEmailVerified) {
      await issueOtp(existing, 'register');
      console.log(`[auth] register OTP re-sent for unverified email ${normalizedEmail}`);
      return existing;
    }

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

  try {
    await sendOtpEmail(normalizedEmail, otp, 'register');
  } catch (error) {
    // Avoid keeping an unusable unverified account if mail delivery fails.
    await UserModel.findByIdAndDelete(user._id);
    throw error;
  }

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

  const token = generateOtp();
  user.resetToken = token;
  user.resetTokenExpiresAt = resetExpiry();
  await user.save();

  await sendOtpEmail(normalizedEmail, token, 'reset password');
  console.log(`[auth] reset OTP generated for ${normalizedEmail}`);
  return user;
};

export const issueLoginOtp = async (user: UserDocument) => {
  return issueOtp(user, 'login');
};
