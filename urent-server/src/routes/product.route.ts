import { Router } from 'express';
import { getProducts } from '../controllers/product.controller';
import { authGuard } from '../middlewares/auth.middleware';

export const productRouter = Router();

productRouter.get('/products', authGuard, getProducts);