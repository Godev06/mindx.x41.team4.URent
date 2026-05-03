"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rawEnv = process.env;
const normalizeOrigin = (value) => value.trim().replace(/\/$/, '');
const defaultClientOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5003',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5003'
].map(normalizeOrigin);
const clientOrigins = (rawEnv.CLIENT_URLS ?? rawEnv.CLIENT_URL ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
exports.env = {
    port: Number(rawEnv.PORT ?? 5003),
    mongoUri: rawEnv.MONGO_URI ?? '',
    mongoUriFallback: rawEnv.MONGO_URI_FALLBACK ?? '',
    dnsServers: (rawEnv.DNS_SERVERS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    jwtSecret: rawEnv.JWT_SECRET ?? '',
    jwtExpiresIn: rawEnv.JWT_EXPIRES_IN ?? '1d',
    clientOrigins: clientOrigins.length > 0 ? clientOrigins : defaultClientOrigins,
    smtpHost: rawEnv.SMTP_HOST ?? '',
    smtpPort: Number(rawEnv.SMTP_PORT ?? 587),
    smtpSecure: rawEnv.SMTP_SECURE === 'true',
    smtpUser: rawEnv.SMTP_USER ?? '',
    smtpPass: rawEnv.SMTP_PASS ?? '',
    emailFrom: rawEnv.EMAIL_FROM ?? '',
    otpExpiresMinutes: Number(rawEnv.OTP_EXPIRES_MINUTES ?? 10),
    resetTokenExpiresMinutes: Number(rawEnv.RESET_TOKEN_EXPIRES_MINUTES ?? 15),
    cloudinaryCloudName: rawEnv.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: rawEnv.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: rawEnv.CLOUDINARY_API_SECRET,
    firebaseServiceAccountPath: rawEnv.FIREBASE_SERVICE_ACCOUNT_PATH,
    firebaseProjectId: rawEnv.FIREBASE_PROJECT_ID,
    firebaseClientEmail: rawEnv.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: rawEnv.FIREBASE_PRIVATE_KEY
};
if ((!exports.env.mongoUri && !exports.env.mongoUriFallback) || !exports.env.jwtSecret) {
    throw new Error('Missing required environment variables ((MONGO_URI or MONGO_URI_FALLBACK), JWT_SECRET)');
}
if (!exports.env.cloudinaryCloudName || !exports.env.cloudinaryApiKey || !exports.env.cloudinaryApiSecret) {
    console.warn('Warning: Cloudinary env vars not set. Avatar upload will not work.');
}
