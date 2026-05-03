import { Request, Response } from 'express';
import { admin, isFirebaseAdminInitialized } from '../config/firebase';
import { SettingsModel } from '../models/settings.model';
import { UserModel } from '../models/user.model';
import { comparePassword, hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import {
  createUserWithOtp,
  issueLoginOtp,
  issueResetToken,
  verifyOtp,
  verifyResetOtp
} from '../services/user.service';
import { OtpPurpose } from '../services/email.service';
import { createActivityOnly } from '../services/activity-notification.service';
import { verifyAccessToken } from '../utils/auth-token';
import { resolveAppIdentity } from '../services/auth-identity.service';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/api-response';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthOtpPurpose = Extract<OtpPurpose, 'register' | 'login'>;
type UnifiedOtpPurpose = OtpPurpose;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const looksLikeEmail = (value: string) => value.includes('@');
const hasLocalPasswordProvider = (authProviders: string[] | undefined) =>
  (authProviders ?? []).includes('local');
const isGoogleOnlyAccount = (authProviders: string[] | undefined, username?: string) => {
  const providers = authProviders ?? [];
  if (providers.includes('google') && !providers.includes('local')) {
    return true;
  }

  return providers.length === 0 && !username?.trim();
};

const buildTokenPayload = (userId: string, email: string, message: string) => ({
  token: signToken({ sub: userId, email }),
  message
});

const buildFirebaseUid = (userId: string) => `urent_${userId}`;

const isFirebaseUserNotFoundError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === 'auth/user-not-found';

const ensureFirebaseAuthUser = async (
  userId: string,
  email: string,
  displayName?: string
): Promise<string> => {
  const uid = buildFirebaseUid(userId);
  const payload = {
    email,
    emailVerified: true,
    ...(displayName ? { displayName } : {})
  };

  try {
    const existing = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(existing.uid, payload);
    return existing.uid;
  } catch (error) {
    if (!isFirebaseUserNotFoundError(error)) throw error;
  }

  try {
    await admin.auth().updateUser(uid, payload);
  } catch (error) {
    if (!isFirebaseUserNotFoundError(error)) throw error;
    await admin.auth().createUser({ uid, ...payload });
  }

  return uid;
};

const logActivity = async (params: {
  userId: string;
  type: 'auth' | 'order' | 'message' | 'update';
  action: string;
  description: string;
}) => {
  try {
    await createActivityOnly(params);
  } catch {
    // Non-fatal: activity logging failure should not block auth flow
  }
};

// ─── Private handlers ────────────────────────────────────────────────────────

const verifyOtpWithPurpose = async (
  req: Request,
  res: Response,
  purpose: AuthOtpPurpose
) => {
  const { email, otp } = req.body as { email: string; otp: string };
  const user = await verifyOtp(normalizeEmail(email), otp, purpose);

  if (!user) {
    throw new AppError(
      400,
      'INVALID_OTP',
      purpose === 'register' ? 'Invalid or expired OTP' : 'Invalid or expired login OTP'
    );
  }

  if (purpose === 'register') {
    await logActivity({
      userId: String(user._id),
      type: 'auth',
      action: 'Email verified',
      description: 'User completed email verification via OTP'
    });
    return sendSuccess(res, { message: 'Email verified successfully' });
  }

  await logActivity({
    userId: String(user._id),
    type: 'auth',
    action: 'Two-factor login successful',
    description: 'User completed sign in with email OTP verification'
  });

  return sendSuccess(res, buildTokenPayload(String(user._id), user.email, 'Login successful'));
};

const handleGoogleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken || typeof idToken !== 'string') {
    throw new AppError(400, 'MISSING_ID_TOKEN', 'Missing Firebase ID token');
  }

  if (!isFirebaseAdminInitialized()) {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Firebase auth is not configured');
  }

  let identity;
  try {
    identity = await verifyAccessToken(idToken);
  } catch {
    throw new AppError(401, 'INVALID_ID_TOKEN', 'Invalid Firebase ID token');
  }

  if (identity.authProvider !== 'firebase') {
    throw new AppError(400, 'INVALID_TOKEN_TYPE', 'Token is not a Firebase ID token');
  }

  if (!identity.email) {
    throw new AppError(400, 'MISSING_EMAIL', 'Google account does not provide email');
  }

  const appIdentity = await resolveAppIdentity(identity);
  const user = await UserModel.findById(appIdentity.sub).select(
    '-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt'
  );

  await logActivity({
    userId: appIdentity.sub,
    type: 'auth',
    action: 'Google login successful',
    description: 'User signed in with Google account'
  });

  return sendSuccess(res, {
    token: signToken({ sub: appIdentity.sub, email: appIdentity.email }),
    user,
    message: 'Login with Google successful'
  });
};

// ─── Exported route handlers ─────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  const body = req.body as {
    email?: string;
    password?: string;
    username?: string;
    displayName?: string;
    idToken?: string;
  };

  if (body.idToken) return handleGoogleAuth(req, res);

  const { email, password, username, displayName } = body as {
    email: string;
    password: string;
    username: string;
    displayName?: string;
  };

  const user = await createUserWithOtp(normalizeEmail(email), password, username, displayName);

  if (!user) {
    throw new AppError(409, 'EMAIL_EXISTS', 'Email already exists');
  }

  return sendSuccess(res, { message: 'OTP has been sent to your email' }, undefined, 201);
};

export const login = async (req: Request, res: Response) => {
  const body = req.body as {
    email?: string;
    phone?: string;
    password?: string;
    idToken?: string;
  };

  if (body.idToken) return handleGoogleAuth(req, res);

  const { email, phone, password } = body as {
    email?: string;
    phone?: string;
    password: string;
  };

  const user = email
    ? await UserModel.findOne({ email: normalizeEmail(email) })
    : await UserModel.findOne({ phone: phone!.trim() });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  if (!user.password || isGoogleOnlyAccount(user.authProviders, user.username)) {
    await issueResetToken(user.email);
    return sendSuccess(res, {
      email: user.email,
      message: 'This account does not have a password yet. OTP has been sent to your email to create one',
      requiresPasswordSetup: true
    });
  }

  if (!(await comparePassword(password, user.password))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  if (!hasLocalPasswordProvider(user.authProviders)) {
    user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
    await user.save();
  }

  const settings = await SettingsModel.findOne({ userId: user._id });

  if (settings?.twoFactorEnabled) {
    await issueLoginOtp(user);
    return sendSuccess(res, {
      message: 'OTP has been sent to your email to complete sign in',
      requiresTwoFactor: true
    });
  }

  await logActivity({
    userId: String(user._id),
    type: 'auth',
    action: 'Login successful',
    description: 'User signed in successfully'
  });

  return sendSuccess(res, buildTokenPayload(String(user._id), user.email, 'Login successful'));
};

export const checkLoginIdentity = async (req: Request, res: Response) => {
  const { identifier } = req.body as { identifier: string };
  const trimmedIdentifier = identifier.trim();

  const identityType = looksLikeEmail(trimmedIdentifier) ? 'email' : 'phone';
  const query =
    identityType === 'email'
      ? { email: normalizeEmail(trimmedIdentifier) }
      : { phone: trimmedIdentifier };

  const user = await UserModel.findOne(query).select('_id email password authProviders username');

  if (!user) {
    throw new AppError(
      404,
      'USER_NOT_FOUND',
      identityType === 'email'
        ? 'Email is not registered yet'
        : 'Phone number is not registered yet'
    );
  }

  const requiresPasswordSetup = !user.password || isGoogleOnlyAccount(user.authProviders, user.username);

  if (requiresPasswordSetup) {
    await issueResetToken(user.email);
  }

  return sendSuccess(res, {
    exists: true,
    method: identityType,
    identifier: identityType === 'email' ? normalizeEmail(trimmedIdentifier) : trimmedIdentifier,
    email: user.email,
    requiresPasswordSetup
  });
};

export const verifyAuthOtp = async (req: Request, res: Response) => {
  const { purpose, email, otp } = req.body as {
    purpose: UnifiedOtpPurpose;
    email: string;
    otp: string;
  };

  if (purpose === 'reset password') {
    const user = await verifyResetOtp(normalizeEmail(email), otp);
    if (!user) {
      throw new AppError(400, 'INVALID_OTP', 'Invalid or expired reset OTP');
    }
    return sendSuccess(res, { message: 'Reset OTP verified successfully' });
  }

  return verifyOtpWithPurpose(req, res, purpose);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const user = await issueResetToken(normalizeEmail(email));

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Email not found');
  }

  return sendSuccess(res, { message: 'Reset password OTP sent to your email' });
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

  if (
    !user ||
    !resetToken ||
    user.resetToken !== resetToken ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt.getTime() < Date.now()
  ) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
  }

  user.password = await hashPassword(newPassword);
  user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  await logActivity({
    userId: String(user._id),
    type: 'update',
    action: 'Password reset',
    description: 'User reset account password using reset token'
  });

  return sendSuccess(res, { message: 'Password reset successful' });
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  const user = await UserModel.findById(userId).select(
    '-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt'
  );

  if (!user && req.user?.authProvider === 'firebase') {
    return sendSuccess(res, {
      id: req.user.sub,
      email: req.user.email,
      displayName: req.user.displayName ?? req.user.email,
      avatarUrl: req.user.avatarUrl ?? null,
      phone: req.user.phoneNumber ?? null,
      bio: null,
      createdAt: null
    });
  }

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return sendSuccess(res, user);
};

export const getFirebaseCustomToken = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  if (!isFirebaseAdminInitialized()) {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Firebase phone verification is not configured');
  }

  const user = await UserModel.findById(userId).select('email displayName');

  if (!user?.email) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const firebaseUid = await ensureFirebaseAuthUser(
    String(user._id),
    normalizeEmail(user.email),
    user.displayName?.trim() || undefined
  );

  const token = await admin.auth().createCustomToken(firebaseUid);

  return sendSuccess(res, { token });
};
