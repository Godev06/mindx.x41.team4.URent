// NOTE: All values are lazy getters - evaluated at call time, NOT at module load time.
// This is required for Cloudflare Workers where env vars are injected per-request.

const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

export const env = {
  get port() { return Number(process.env.PORT ?? 5003); },
  get mongoUri() { return process.env.MONGO_URI ?? ''; },
  get mongoUriFallback() { return process.env.MONGO_URI_FALLBACK ?? ''; },
  get dnsServers() {
    return (process.env.DNS_SERVERS ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  },
  get jwtSecret() { return process.env.JWT_SECRET ?? ''; },
  get jwtExpiresIn() { return process.env.JWT_EXPIRES_IN ?? '1d'; },
  get clientOrigins() {
    const origins = (process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? '')
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean);
    const port = Number(process.env.PORT ?? 5003);
    const alwaysAllowed = [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`
    ].map(normalizeOrigin);
    const defaultOrigins = [
      'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5003'
    ].map(normalizeOrigin);
    return Array.from(new Set([...(origins.length > 0 ? origins : defaultOrigins), ...alwaysAllowed]));
  },
  get smtpHost() { return process.env.SMTP_HOST ?? ''; },
  get smtpPort() { return Number(process.env.SMTP_PORT ?? 587); },
  get smtpSecure() { return process.env.SMTP_SECURE === 'true'; },
  get smtpUser() { return process.env.SMTP_USER ?? ''; },
  get smtpPass() { return process.env.SMTP_PASS ?? ''; },
  get emailFrom() { return process.env.EMAIL_FROM ?? ''; },
  get otpExpiresMinutes() { return Number(process.env.OTP_EXPIRES_MINUTES ?? 10); },
  get resetTokenExpiresMinutes() { return Number(process.env.RESET_TOKEN_EXPIRES_MINUTES ?? 15); },
  get cloudinaryCloudName() { return process.env.CLOUDINARY_CLOUD_NAME; },
  get cloudinaryApiKey() { return process.env.CLOUDINARY_API_KEY; },
  get cloudinaryApiSecret() { return process.env.CLOUDINARY_API_SECRET; },
  get firebaseServiceAccountPath() { return process.env.FIREBASE_SERVICE_ACCOUNT_PATH; },
  get firebaseProjectId() { return process.env.FIREBASE_PROJECT_ID; },
  get firebaseClientEmail() { return process.env.FIREBASE_CLIENT_EMAIL; },
  get firebasePrivateKey() { return process.env.FIREBASE_PRIVATE_KEY; },
  get firebaseApiKey() { return process.env.FIREBASE_API_KEY ?? ''; }
};
