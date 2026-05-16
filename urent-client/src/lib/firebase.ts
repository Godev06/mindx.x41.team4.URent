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
// In production: set VITE_RECAPTCHA_ENTERPRISE_KEY to your reCAPTCHA Enterprise site key.
// In development: if you want App Check debug mode, set VITE_APPCHECK_DEBUG_TOKEN and also
// configure App Check on Firebase Console with a valid provider.
const recaptchaEnterpriseKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY as string | undefined;
const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined;

if (import.meta.env.DEV && debugToken) {
  // Expose the debug token only when it is explicitly configured.
  (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

if (recaptchaEnterpriseKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
