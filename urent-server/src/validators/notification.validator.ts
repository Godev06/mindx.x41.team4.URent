import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format');

export const getNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    type: z.enum(['order', 'message', 'promotion', 'system']).optional(),
    read: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
  })
});

export const markAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const getNotificationByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const markAllAsReadSchema = z.object({
  query: z.object({
    type: z.enum(['order', 'message', 'promotion', 'system']).optional()
  })
});

export const deleteNotificationSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const saveFcmTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional().default('desktop')
  })
});

export const deleteFcmTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required')
  })
});

export const updateNotificationSettingsSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    screenNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    soundNotifications: z.boolean().optional(),
    preferences: z.object({
      orderUpdates: z.object({ email: z.boolean(), push: z.boolean(), inApp: z.boolean() }).partial().optional(),
      chatMessages: z.object({ email: z.boolean(), push: z.boolean(), inApp: z.boolean() }).partial().optional(),
      promotions: z.object({ email: z.boolean(), push: z.boolean(), inApp: z.boolean() }).partial().optional(),
      systemAlerts: z.object({ email: z.boolean(), push: z.boolean(), inApp: z.boolean() }).partial().optional()
    }).partial().optional()
  })
});

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['promotion', 'system']),
    actionUrl: z.string().optional(),
    target: z.enum(['all', 'lessors', 'lessees']).optional().default('all')
  })
});