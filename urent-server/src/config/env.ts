import dotenv from 'dotenv';

dotenv.config();

const rawEnv = process.env as Record<string, string | undefined>;
const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

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

const resolvedPort = Number(rawEnv.PORT ?? 5003);
const alwaysAllowedOrigins = [
  `http://localhost:${resolvedPort}`,
  `http://127.0.0.1:${resolvedPort}`
].map(normalizeOrigin);

const resolvedClientOrigins = Array.from(
  new Set([
    ...(clientOrigins.length > 0 ? clientOrigins : defaultClientOrigins),
    ...alwaysAllowedOrigins
  ])
);

export const env = {
  port: resolvedPort,
  mongoUri: rawEnv.MONGO_URI ?? '',
  mongoUriFallback: rawEnv.MONGO_URI_FALLBACK ?? '',
  dnsServers: (rawEnv.DNS_SERVERS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  jwtSecret: rawEnv.JWT_SECRET ?? '',
  jwtExpiresIn: rawEnv.JWT_EXPIRES_IN ?? '1d',
  clientOrigins: resolvedClientOrigins,
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

if ((!env.mongoUri && !env.mongoUriFallback) || !env.jwtSecret) {
  throw new Error('Missing required environment variables ((MONGO_URI or MONGO_URI_FALLBACK), JWT_SECRET)');
}

if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
  console.warn('Warning: Cloudinary env vars not set. Avatar upload will not work.');
}
