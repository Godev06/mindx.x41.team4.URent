import { Request, Response } from 'express';
import { createActivityOnly } from '../services/activity-notification.service';
import { SettingsModel } from '../models/settings.model';

const buildDefaultSettings = (userId: string) => ({
  userId,
  theme: 'light' as const,
  language: 'vi' as const,
  emailNotifications: true,
  screenNotifications: true,
  twoFactorEnabled: false
});

export const getSettings = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const settings = await SettingsModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: buildDefaultSettings(userId) },
    { returnDocument: 'after', upsert: true }
  );

  return res.json(settings);
};

export const updateSettings = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { twoFactorEnabled } = req.body as { twoFactorEnabled: boolean };

  const { twoFactorEnabled: _default, ...insertDefaults } = buildDefaultSettings(userId);

  const settings = await SettingsModel.findOneAndUpdate(
    { userId },
    {
      $set: { twoFactorEnabled },
      $setOnInsert: insertDefaults
    },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );

  try {
    await createActivityOnly({
      userId,
      type: 'update',
      action: twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
      description: twoFactorEnabled
        ? 'User enabled email OTP for sign in'
        : 'User disabled email OTP for sign in'
    });
  } catch {
    // Non-fatal: activity logging failure should not block settings update
  }

  return res.json(settings);
};