import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { deleteImage, uploadImage } from '../services/cloudinary.service';
import { UpdateProfileInput } from '../validators/profile.validator';
import { createActivityOnly } from '../services/activity-notification.service';
import { comparePassword, hashPassword } from '../utils/hash';
import { sendPasswordCreatedEmail, sendPasswordChangedEmail } from '../services/email.service';

const buildFirebaseUid = (userId: string) => `urent_${userId}`;

// NOTE: firebase-admin is NOT compatible with Cloudflare Edge Runtime.
// Returns deterministic UID stub instead of calling Firebase Admin SDK.
const getExpectedFirebaseUidForUser = async (userId: string, _email: string) => {
  return buildFirebaseUid(userId);
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

  let isPasswordCreation = false;

  // Handle password change if requested
  if (newPassword) {
    // If password is already set, require current password verification
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    } else {
      // This is a password creation (first time setting password)
      isPasswordCreation = true;
    }
    
    user.password = await hashPassword(newPassword);
    user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
  }

  // Update other fields
  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (phone) {
    user.phone = phone;
  }

  await user.save();

  try {
    await createActivityOnly({
      userId,
      type: 'update',
      action: isPasswordCreation ? 'Password created' : newPassword ? 'Password changed' : 'Profile updated',
      description: isPasswordCreation 
        ? 'User created password for their account' 
        : newPassword 
          ? 'User changed their password' 
          : 'User updated profile information'
    });
  } catch {
    // Non-fatal: activity logging failure should not block profile update
  }

  // Send password notification email
  if (newPassword) {
    try {
      if (isPasswordCreation) {
        await sendPasswordCreatedEmail(user.email, user.displayName);
      } else {
        await sendPasswordChangedEmail(user.email, user.displayName);
      }
    } catch {
      // Non-fatal: email sending failure should not block profile update
    }
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
