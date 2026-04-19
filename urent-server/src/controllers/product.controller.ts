import { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response';
import { listProductsQuerySchema } from '../validators/product.validator';
import { listProducts } from '../services/product.service';

export const getProducts = async (req: Request, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await listProducts(query);

  return sendSuccess(res, result.items, {
    limit: result.limit,
    hasMore: result.hasMore,
    nextCursor: null
  });
};