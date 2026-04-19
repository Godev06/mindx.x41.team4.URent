import { z } from 'zod';

const limitSchema = z.coerce.number().int().min(1).max(50).optional();

export const listProductsQuerySchema = z.object({
  limit: limitSchema,
  q: z.string().trim().max(200).optional()
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;