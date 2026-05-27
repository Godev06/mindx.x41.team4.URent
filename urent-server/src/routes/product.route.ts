import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, archiveProduct, analyzeImageAI } from '../controllers/product.controller';
import { authGuard } from '../middlewares/auth.middleware';

export const productRouter = Router();

productRouter.get('/products', getProducts);
productRouter.get('/products/:id', getProductById); 
productRouter.post('/products', authGuard, createProduct);
productRouter.put('/products/:id', authGuard, updateProduct);
productRouter.delete('/products/:id', authGuard, deleteProduct);
productRouter.patch('/products/:id/archive', authGuard, archiveProduct);
productRouter.post('/products/ai/analyze', authGuard, analyzeImageAI);