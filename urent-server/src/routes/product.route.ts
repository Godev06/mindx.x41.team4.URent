import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, archiveProduct, analyzeImageAI, getMyProducts } from '../controllers/product.controller';
import { authGuard } from '../middlewares/auth.middleware';

export const productRouter = Router();

productRouter.get('/products', getProducts);
productRouter.get('/products/my', authGuard, getMyProducts); // Current user's inventory
productRouter.get('/products/:id', getProductById); 
productRouter.post('/products', authGuard, createProduct);
productRouter.put('/products/:id', authGuard, updateProduct);
productRouter.delete('/products/:id', authGuard, deleteProduct);
productRouter.patch('/products/:id/archive', authGuard, archiveProduct);
productRouter.post('/products/ai/analyze', authGuard, analyzeImageAI);