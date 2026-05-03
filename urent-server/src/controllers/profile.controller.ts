import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { deleteImage, uploadImage } from '../services/cloudinary.service';
import { UpdateProfileInput, VerifyPhoneInput } from '../validators/profile.validator';
import { createActivityOnly } from '../services/activity-notification.service';
import { comparePassword, hashPassword } from '../utils/hash';
import { admin, isFirebaseAdminInitialized } from '../config/firebase';

const buildFirebaseUid = (userId: string) => `urent_${userId}`;

const isFirebaseUserNotFoundError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'auth/user-not-found'
  );
};

const getExpectedFirebaseUidForUser = async (userId: string, email: string) => {
  try {
    const firebaseUser = await admin.auth().getUserByEmail(email);
    return firebaseUser.uid;
  } catch (error) {
    if (!isFirebaseUserNotFoundError(error)) {
      throw error;
    }

    // If the Firebase user has not been provisioned by email yet, fallback to deterministic UID.
    return buildFirebaseUid(userId);
  }
};

type VerifyPhoneGuardInput = {
  decodedUid: string;
  expectedFirebaseUid: string;
  hasExistingPhoneOwner: boolean;
};

type VerifyPhoneGuardResult =
  | { ok: true }
  | { ok: false; status: 403 | 409; message: string };

export const evaluateVerifyPhoneGuard = ({
  decodedUid,
  expectedFirebaseUid,
  hasExistingPhoneOwner
}: VerifyPhoneGuardInput): VerifyPhoneGuardResult => {
  if (decodedUid !== expectedFirebaseUid) {
    return { ok: false, status: 403, message: 'Firebase token does not belong to the current user' };
  }

  if (hasExistingPhoneOwner) {
    return { ok: false, status: 409, message: 'Phone number is already linked to another account' };
  }

  return { ok: true };
};

// Fields excluded from all profile responses
const EXCLUDED_FIELDS =
  '-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt';

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const user = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const { displayName, bio, phone, currentPassword, newPassword } = req.body as UpdateProfileInput;

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Handle password change if requested
  if (currentPassword && newPassword) {
    if (!user.password) {
      return res.status(400).json({ message: 'Password has not been set for this account yet' });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = await hashPassword(newPassword);
    user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
  }

  // Update other fields
  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (phone) {
    // Direct update without Firebase verification — mark as unverified
    user.phone = phone;
    user.isPhoneVerified = false;
  }

  await user.save();

  try {
    await createActivityOnly({
      userId,
      type: 'update',
      action: 'Profile updated',
      description: 'User updated profile information'
    });
  } catch {
    // Non-fatal: activity logging failure should not block profile update
  }

  const updatedUser = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  return res.json(updatedUser);
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!req.file) return res.status(400).json({ message: 'No file provided' });

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Delete old avatar from Cloudinary if it exists
  if (user.avatarUrl) {
    // Extract public ID: last two path segments joined by '/' without extension
    const parts = user.avatarUrl.split('/');
    const filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    const folder = parts[parts.length - 2];
    const oldPublicId = `${folder}/${filename}`;
    await deleteImage(oldPublicId).catch(() => {
      // Non-fatal: old image cleanup failure should not block the upload
    });
  }

  const { url, publicId } = await uploadImage(req.file.buffer, 'avatars');
  user.avatarUrl = url;
  await user.save();

  try {
    await createActivityOnly({
      userId,
      type: 'update',
      action: 'Avatar updated',
      description: 'User changed profile avatar'
    });
  } catch {
    // Non-fatal: activity logging failure should not block avatar upload
  }

  const updated = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  return res.json({ avatarUrl: url, publicId, user: updated });
};

export const verifyPhone = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  if (!isFirebaseAdminInitialized()) {
    return res.status(503).json({ message: 'Firebase phone verification is not configured' });
  }

  const { idToken } = req.body as VerifyPhoneInput;

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  let decodedToken: import('firebase-admin/auth').DecodedIdToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired Firebase ID token' });
  }

  const phoneNumber = decodedToken.phone_number;
  if (!phoneNumber) {
    return res.status(400).json({ message: 'Token does not contain a verified phone number' });
  }

  const expectedFirebaseUid = await getExpectedFirebaseUidForUser(String(user._id), user.email);
  if (decodedToken.uid !== expectedFirebaseUid) {
    return res.status(403).json({ message: 'Firebase token does not belong to the current user' });
  }

  const existingPhoneOwner = await UserModel.findOne({
    _id: { $ne: user._id },
    phone: phoneNumber
  }).select('_id');
  const guardResult = evaluateVerifyPhoneGuard({
    decodedUid: decodedToken.uid,
    expectedFirebaseUid,
    hasExistingPhoneOwner: Boolean(existingPhoneOwner)
  });
  if (!guardResult.ok) {
    return res.status(guardResult.status).json({ message: guardResult.message });
  }

  user.phone = phoneNumber;
  user.isPhoneVerified = true;
  await user.save();

  try {
    await createActivityOnly({
      userId,
      type: 'update',
      action: 'Phone verified',
      description: `User verified phone number ${phoneNumber}`
    });
  } catch {
    // Non-fatal
  }

  const updatedUser = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  return res.json(updatedUser);
};
