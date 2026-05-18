import admin from 'firebase-admin';
import { env } from './env';

export const initializeFirebase = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey?.replace(/\\n/g, '\n')
      })
    });
  }
};

export const isFirebaseAdminInitialized = () => admin.apps.length > 0;
export { admin };
