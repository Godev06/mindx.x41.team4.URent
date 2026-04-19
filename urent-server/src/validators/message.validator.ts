import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

const cursorSchema = z.string().min(1).optional();
const limitSchema = z
  .coerce.number()
  .int()
  .min(1)
  .max(50)
  .optional();

export const listConversationsQuerySchema = z.object({
  cursor: cursorSchema,
  limit: limitSchema,
  q: z.string().trim().max(200).optional()
});

export const listMessagesParamsSchema = z.object({
  conversationId: objectIdSchema
});

export const listMessagesQuerySchema = z.object({
  cursor: cursorSchema,
  limit: limitSchema,
  search: z.string().trim().max(200).optional()
});

export const messageTypeSchema = z.enum(['TEXT', 'PRODUCT', 'LOCATION']);

const productMetadataSchema = z.object({
  productId: objectIdSchema
});

const locationMetadataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(500).optional()
});

export const sendMessageBodySchema = z
  .object({
    messageType: messageTypeSchema,
    content: z.string().max(2000).optional(),
    metadata: z.unknown().optional()
  })
  .superRefine((value, ctx) => {
    if (value.messageType === 'TEXT') {
      const content = value.content?.trim() ?? '';
      if (!content) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'content is required for TEXT message',
          path: ['content']
        });
      }
      return;
    }

    if (value.messageType === 'PRODUCT') {
      const parsed = productMetadataSchema.safeParse(value.metadata);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'metadata.productId is required for PRODUCT message',
          path: ['metadata']
        });
      }
      return;
    }

    const parsed = locationMetadataSchema.safeParse(value.metadata);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'metadata.latitude and metadata.longitude are required for LOCATION message',
        path: ['metadata']
      });
    }
  });

export const readConversationParamsSchema = z.object({
  conversationId: objectIdSchema
});

export const deleteConversationParamsSchema = z.object({
  conversationId: objectIdSchema
});

export const searchMessagesQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  conversationId: objectIdSchema.optional(),
  cursor: cursorSchema,
  limit: limitSchema
});

export const createOneToOneConversationBodySchema = z.object({
  peerUserId: objectIdSchema
});

export const createOneToOneConversationByEmailBodySchema = z.object({
  peerEmail: z.string().trim().email().max(320)
});

export const conversationPeerByEmailQuerySchema = z.object({
  email: z.string().trim().email().max(320)
});

export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type ListMessagesParams = z.infer<typeof listMessagesParamsSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;
export type ReadConversationParams = z.infer<typeof readConversationParamsSchema>;
export type DeleteConversationParams = z.infer<typeof deleteConversationParamsSchema>;
export type SearchMessagesQuery = z.infer<typeof searchMessagesQuerySchema>;
export type CreateOneToOneConversationBody = z.infer<typeof createOneToOneConversationBodySchema>;
export type CreateOneToOneConversationByEmailBody = z.infer<
  typeof createOneToOneConversationByEmailBodySchema
>;
export type ConversationPeerByEmailQuery = z.infer<
  typeof conversationPeerByEmailQuerySchema
>;
