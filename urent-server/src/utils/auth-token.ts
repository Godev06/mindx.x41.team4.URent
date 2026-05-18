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

import { admin } from '../config/firebase';

const verifyFirebaseTokenAdmin = async (idToken: string): Promise<AuthenticatedUser> => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      sub: decodedToken.uid,
      email: typeof decodedToken.email === 'string' ? decodedToken.email.trim().toLowerCase() : '',
      authProvider: 'firebase',
      firebaseUid: decodedToken.uid,
      displayName: decodedToken.name,
      avatarUrl: decodedToken.picture,
      phoneNumber: decodedToken.phone_number,
      rawClaims: decodedToken
    };
  } catch (error) {
    console.error('[Firebase] Token verification failed:', error);
    throw error;
  }
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
    // Fall through to Firebase verification using Admin SDK
  }

  return verifyFirebaseTokenAdmin(token);
};
