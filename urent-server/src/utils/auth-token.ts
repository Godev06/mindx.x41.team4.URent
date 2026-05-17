import { verifyToken } from './jwt';
import { env } from '../config/env';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  authProvider: 'jwt' | 'firebase';
  firebaseUid?: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  rawClaims?: any;
}

const verifyFirebaseTokenREST = async (idToken: string): Promise<AuthenticatedUser> => {
  if (!env.firebaseApiKey) {
    throw new Error('FIREBASE_API_KEY_MISSING');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.firebaseApiKey}`;
  console.log('[Firebase] Verifying token via REST...');
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.error('[Firebase] Token verification fetch failed or timed out:', error);
    throw new Error('AUTH_TOKEN_INVALID');
  }
  console.log('[Firebase] Verify token response status:', response.status);

  if (!response.ok) {
    throw new Error('AUTH_TOKEN_INVALID');
  }

  const data: any = await response.json();
  if (!data.users || data.users.length === 0) {
    throw new Error('AUTH_TOKEN_INVALID');
  }

  const user = data.users[0];
  const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';

  return {
    sub: user.localId,
    email,
    authProvider: 'firebase',
    firebaseUid: user.localId,
    displayName: user.displayName,
    avatarUrl: user.photoUrl,
    phoneNumber: user.phoneNumber,
    rawClaims: user
  };
};

export const verifyAccessToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    const payload = await verifyToken(token);
    return {
      sub: payload.sub,
      email: payload.email,
      authProvider: 'jwt'
    };
  } catch {
    // Fall through to Firebase verification using REST API (Edge Compatible)
  }

  return verifyFirebaseTokenREST(token);
};
