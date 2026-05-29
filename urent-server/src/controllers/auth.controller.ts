import crypto from "crypto";
import { Request, Response } from "express";
import { admin, isFirebaseAdminInitialized } from "../config/firebase";
import { env } from "../config/env";
import { SettingsModel } from "../models/settings.model";
import { UserModel } from "../models/user.model";
import { comparePassword, hashPassword } from "../utils/hash";
import { Role, signToken } from "../utils/jwt";

import {
  createUserWithOtp,
  issueLoginOtp,
  issueResetToken,
  issueOtp,
  verifyOtp,
  verifyResetOtp,
} from "../services/user.service";
import { OtpPurpose } from "../services/email.service";
import { sendWelcomeMessageFromAdmin } from "../services/welcome-message.service";
import { authEvents } from "../events/user-events";
import { createActivityOnly } from "../services/activity-notification.service";
import { getClientIp, parseUserAgent, estimateLocation, evaluateRiskLevel } from "../utils/request-metadata";
import { verifyAccessToken } from "../utils/auth-token";
import { resolveAppIdentity } from "../services/auth-identity.service";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthOtpPurpose = Extract<OtpPurpose, "register" | "login">;
type UnifiedOtpPurpose = OtpPurpose;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const looksLikeEmail = (value: string) => value.includes("@");
const hasLocalPasswordProvider = (authProviders: string[] | undefined) =>
  (authProviders ?? []).includes("local");
const isGoogleOnlyAccount = (
  authProviders: string[] | undefined,
  username?: string,
) => {
  const providers = authProviders ?? [];
  if (providers.includes("google") && !providers.includes("local")) {
    return true;
  }

  return providers.length === 0 && !username?.trim();
};

type JwtSignPayload = {
  sub: string;
  email: string;
  role: Role;
};

const buildTokenPayload = async (
  userId: string,
  email: string,
  message: string,
  role: Role,
): Promise<{ token: string; message: string }> => ({
  token: await signToken({
    sub: userId,
    email,
    role,
  } satisfies JwtSignPayload),
  message,
});

const buildFirebaseUid = (userId: string) => `urent_${userId}`;

const ensureFirebaseAuthUser = async (
  userId: string,
  email: string,
  displayName?: string,
): Promise<string> => {
  const firebaseUid = buildFirebaseUid(userId);
  // If Firebase admin is not initialized (dev environment), just return a
  // deterministic uid without calling the admin SDK so the backend remains
  // functional for non-Firebase flows.
  if (!isFirebaseAdminInitialized()) {
    return firebaseUid;
  }

  try {
    await admin.auth().getUser(firebaseUid);
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      await admin.auth().createUser({
        uid: firebaseUid,
        email,
        displayName,
      });
    } else {
      throw error;
    }
  }
  return firebaseUid;
};

const logActivity = async (params: {
  userId: string;
  type: "auth" | "order" | "message" | "update" | "login" | "logout" | "profile_update" | "password_change" | "settings_change";
  action: string;
  description: string;
  req?: Request;
}) => {
  try {
    let metadata: any = {};
    if (params.req) {
      const ip = getClientIp(params.req);
      const parsedUa = parseUserAgent(params.req.headers["user-agent"]);
      const location = estimateLocation(ip);
      const risk = evaluateRiskLevel(params.req.headers["user-agent"]);
      metadata = {
        ip,
        userAgent: params.req.headers["user-agent"] || "",
        location,
        device: `${parsedUa.browser} / ${parsedUa.device}`,
        riskLevel: risk,
      };
    }
    await createActivityOnly({
      userId: params.userId,
      action: params.action,
      description: params.description,
      type: params.type as any,
      ...metadata,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// ─── Private handlers ──────────────────────────────────────────────────    ──────

const verifyOtpWithPurpose = async (
  req: Request,
  res: Response,
  purpose: AuthOtpPurpose,
) => {
  const { email, otp } = req.body as { email: string; otp: string };
  const user = await verifyOtp(normalizeEmail(email), otp, purpose);

  if (!user) {
    throw new AppError(
      400,
      "INVALID_OTP",
      purpose === "register"
        ? "Invalid or expired OTP"
        : "Invalid or expired login OTP",
    );
  }

  if (purpose === "register") {
    await logActivity({
      userId: String(user._id),
      type: "auth",
      action: "Email verified",
      description: "User completed email verification via OTP",
      req,
    });
    // Gửi tin nhắn chào mừng từ Admin sau khi user xác thực email thành công (non-blocking)
    sendWelcomeMessageFromAdmin(String(user._id));
    // Phát sự kiện để tạo support room (Event-Driven, non-blocking)
    authEvents.emit("user.registered", { userId: String(user._id) });
    return sendSuccess(res, { message: "Email verified successfully" });
  }

  await logActivity({
    userId: String(user._id),
    type: "login",
    action: "Two-factor login successful",
    description: "User completed sign in with email OTP verification",
    req,
  });

  const payload = await buildTokenPayload(
    String(user._id),
    user.email,
    "Login successful",
    user.role,
  );

  return sendSuccess(res, payload);
};

const handleGoogleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken || typeof idToken !== "string") {
    throw new AppError(400, "MISSING_ID_TOKEN", "Missing Firebase ID token");
  }

  if (!env.firebaseApiKey) {
    throw new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "Firebase auth is not configured",
    );
  }

  let identity;
  try {
    identity = await verifyAccessToken(idToken);
  } catch {
    throw new AppError(401, "INVALID_ID_TOKEN", "Invalid Firebase ID token");
  }

  if (identity.authProvider !== "firebase") {
    throw new AppError(
      400,
      "INVALID_TOKEN_TYPE",
      "Token is not a Firebase ID token",
    );
  }

  if (!identity.email) {
    throw new AppError(
      400,
      "MISSING_EMAIL",
      "Google account does not provide email",
    );
  }

  const appIdentity = await resolveAppIdentity(identity);
  const user = await UserModel.findById(appIdentity.sub).select(
    "-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt",
  );

  await logActivity({
    userId: appIdentity.sub,
    type: "login",
    action: "Google login successful",
    description: "User signed in with Google account",
    req,
  });

  return sendSuccess(res, {
    token: await signToken({
      sub: appIdentity.sub,
      email: appIdentity.email,
      role: user?.role ?? "user",
    }),
    user,
    message: "Login with Google successful",
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

  if (!email || !password || !username) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Email, password, and username are required",
    );
  }

  const user = await createUserWithOtp(
    normalizeEmail(email),
    password,
    username,
    displayName,
  );

  if (!user) {
    throw new AppError(409, "EMAIL_EXISTS", "Email already exists");
  }

  // Phát sự kiện user.registered được chuyển sang verifyOtpWithPurpose sau khi user xác thực email OTP thành công

  return sendSuccess(
    res,
    { message: "OTP has been sent to your email" },
    undefined,
    201,
  );
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
    password?: string;
  };

  if (!email && !phone) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Email or phone identifier is required",
    );
  }

  if (!password) {
    throw new AppError(400, "BAD_REQUEST", "Password field is required");
  }

  const user = email
    ? await UserModel.findOne({ email: normalizeEmail(email) })
    : await UserModel.findOne({ phone: phone!.trim() });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  if (
    !user.password ||
    isGoogleOnlyAccount(user.authProviders, user.username)
  ) {
    await issueResetToken(user.email, true);
    return sendSuccess(res, {
      email: user.email,
      message:
        "This account does not have a password yet. OTP has been sent to your email to create one",
      requiresPasswordSetup: true,
    });
  }

  if (!(await comparePassword(password, user.password))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  if (!hasLocalPasswordProvider(user.authProviders)) {
    user.authProviders = Array.from(
      new Set([...(user.authProviders ?? []), "local"]),
    );
    await user.save();
  }

  const settings = await SettingsModel.findOne({ userId: user._id });

  if (settings?.twoFactorEnabled) {
    await issueLoginOtp(user);
    return sendSuccess(res, {
      message: "OTP has been sent to your email to complete sign in",
      requiresTwoFactor: true,
    });
  }

  await logActivity({
    userId: String(user._id),
    type: "login",
    action: "Login successful",
    description: "User signed in successfully",
    req,
  });

  const payload = await buildTokenPayload(
    String(user._id),
    user.email,
    "Login successful",
    user.role,
  );

  return sendSuccess(res, payload);
};

export const checkLoginIdentity = async (req: Request, res: Response) => {
  const { identifier } = req.body as { identifier: string };
  if (!identifier) {
    throw new AppError(400, "BAD_REQUEST", "Identifier string is required");
  }

  const trimmedIdentifier = identifier.trim();

  const identityType = looksLikeEmail(trimmedIdentifier) ? "email" : "phone";
  const query =
    identityType === "email"
      ? { email: normalizeEmail(trimmedIdentifier) }
      : { phone: trimmedIdentifier };

  const user = await UserModel.findOne(query).select(
    "_id email password authProviders username",
  );

  if (!user) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      identityType === "email"
        ? "Email is not registered yet"
        : "Phone number is not registered yet",
    );
  }

  const requiresPasswordSetup =
    !user.password || isGoogleOnlyAccount(user.authProviders, user.username);

  if (requiresPasswordSetup) {
    await issueResetToken(user.email, true);
  }

  return sendSuccess(res, {
    exists: true,
    method: identityType,
    identifier:
      identityType === "email"
        ? normalizeEmail(trimmedIdentifier)
        : trimmedIdentifier,
    email: user.email,
    requiresPasswordSetup,
  });
};

export const verifyAuthOtp = async (req: Request, res: Response) => {
  const { purpose, email, otp } = req.body as {
    purpose: UnifiedOtpPurpose;
    email: string;
    otp: string;
  };

  if (!purpose || !email || !otp) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Purpose, email, and otp parameters are required",
    );
  }

  if (purpose === "reset password" || purpose === "create password") {
    const user = await verifyResetOtp(normalizeEmail(email), otp);
    if (!user) {
      throw new AppError(
        400,
        "INVALID_OTP",
        `Invalid or expired ${purpose === "create password" ? "create password" : "reset"} OTP`,
      );
    }

    const token = crypto.randomUUID();
    user.resetToken = token;
    await user.save();

    return sendSuccess(res, {
      message: `${purpose === "create password" ? "Create password" : "Reset"} OTP verified successfully`,
      token,
    });
  }

  return verifyOtpWithPurpose(req, res, purpose as AuthOtpPurpose);
};

export const resendAuthOtp = async (req: Request, res: Response) => {
  const { email, purpose } = req.body as {
    email: string;
    purpose: UnifiedOtpPurpose;
  };

  if (!email || !purpose) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Email and purpose parameters are required",
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Email not found");
  }

  if (purpose === "register") {
    if (user.isEmailVerified) {
      throw new AppError(400, "ALREADY_VERIFIED", "Email is already verified");
    }

    await issueOtp(user, "register");
    return sendSuccess(res, { message: "OTP has been resent to your email" });
  }

  if (purpose === "login") {
    const settings = await SettingsModel.findOne({ userId: user._id });
    if (!settings?.twoFactorEnabled) {
      throw new AppError(
        400,
        "TWO_FACTOR_NOT_ENABLED",
        "Two-factor login is not enabled for this account",
      );
    }

    await issueLoginOtp(user);
    return sendSuccess(res, { message: "OTP has been resent to your email" });
  }

  const isCreatePassword = purpose === "create password";
  await issueResetToken(normalizedEmail, isCreatePassword);
  return sendSuccess(res, {
    message: `${isCreatePassword ? "Create password" : "Reset password"} OTP has been resent to your email`,
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  if (!email) {
    throw new AppError(400, "BAD_REQUEST", "Email parameter is required");
  }

  const normalizedEmail = normalizeEmail(email);
  const userRecord = await UserModel.findOne({ email: normalizedEmail });
  const isCreatePassword = userRecord
    ? !userRecord.password ||
      isGoogleOnlyAccount(userRecord.authProviders, userRecord.username)
    : false;

  const user = await issueResetToken(normalizedEmail, isCreatePassword);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Email not found");
  }

  return sendSuccess(res, {
    message: isCreatePassword
      ? "Create password OTP sent to your email"
      : "Reset password OTP sent to your email",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, otp, newPassword } = req.body as {
    email: string;
    token?: string;
    otp?: string;
    newPassword: string;
  };

  if (!email || !newPassword) {
    throw new AppError(
      400,
      "BAD_REQUEST",
      "Email and newPassword parameters are required",
    );
  }

  const resetToken = token ?? otp;

  if (!resetToken || resetToken.length <= 6) {
    throw new AppError(
      400,
      "UNVERIFIED_OTP",
      "You must verify your OTP before modifying your password",
    );
  }

  const user = await UserModel.findOne({ email: normalizeEmail(email) });

  if (
    !user ||
    !user.resetToken ||
    user.resetToken !== resetToken ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt.getTime() < Date.now()
  ) {
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      "Invalid or expired reset token",
    );
  }

  user.password = await hashPassword(newPassword);
  user.authProviders = Array.from(
    new Set([...(user.authProviders ?? []), "local"]),
  );
  user.resetToken = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  await logActivity({
    userId: String(user._id),
    type: "password_change",
    action: "Password reset",
    description: "User reset account password using reset token",
    req,
  });

  return sendSuccess(res, { message: "Password reset successful" });
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const user = await UserModel.findById(userId).select(
    "-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt",
  );

  // FIREBASE USER
  if (!user && req.user?.authProvider === "firebase") {
    return sendSuccess(res, {
      id: req.user.sub,
      email: req.user.email,
      displayName: req.user.displayName ?? req.user.email,
      avatarUrl: req.user.avatarUrl ?? null,
      phone: req.user.phoneNumber ?? null,
      bio: null,
      trustScore: 100,
      role: "user",
      createdAt: null,
    });
  }

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  // SAFE USER
  const safeUser = {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    phone: user.phone,
    trustScore: user.trustScore ?? 100,
    role: user.role ?? "user",
    createdAt: user.createdAt ?? null,
  };

  return sendSuccess(res, safeUser);
};

const buildFirebaseIdentityToolkitUrl = (path: string) => {
  if (!env.firebaseApiKey) {
    throw new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "Firebase API key is not configured",
    );
  }

  return `https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(env.firebaseApiKey)}`;
};

const fetchFirebaseIdentityToolkit = async <T>(path: string, body: unknown) => {
  const url = buildFirebaseIdentityToolkitUrl(path);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    error?: { message?: string; errors?: Array<{ message?: string }> };
  } & T;

  if (!response.ok) {
    const errorMessage =
      data.error?.message ||
      data.error?.errors
        ?.map((error) => error.message)
        .filter(Boolean)
        .join(", ") ||
      "Firebase Identity Toolkit request failed";

    throw new AppError(502, "FIREBASE_IDENTITY_TOOLKIT_ERROR", errorMessage);
  }

  return data;
};

const getFirebaseCustomIdTokenForUser = async (
  userId: string,
  email: string,
  displayName?: string,
) => {
  if (!isFirebaseAdminInitialized() || !env.firebaseApiKey) {
    throw new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "Firebase admin is not configured",
    );
  }

  const firebaseUid = await ensureFirebaseAuthUser(
    userId,
    normalizeEmail(email),
    displayName,
  );
  const customToken = await admin.auth().createCustomToken(firebaseUid);
  const result = await fetchFirebaseIdentityToolkit<{ idToken?: string }>(
    "accounts:signInWithCustomToken",
    {
      token: customToken,
      returnSecureToken: true,
    },
  );

  if (!result.idToken) {
    throw new AppError(
      502,
      "FIREBASE_IDENTITY_TOOLKIT_ERROR",
      "Failed to sign in with Firebase custom token",
    );
  }

  return result.idToken;
};

export const getFirebaseCustomToken = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const email = req.user?.email;

  if (!userId || !email) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const customToken = await getFirebaseCustomIdTokenForUser(
    userId,
    email,
    req.user?.displayName,
  );
  return sendSuccess(res, { token: customToken });
};
