import { z } from 'zod';

export const getNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    type: z.enum(['order', 'message', 'promotion', 'system']).optional(),
    read: z.string().optional().transform(val => val ? val === 'true' : undefined)
  })
});

export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const markAllAsReadSchema = z.object({
  query: z.object({
    type: z.enum(['order', 'message', 'promotion', 'system']).optional()
  })
});

export const deleteNotificationSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});