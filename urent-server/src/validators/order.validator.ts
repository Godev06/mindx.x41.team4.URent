import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    totalPrice: z.number().min(0)
  })
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  })
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});