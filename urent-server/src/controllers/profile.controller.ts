import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { deleteImage, uploadImage } from '../services/cloudinary.service';
import { UpdateProfileInput } from '../validators/profile.validator';
import { createActivityOnly } from '../services/activity-notification.service';
import { comparePassword, hashPassword } from '../utils/hash';
import { sendPasswordCreatedEmail, sendPasswordChangedEmail } from '../services/email.service';

const buildFirebaseUid = (userId: string) => `urent_${userId}`;

const getExpectedFirebaseUidForUser = async (userId: string, _email: string) => {
  return buildFirebaseUid(userId);
};

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
  const { displayName, bio, phone, address, currentPassword, newPassword } = req.body as UpdateProfileInput;

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  let isPasswordCreation = false;

  if (newPassword) {
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    } else {
      isPasswordCreation = true;
    }
    
    user.password = await hashPassword(newPassword);
    user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
  }

  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (phone) {
    user.phone = phone;
  }
  if (address !== undefined) user.address = address;

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
  } catch {}

  if (newPassword) {
    try {
      if (isPasswordCreation) {
        await sendPasswordCreatedEmail(user.email, user.displayName);
      } else {
        await sendPasswordChangedEmail(user.email, user.displayName);
      }
    } catch {}
  }

  const updatedUser = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  return res.json(updatedUser);
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!req.file) return res.status(400).json({ message: 'No file provided' });

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.avatarUrl) {
    const parts = user.avatarUrl.split('/');
    const filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    const folder = parts[parts.length - 2];
    const oldPublicId = `${folder}/${filename}`;
    await deleteImage(oldPublicId).catch(() => {});
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
  } catch {}

  const updated = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  return res.json({ avatarUrl: url, publicId, user: updated });
};

// --- HÀM MỚI CHO WISHLIST ---
export const getFavorites = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const user = await UserModel.findById(userId).populate('favoriteProducts');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  return res.json({ success: true, data: user.favoriteProducts });
};

export const toggleFavorite = async (req: Request, res: Response) => {
  const userId = req.user?.sub;
  const { productId } = req.params;

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const index = user.favoriteProducts.findIndex(id => id.toString() === productId);
  let isWishlisted = false;

  if (index === -1) {
    user.favoriteProducts.push(productId as any);
    isWishlisted = true;
  } else {
    user.favoriteProducts.splice(index, 1);
  }

  await user.save();
  return res.json({ success: true, data: { isWishlisted, favoriteProducts: user.favoriteProducts } });
};