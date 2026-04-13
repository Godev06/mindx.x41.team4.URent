import dotenv from 'dotenv';

dotenv.config();

const rawEnv = process.env as Record<string, string | undefined>;
const defaultClientOrigins = ['http://localhost:5173', 'http://localhost:5174'];

const clientOrigins = (rawEnv.CLIENT_URLS ?? rawEnv.CLIENT_URL ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

export const env = {
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
  cloudinaryApiSecret: rawEnv.CLOUDINARY_API_SECRET
};

if ((!env.mongoUri && !env.mongoUriFallback) || !env.jwtSecret) {
  throw new Error('Missing required environment variables ((MONGO_URI or MONGO_URI_FALLBACK), JWT_SECRET)');
}

if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
  console.warn('Warning: Cloudinary env vars not set. Avatar upload will not work.');
}
