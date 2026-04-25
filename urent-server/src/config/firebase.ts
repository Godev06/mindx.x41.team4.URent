import admin from "firebase-admin";
import { env } from "./env";

const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    if (env.firebaseServiceAccountPath) {
      const serviceAccount = require(env.firebaseServiceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized with service account file.");
    } else if (
      env.firebaseProjectId &&
      env.firebaseClientEmail &&
      env.firebasePrivateKey
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin initialized with environment variables.");
    } else {
      console.warn("Firebase Admin NOT initialized. Please provide service account credentials.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
};

export const isFirebaseAdminInitialized = () => admin.apps.length > 0;

export { admin, initializeFirebase };
