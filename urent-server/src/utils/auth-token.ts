import { admin, isFirebaseAdminInitialized } from '../config/firebase';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { verifyToken } from './jwt';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  authProvider: 'jwt' | 'firebase';
  firebaseUid?: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  rawClaims?: DecodedIdToken;
}

const toFirebaseIdentity = (decodedToken: DecodedIdToken): AuthenticatedUser => {
  const email = typeof decodedToken.email === 'string' ? decodedToken.email.trim().toLowerCase() : '';

  return {
    sub: decodedToken.uid,
    email,
    authProvider: 'firebase',
    firebaseUid: decodedToken.uid,
    displayName: decodedToken.name,
    avatarUrl: decodedToken.picture,
    phoneNumber: decodedToken.phone_number,
    rawClaims: decodedToken
  };
};

export const verifyAccessToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    const payload = verifyToken(token);
    return {
      sub: payload.sub,
      email: payload.email,
      authProvider: 'jwt'
    };
  } catch {
    // Fall through to Firebase verification.
  }

  if (!isFirebaseAdminInitialized()) {
    throw new Error('AUTH_TOKEN_INVALID');
  }

  const decodedToken = await admin.auth().verifyIdToken(token);
  return toFirebaseIdentity(decodedToken);
};
