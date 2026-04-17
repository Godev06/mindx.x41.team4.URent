import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings.model';
import { UserModel } from '../models/user.model';
import { comparePassword, hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { createUserWithOtp, issueLoginOtp, issueResetToken, verifyOtp, verifyResetOtp } from '../services/user.service';
import { OtpPurpose } from '../services/email.service';
import { createActivityOnly } from '../services/activity-notification.service';

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const buildTokenResponse = (userId: string, email: string, message: string) => ({
  token: signToken({ sub: userId, email }),
  message
});
type AuthOtpPurpose = Extract<OtpPurpose, 'register' | 'login'>;
type UnifiedOtpPurpose = OtpPurpose;

const verifyOtpWithPurpose = async (req: Request, res: Response, purpose: AuthOtpPurpose) => {
  const { email, otp } = req.body as { email: string; otp: string };
  const user = await verifyOtp(normalizeEmail(email), otp, purpose);

  if (!user) {
    return res.status(400).json({
      message: purpose === 'register' ? 'Invalid or expired OTP' : 'Invalid or expired login OTP'
    });
  }

  if (purpose === 'register') {
    try {
      await createActivityOnly({
        userId: String(user._id),
        type: 'auth',
        action: 'Email verified',
        description: 'User completed email verification via OTP'
      });
    } catch {
      // Non-fatal: activity logging failure should not block auth flow
    }

    return res.json({ message: 'Email verified successfully' });
  }

  try {
    await createActivityOnly({
      userId: String(user._id),
      type: 'auth',
      action: 'Two-factor login successful',
      description: 'User completed sign in with email OTP verification'
    });
  } catch {
    // Non-fatal: activity logging failure should not block auth flow
  }

  return res.json(buildTokenResponse(String(user._id), user.email, 'Login successful'));
};

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await createUserWithOtp(normalizeEmail(email), password);
  if (!user) return res.status(409).json({ message: 'Email already exists' });
  return res.status(201).json({ message: 'OTP has been sent to your email' });
};

export const verifyRegisterOtp = async (req: Request, res: Response) => {
  return verifyOtpWithPurpose(req, res, 'register');
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await UserModel.findOne({ email: normalizeEmail(email) });

  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const settings = await SettingsModel.findOne({ userId: user._id });
  if (settings?.twoFactorEnabled) {
    await issueLoginOtp(user);
    return res.json({
      message: 'OTP has been sent to your email to complete sign in',
      requiresTwoFactor: true
    });
  }

  try {
    await createActivityOnly({
      userId: String(user._id),
      type: 'auth',
      action: 'Login successful',
      description: 'User signed in successfully'
    });
  } catch {
    // Non-fatal: activity logging failure should not block auth flow
  }

  return res.json(buildTokenResponse(String(user._id), user.email, 'Login successful'));
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  return verifyOtpWithPurpose(req, res, 'login');
};

export const verifyAuthOtp = async (req: Request, res: Response) => {
  const { purpose, email, otp } = req.body as { purpose: UnifiedOtpPurpose; email: string; otp: string };

  if (purpose === 'reset password') {
    const user = await verifyResetOtp(normalizeEmail(email), otp);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset OTP' });
    }

    return res.json({ message: 'Reset OTP verified successfully' });
  }

  return verifyOtpWithPurpose(req, res, purpose);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await issueResetToken(normalizeEmail(email));
  if (!user) {
    return res.status(404).json({ message: 'Email not found' });
  }
  return res.json({ message: 'Reset password OTP sent to your email' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, otp, newPassword } = req.body as {
    email: string;
    token?: string;
    otp?: string;
    newPassword: string;
  };
  const resetToken = token ?? otp;
  const user = await UserModel.findOne({ email: normalizeEmail(email) });
  if (!user || !resetToken || user.resetToken !== resetToken || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = await hashPassword(newPassword);
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  try {
    await createActivityOnly({
      userId: String(user._id),
      type: 'update',
      action: 'Password reset',
      description: 'User reset account password using reset token'
    });
  } catch {
    // Non-fatal: activity logging failure should not block auth flow
  }

  return res.json({ message: 'Password reset successful' });
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const user = await UserModel.findById(userId).select(
    '-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt'
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};
