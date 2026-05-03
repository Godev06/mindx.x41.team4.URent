"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseCustomToken = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.verifyAuthOtp = exports.checkLoginIdentity = exports.login = exports.register = void 0;
const firebase_1 = require("../config/firebase");
const settings_model_1 = require("../models/settings.model");
const user_model_1 = require("../models/user.model");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const user_service_1 = require("../services/user.service");
const activity_notification_service_1 = require("../services/activity-notification.service");
const auth_token_1 = require("../utils/auth-token");
const auth_identity_service_1 = require("../services/auth-identity.service");
const app_error_1 = require("../utils/app-error");
const api_response_1 = require("../utils/api-response");
// ─── Helpers ─────────────────────────────────────────────────────────────────
const normalizeEmail = (email) => email.trim().toLowerCase();
const looksLikeEmail = (value) => value.includes('@');
const hasLocalPasswordProvider = (authProviders) => (authProviders ?? []).includes('local');
const isGoogleOnlyAccount = (authProviders, username) => {
    const providers = authProviders ?? [];
    if (providers.includes('google') && !providers.includes('local')) {
        return true;
    }
    return providers.length === 0 && !username?.trim();
};
const buildTokenPayload = (userId, email, message) => ({
    token: (0, jwt_1.signToken)({ sub: userId, email }),
    message
});
const buildFirebaseUid = (userId) => `urent_${userId}`;
const isFirebaseUserNotFoundError = (error) => typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'auth/user-not-found';
const ensureFirebaseAuthUser = async (userId, email, displayName) => {
    const uid = buildFirebaseUid(userId);
    const payload = {
        email,
        emailVerified: true,
        ...(displayName ? { displayName } : {})
    };
    try {
        const existing = await firebase_1.admin.auth().getUserByEmail(email);
        await firebase_1.admin.auth().updateUser(existing.uid, payload);
        return existing.uid;
    }
    catch (error) {
        if (!isFirebaseUserNotFoundError(error))
            throw error;
    }
    try {
        await firebase_1.admin.auth().updateUser(uid, payload);
    }
    catch (error) {
        if (!isFirebaseUserNotFoundError(error))
            throw error;
        await firebase_1.admin.auth().createUser({ uid, ...payload });
    }
    return uid;
};
const logActivity = async (params) => {
    try {
        await (0, activity_notification_service_1.createActivityOnly)(params);
    }
    catch {
        // Non-fatal: activity logging failure should not block auth flow
    }
};
// ─── Private handlers ────────────────────────────────────────────────────────
const verifyOtpWithPurpose = async (req, res, purpose) => {
    const { email, otp } = req.body;
    const user = await (0, user_service_1.verifyOtp)(normalizeEmail(email), otp, purpose);
    if (!user) {
        throw new app_error_1.AppError(400, 'INVALID_OTP', purpose === 'register' ? 'Invalid or expired OTP' : 'Invalid or expired login OTP');
    }
    if (purpose === 'register') {
        await logActivity({
            userId: String(user._id),
            type: 'auth',
            action: 'Email verified',
            description: 'User completed email verification via OTP'
        });
        return (0, api_response_1.sendSuccess)(res, { message: 'Email verified successfully' });
    }
    await logActivity({
        userId: String(user._id),
        type: 'auth',
        action: 'Two-factor login successful',
        description: 'User completed sign in with email OTP verification'
    });
    return (0, api_response_1.sendSuccess)(res, buildTokenPayload(String(user._id), user.email, 'Login successful'));
};
const handleGoogleAuth = async (req, res) => {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
        throw new app_error_1.AppError(400, 'MISSING_ID_TOKEN', 'Missing Firebase ID token');
    }
    if (!(0, firebase_1.isFirebaseAdminInitialized)()) {
        throw new app_error_1.AppError(503, 'SERVICE_UNAVAILABLE', 'Firebase auth is not configured');
    }
    let identity;
    try {
        identity = await (0, auth_token_1.verifyAccessToken)(idToken);
    }
    catch {
        throw new app_error_1.AppError(401, 'INVALID_ID_TOKEN', 'Invalid Firebase ID token');
    }
    if (identity.authProvider !== 'firebase') {
        throw new app_error_1.AppError(400, 'INVALID_TOKEN_TYPE', 'Token is not a Firebase ID token');
    }
    if (!identity.email) {
        throw new app_error_1.AppError(400, 'MISSING_EMAIL', 'Google account does not provide email');
    }
    const appIdentity = await (0, auth_identity_service_1.resolveAppIdentity)(identity);
    const user = await user_model_1.UserModel.findById(appIdentity.sub).select('-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt');
    await logActivity({
        userId: appIdentity.sub,
        type: 'auth',
        action: 'Google login successful',
        description: 'User signed in with Google account'
    });
    return (0, api_response_1.sendSuccess)(res, {
        token: (0, jwt_1.signToken)({ sub: appIdentity.sub, email: appIdentity.email }),
        user,
        message: 'Login with Google successful'
    });
};
// ─── Exported route handlers ─────────────────────────────────────────────────
const register = async (req, res) => {
    const body = req.body;
    if (body.idToken)
        return handleGoogleAuth(req, res);
    const { email, password, username, displayName } = body;
    const user = await (0, user_service_1.createUserWithOtp)(normalizeEmail(email), password, username, displayName);
    if (!user) {
        throw new app_error_1.AppError(409, 'EMAIL_EXISTS', 'Email already exists');
    }
    return (0, api_response_1.sendSuccess)(res, { message: 'OTP has been sent to your email' }, undefined, 201);
};
exports.register = register;
const login = async (req, res) => {
    const body = req.body;
    if (body.idToken)
        return handleGoogleAuth(req, res);
    const { email, phone, password } = body;
    const user = email
        ? await user_model_1.UserModel.findOne({ email: normalizeEmail(email) })
        : await user_model_1.UserModel.findOne({ phone: phone.trim() });
    if (!user) {
        throw new app_error_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    if (!user.password || isGoogleOnlyAccount(user.authProviders, user.username)) {
        await (0, user_service_1.issueResetToken)(user.email);
        return (0, api_response_1.sendSuccess)(res, {
            email: user.email,
            message: 'This account does not have a password yet. OTP has been sent to your email to create one',
            requiresPasswordSetup: true
        });
    }
    if (!(await (0, hash_1.comparePassword)(password, user.password))) {
        throw new app_error_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    if (!hasLocalPasswordProvider(user.authProviders)) {
        user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
        await user.save();
    }
    const settings = await settings_model_1.SettingsModel.findOne({ userId: user._id });
    if (settings?.twoFactorEnabled) {
        await (0, user_service_1.issueLoginOtp)(user);
        return (0, api_response_1.sendSuccess)(res, {
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
    return (0, api_response_1.sendSuccess)(res, buildTokenPayload(String(user._id), user.email, 'Login successful'));
};
exports.login = login;
const checkLoginIdentity = async (req, res) => {
    const { identifier } = req.body;
    const trimmedIdentifier = identifier.trim();
    const identityType = looksLikeEmail(trimmedIdentifier) ? 'email' : 'phone';
    const query = identityType === 'email'
        ? { email: normalizeEmail(trimmedIdentifier) }
        : { phone: trimmedIdentifier };
    const user = await user_model_1.UserModel.findOne(query).select('_id email password authProviders username');
    if (!user) {
        throw new app_error_1.AppError(404, 'USER_NOT_FOUND', identityType === 'email'
            ? 'Email is not registered yet'
            : 'Phone number is not registered yet');
    }
    const requiresPasswordSetup = !user.password || isGoogleOnlyAccount(user.authProviders, user.username);
    if (requiresPasswordSetup) {
        await (0, user_service_1.issueResetToken)(user.email);
    }
    return (0, api_response_1.sendSuccess)(res, {
        exists: true,
        method: identityType,
        identifier: identityType === 'email' ? normalizeEmail(trimmedIdentifier) : trimmedIdentifier,
        email: user.email,
        requiresPasswordSetup
    });
};
exports.checkLoginIdentity = checkLoginIdentity;
const verifyAuthOtp = async (req, res) => {
    const { purpose, email, otp } = req.body;
    if (purpose === 'reset password') {
        const user = await (0, user_service_1.verifyResetOtp)(normalizeEmail(email), otp);
        if (!user) {
            throw new app_error_1.AppError(400, 'INVALID_OTP', 'Invalid or expired reset OTP');
        }
        return (0, api_response_1.sendSuccess)(res, { message: 'Reset OTP verified successfully' });
    }
    return verifyOtpWithPurpose(req, res, purpose);
};
exports.verifyAuthOtp = verifyAuthOtp;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await (0, user_service_1.issueResetToken)(normalizeEmail(email));
    if (!user) {
        throw new app_error_1.AppError(404, 'USER_NOT_FOUND', 'Email not found');
    }
    return (0, api_response_1.sendSuccess)(res, { message: 'Reset password OTP sent to your email' });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { email, token, otp, newPassword } = req.body;
    const resetToken = token ?? otp;
    const user = await user_model_1.UserModel.findOne({ email: normalizeEmail(email) });
    if (!user ||
        !resetToken ||
        user.resetToken !== resetToken ||
        !user.resetTokenExpiresAt ||
        user.resetTokenExpiresAt.getTime() < Date.now()) {
        throw new app_error_1.AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
    }
    user.password = await (0, hash_1.hashPassword)(newPassword);
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
    return (0, api_response_1.sendSuccess)(res, { message: 'Password reset successful' });
};
exports.resetPassword = resetPassword;
const getMe = async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) {
        throw new app_error_1.AppError(401, 'UNAUTHORIZED', 'Unauthorized');
    }
    const user = await user_model_1.UserModel.findById(userId).select('-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt');
    if (!user && req.user?.authProvider === 'firebase') {
        return (0, api_response_1.sendSuccess)(res, {
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
        throw new app_error_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    return (0, api_response_1.sendSuccess)(res, user);
};
exports.getMe = getMe;
const getFirebaseCustomToken = async (req, res) => {
    const userId = req.user?.sub;
    if (!userId) {
        throw new app_error_1.AppError(401, 'UNAUTHORIZED', 'Unauthorized');
    }
    if (!(0, firebase_1.isFirebaseAdminInitialized)()) {
        throw new app_error_1.AppError(503, 'SERVICE_UNAVAILABLE', 'Firebase phone verification is not configured');
    }
    const user = await user_model_1.UserModel.findById(userId).select('email displayName');
    if (!user?.email) {
        throw new app_error_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    const firebaseUid = await ensureFirebaseAuthUser(String(user._id), normalizeEmail(user.email), user.displayName?.trim() || undefined);
    const token = await firebase_1.admin.auth().createCustomToken(firebaseUid);
    return (0, api_response_1.sendSuccess)(res, { token });
};
exports.getFirebaseCustomToken = getFirebaseCustomToken;
