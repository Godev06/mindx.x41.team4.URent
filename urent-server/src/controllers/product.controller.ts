import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { listProductsQuerySchema, createProductSchema, updateProductSchema } from '../validators/product.validator';
import * as productService from '../services/product.service';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listProductsQuerySchema.parse(req.query);
    const result = await productService.listProducts(query);
    return sendSuccess(res, result.items, { limit: result.limit, hasMore: result.hasMore, nextCursor: null });
  } catch (error) { next(error); }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id as string);
    return sendSuccess(res, product);
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Không tìm thấy sản phẩm' } });
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const product = await productService.createProduct(validatedData);
    return sendSuccess(res, product, undefined, 201);
  } catch (error) { next(error); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id as string, validatedData);
    return sendSuccess(res, product);
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Không tìm thấy sản phẩm' } });
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.deleteProduct(req.params.id as string);
    return sendSuccess(res, { message: 'Xóa thành công' });
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Không tìm thấy sản phẩm' } });
    next(error);
  }
};

export const archiveProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await productService.archiveProduct(req.params.id as string);
    return sendSuccess(res, { message: 'Đã đưa vào lưu trữ' });
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ success: false, error: { message: 'Không tìm thấy sản phẩm' } });
    next(error);
  }
};

export const analyzeImageAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mockAiData = {
      name: "Sản phẩm phân tích qua AI",
      category: "Electronics",
      price: 250000,
      condition: "New",
      description: ["Phát hiện tự động", "Bản Pro", "Pin trâu"]
    };
    return sendSuccess(res, mockAiData);
  } catch (error) { next(error); }
};