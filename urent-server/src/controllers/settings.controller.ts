import { Request, Response } from 'express';
import { createActivityOnly, createLinkedActivityNotification } from '../services/activity-notification.service';
import { SettingsModel } from '../models/settings.model';
import { UserModel } from '../models/user.model';
import { issueOtp, verifyOtp } from '../services/user.service';
import { getClientIp, parseUserAgent, estimateLocation, evaluateRiskLevel } from '../utils/request-metadata';

const flattenObject = (obj: any, prefix = ''): any => {
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (
      obj[k] !== null &&
      typeof obj[k] === 'object' &&
      !Array.isArray(obj[k]) &&
      !(obj[k] instanceof Date)
    ) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

const buildDefaultSettings = (userId: string) => ({
  userId,
  theme: 'light' as const,
  language: 'vi' as const,
  emailNotifications: true,
  screenNotifications: true,
  pushNotifications: true,
  soundNotifications: true,
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

  // Check if password is set for this user
  const user = await UserModel.findById(userId);
  const isPasswordSet = !!user?.password;

  return res.json({ ...settings?.toObject(), isPasswordSet });
};

export const requestTwoFactorOtpController = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  await issueOtp(user, 'toggle 2fa');

  return res.json({ message: 'OTP has been sent to your email' });
};

export const updateSettings = async (req: Request, res: Response) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const updateData = req.body;

  // Check if twoFactorEnabled is being modified
  if (updateData.twoFactorEnabled !== undefined) {
    const { otp } = updateData;
    if (!otp) {
      return res.status(400).json({ message: 'Mã OTP là bắt buộc để thay đổi cài đặt 2FA.' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const verifiedUser = await verifyOtp(user.email, otp, 'toggle 2fa');
    if (!verifiedUser) {
      return res.status(400).json({ message: 'Mã OTP không chính xác hoặc đã hết hạn.' });
    }
  }

  const flattenedUpdate = flattenObject(updateData);
  delete flattenedUpdate.otp;

  const { twoFactorEnabled: _default, ...rawInsertDefaults } = buildDefaultSettings(userId);

  // Remove any keys from $setOnInsert that are already present in $set —
  // MongoDB throws a path-conflict error if the same path appears in both operators.
  const insertDefaults = Object.fromEntries(
    Object.entries(rawInsertDefaults).filter(([k]) => !(k in flattenedUpdate))
  );

  const settings = await SettingsModel.findOneAndUpdate(
    { userId },
    {
      $set: flattenedUpdate,
      ...(Object.keys(insertDefaults).length > 0 ? { $setOnInsert: insertDefaults } : {})
    },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );

  // If twoFactorEnabled was modified, log the activity and notify the user
  if (updateData.twoFactorEnabled !== undefined) {
    const twoFactorEnabled = updateData.twoFactorEnabled;
    try {
      const ip = getClientIp(req);
      const parsedUa = parseUserAgent(req.headers['user-agent']);
      const location = estimateLocation(ip);
      const risk = evaluateRiskLevel(req.headers['user-agent']);

      await createLinkedActivityNotification({
        userId,
        activity: {
          type: 'settings_change',
          action: twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
          description: twoFactorEnabled
            ? 'User enabled email OTP for sign in'
            : 'User disabled email OTP for sign in'
        },
        notification: {
          title: twoFactorEnabled ? 'Đã bật xác thực 2 yếu tố (2FA)' : 'Đã tắt xác thực 2 yếu tố (2FA)',
          description: twoFactorEnabled
            ? 'Tài khoản của bạn đã được bảo vệ tối đa bằng mã OTP gửi qua Email.'
            : 'Bạn đã tắt tính năng xác thực bảo mật 2 lớp.',
          type: 'system',
          actionUrl: '/settings'
        },
        ip,
        userAgent: req.headers['user-agent'] || '',
        location,
        device: `${parsedUa.browser} / ${parsedUa.device}`,
        riskLevel: risk,
      });
    } catch (err) {
      console.error('Failed to create 2FA notification:', err);
    }
  }

  // Check if password is set for this user
  const user = await UserModel.findById(userId);
  const isPasswordSet = !!user?.password;

  return res.json({ ...settings?.toObject(), isPasswordSet });
};