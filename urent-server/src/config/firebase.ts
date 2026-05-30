import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { env } from './env';

type RawServiceAccount = Record<string, unknown>;

const parsePrivateKey = (key: string | undefined): string | undefined => {
  if (!key) return undefined;
  let parsed = key.trim();
  // Strip surrounding quotes if present
  if (parsed.startsWith('"') && parsed.endsWith('"')) {
    parsed = parsed.slice(1, -1);
  }
  if (parsed.startsWith("'") && parsed.endsWith("'")) {
    parsed = parsed.slice(1, -1);
  }
  return parsed.replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim();
};

const normalizeServiceAccount = (raw: RawServiceAccount): admin.ServiceAccount | undefined => {
  const projectId =
    typeof raw.project_id === 'string'
      ? raw.project_id
      : typeof raw.projectId === 'string'
        ? raw.projectId
        : undefined;
  const clientEmail =
    typeof raw.client_email === 'string'
      ? raw.client_email
      : typeof raw.clientEmail === 'string'
        ? raw.clientEmail
        : undefined;
  const privateKey =
    typeof raw.private_key === 'string'
      ? raw.private_key
      : typeof raw.privateKey === 'string'
        ? raw.privateKey
        : undefined;

  if (!projectId && !clientEmail && !privateKey) {
    return undefined;
  }

  return {
    projectId: projectId?.trim(),
    clientEmail: clientEmail?.trim(),
    privateKey: parsePrivateKey(privateKey),
  } as admin.ServiceAccount;
};

const loadServiceAccountFromFile = (): admin.ServiceAccount | undefined => {
  const serviceAccountPath = env.firebaseServiceAccountPath?.trim();
  if (!serviceAccountPath) {
    return undefined;
  }

  const absolutePath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Firebase service account file not found: ${absolutePath}`);
  }

  const json = JSON.parse(fs.readFileSync(absolutePath, 'utf-8')) as RawServiceAccount;
  return normalizeServiceAccount(json);
};

const loadServiceAccountFromJsonEnv = (): admin.ServiceAccount | undefined => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) {
    return undefined;
  }

  try {
    const json = JSON.parse(rawJson) as RawServiceAccount;
    return normalizeServiceAccount(json);
  } catch (error) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format.');
  }
};

const loadServiceAccountFromEnvVars = (): admin.ServiceAccount | undefined => {
  const projectId = env.firebaseProjectId?.trim();
  const clientEmail = env.firebaseClientEmail?.trim();
  const privateKey = env.firebasePrivateKey?.trim();

  if (!projectId && !clientEmail && !privateKey) {
    return undefined;
  }

  return {
    projectId,
    clientEmail,
    privateKey: parsePrivateKey(privateKey),
  } as admin.ServiceAccount;
};

const getFirebaseCredential = () => {
  const serviceAccountFromFile = loadServiceAccountFromFile();
  const serviceAccountFromJson = loadServiceAccountFromJsonEnv();
  const serviceAccountFromVars = loadServiceAccountFromEnvVars();

  let chosenSource: string | null = null;
  let serviceAccount = undefined as admin.ServiceAccount | undefined;

  if (serviceAccountFromFile) {
    chosenSource = 'service-account-file';
    serviceAccount = serviceAccountFromFile;
  } else if (serviceAccountFromJson) {
    chosenSource = 'service-account-json-env';
    serviceAccount = serviceAccountFromJson;
  } else if (serviceAccountFromVars) {
    chosenSource = 'env-vars';
    serviceAccount = serviceAccountFromVars;
  }

  if (serviceAccount && serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    console.info(`[Firebase] Using credentials from: ${chosenSource}`);
    return admin.credential.cert(serviceAccount);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.info('[Firebase] Using application default credentials (GOOGLE_APPLICATION_CREDENTIALS)');
    return admin.credential.applicationDefault();
  }

  // Do not throw in development — allow server to start without Firebase admin
  // by returning undefined. Callers should handle missing admin gracefully.
  console.warn(
    'Firebase admin credentials not found. Skipping admin initialization. To enable, set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT, or GOOGLE_APPLICATION_CREDENTIALS.'
  );
  return undefined;
};

export const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      const credential = getFirebaseCredential();
      if (!credential) {
        return;
      }

      admin.initializeApp({
        credential,
      });
      console.info("[Firebase] Admin SDK initialized successfully.");
    } catch (error) {
      // Thay vì sập toàn bộ server, chỉ log lỗi ra để bạn biết và sửa cấu hình
      console.error("[Firebase] Fatal initialization error caught:", error);
    }
  }
};

export const isFirebaseAdminInitialized = () => admin.apps.length > 0;
export { admin };
