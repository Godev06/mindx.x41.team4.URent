import { initializeApp, setLogLevel } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Your web app's Firebase configuration
// (Replace with values from your Firebase Console)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Keep console clean from Firebase warning-level noise in development.
setLogLevel("error");

// Initialize App Check to satisfy reCAPTCHA Enterprise requirement for Phone Auth.
// In development: set VITE_APPCHECK_DEBUG_TOKEN=true to auto-generate a debug token
// (register that token in Firebase Console > App Check > Apps > debug tokens).
// In production: set VITE_RECAPTCHA_ENTERPRISE_KEY to your reCAPTCHA Enterprise site key.
const recaptchaEnterpriseKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY as string | undefined;

if (import.meta.env.DEV) {
  // Expose debug token so Firebase SDK prints it to the console on first run.
  // Copy the token from console and register it in Firebase Console > App Check.
  (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
}

if (recaptchaEnterpriseKey || import.meta.env.DEV) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      recaptchaEnterpriseKey ?? "placeholder-replaced-by-debug-token"
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
