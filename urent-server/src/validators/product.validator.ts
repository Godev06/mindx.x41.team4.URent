import { z } from 'zod';

const limitSchema = z.coerce.number().int().min(1).max(50).optional();

export const listProductsQuerySchema = z.object({
  limit: limitSchema,
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().optional() 
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  price: z.coerce.number().min(0, 'Giá không được âm'),
  statusQuantities: z.object({
    available: z.coerce.number().min(0).default(1),
    rented: z.coerce.number().min(0).default(0),
    overdue: z.coerce.number().min(0).default(0),
  }).optional(),
  condition: z.string().optional(),
  image: z.string().optional(),
  description: z.array(z.string()).optional(),
  location: z.string().optional()
});

export const updateProductSchema = createProductSchema.partial();