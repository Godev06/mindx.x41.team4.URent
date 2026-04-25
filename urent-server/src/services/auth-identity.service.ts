import { randomBytes } from 'crypto';
import { UserModel } from '../models/user.model';
import type { AuthenticatedUser } from '../utils/auth-token';
import { hashPassword } from '../utils/hash';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isMongoDuplicateKeyError = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000;
};

const findOrCreateUserByEmail = async (
  email: string,
  displayName?: string
) => {
  const normalizedEmail = normalizeEmail(email);

  let user = await UserModel.findOne({ email: normalizedEmail });
  if (user) {
    return user;
  }

  try {
    user = await UserModel.create({
      email: normalizedEmail,
      password: await hashPassword(randomBytes(32).toString('hex')),
      isEmailVerified: true,
      displayName: displayName?.trim() || undefined
    });
    return user;
  } catch (error) {
    if (!isMongoDuplicateKeyError(error)) {
      throw error;
    }
  }

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (!existingUser) {
    throw new Error('Unable to create or locate user for Firebase identity');
  }

  return existingUser;
};

export const resolveAppIdentity = async (identity: AuthenticatedUser): Promise<AuthenticatedUser> => {
  if (identity.authProvider !== 'firebase') {
    return identity;
  }

  if (!identity.email) {
    throw new Error('FIREBASE_EMAIL_REQUIRED');
  }

  const user = await findOrCreateUserByEmail(identity.email, identity.displayName);

  return {
    ...identity,
    sub: String(user._id),
    email: user.email
  };
};
