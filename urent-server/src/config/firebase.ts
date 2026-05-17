// NOTE: firebase-admin is NOT compatible with Cloudflare Edge Runtime (uses native gRPC).
// This file is intentionally left as a stub.
// Firebase token verification is handled via REST API in src/utils/auth-token.ts.

export const initializeFirebase = () => {
  // no-op on Edge
};

export const isFirebaseAdminInitialized = () => false;

// Stub admin object - never actually called on Edge
export const admin = {
  auth: () => {
    throw new Error('firebase-admin is not supported on Cloudflare Edge Runtime');
  }
} as any;
