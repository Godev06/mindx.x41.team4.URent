import { type AuthProvider, UserModel } from '../models/user.model';
import type { AuthenticatedUser } from '../utils/auth-token';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isMongoDuplicateKeyError = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000;
};

interface GoogleIdentityData {
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

const GOOGLE_AUTH_PROVIDER: AuthProvider = 'google';
const LOCAL_AUTH_PROVIDER: AuthProvider = 'local';

const mergeAuthProviders = (
  currentProviders: AuthProvider[] | undefined,
  nextProviders: AuthProvider[]
): AuthProvider[] => {
  return Array.from(new Set<AuthProvider>([...(currentProviders ?? []), ...nextProviders]));
};

/**
 * Tìm user theo email. Nếu chưa có, tạo mới.
 * Nếu đã có, sync các field từ Google chưa được user tự điền (displayName, avatarUrl, isEmailVerified).
 * Nếu Google cung cấp phoneNumber và user chưa có phone, link luôn vào cùng account.
 */
const findOrCreateUserByEmail = async (
  email: string,
  googleData: GoogleIdentityData = {}
) => {
  const normalizedEmail = normalizeEmail(email);
  const { displayName, avatarUrl, phoneNumber } = googleData;

  let user = await UserModel.findOne({ email: normalizedEmail });

  if (user) {
    // Sync Google data into existing user (chỉ fill các field chưa có)
    let dirty = false;
    const nextProviders = mergeAuthProviders(
      user.authProviders,
      user.username?.trim()
        ? [GOOGLE_AUTH_PROVIDER, LOCAL_AUTH_PROVIDER]
        : [GOOGLE_AUTH_PROVIDER]
    );

    if ((user.authProviders ?? []).join(',') !== nextProviders.join(',')) {
      user.authProviders = nextProviders;
      dirty = true;
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      dirty = true;
    }
    if (!user.displayName && displayName?.trim()) {
      user.displayName = displayName.trim();
      dirty = true;
    }
    if (!user.avatarUrl && avatarUrl) {
      user.avatarUrl = avatarUrl;
      dirty = true;
    }
    if (!user.phone && phoneNumber && !user.isPhoneVerified) {
      // Kiểm tra phone chưa thuộc về user khác
      const phoneOwner = await UserModel.findOne({ phone: phoneNumber });
      if (!phoneOwner) {
        user.phone = phoneNumber;
        dirty = true;
      }
    }

    if (dirty) await user.save();
    return user;
  }

  // Tạo user mới từ Google identity
  try {
    user = await UserModel.create({
      email: normalizedEmail,
      authProviders: [GOOGLE_AUTH_PROVIDER],
      isEmailVerified: true,
      displayName: displayName?.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      phone: phoneNumber || undefined
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

  const user = await findOrCreateUserByEmail(identity.email, {
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
    phoneNumber: identity.phoneNumber
  });

  return {
    ...identity,
    sub: String(user._id),
    email: user.email
  };
};
