import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { listProductsQuerySchema, createProductSchema, updateProductSchema } from '../validators/product.validator';
import * as productService from '../services/product.service';
import { analyzeProductImage, analyzeProductImageBase64 } from '../services/gemini.service';
import { env } from '../config/env';

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
    const ownerId = req.user?.sub;
    const product = await productService.createProduct(validatedData, ownerId);
    return sendSuccess(res, product, undefined, 201);
  } catch (error) { next(error); }
};

export const getMyProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    const { q, category, limit } = req.query as any;
    const result = await productService.listMyProducts(ownerId, {
      q,
      category,
      limit: limit ? Number(limit) : 100,
    });
    return sendSuccess(res, result.items, { limit: result.limit, hasMore: result.hasMore, nextCursor: null });
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

/**
 * POST /api/v1/products/ai/analyze
 * Analyze a product image using Google Gemini Vision AI
 * and return rental price suggestions with reasoning.
 */
export const analyzeImageAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl, imageBase64, mimeType, fileName } = req.body;

    if ((!imageUrl || typeof imageUrl !== 'string') && (!imageBase64 || typeof imageBase64 !== 'string')) {
      return res.status(400).json({ success: false, error: { message: 'imageUrl or imageBase64 is required' } });
    }

    let serverAiError = '';
    if (!env.geminiApiKey) {
      serverAiError = 'GEMINI_API_KEY_NOT_CONFIGURED';
    }

    // If Gemini API key is available, use real AI analysis
    if (env.geminiApiKey) {
      try {
        const analysis = imageBase64 && mimeType
          ? await analyzeProductImageBase64(imageBase64, mimeType)
          : await analyzeProductImage(imageUrl);
        return sendSuccess(res, {
          name: analysis.name,
          category: analysis.category,
          price: analysis.price,
          priceMin: analysis.priceMin,
          priceMax: analysis.priceMax,
          priceReason: analysis.priceReason,
          condition: analysis.condition,
          description: analysis.description,
          confidence: analysis.confidence,
          aiPowered: true,
        });
      } catch (aiError: any) {
        // Log error but fall through to smart fallback
        console.error('[Gemini AI] Analysis failed, using fallback:', aiError?.message);
        serverAiError = aiError?.message || 'GEMINI_ANALYSIS_FAILED';
      }
    }

    return res.status(400).json({
      success: false,
      error: {
        message: serverAiError || 'GEMINI_ANALYSIS_FAILED'
      }
    });
  } catch (error) { next(error); }
};

export const getPublicStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Dynamically require models inside the function to prevent circular imports if any
    const { ProductModel } = await import('../models/product.model');
    const { UserModel } = await import('../models/user.model');
    const { OrderModel } = await import('../models/order.model');

    const [totalProducts, totalUsers, totalTransactions] = await Promise.all([
      ProductModel.countDocuments({ isArchived: false }),
      UserModel.countDocuments(),
      OrderModel.countDocuments()
    ]);

    return sendSuccess(res, {
      totalProducts,
      totalUsers,
      totalTransactions
    });
  } catch (error) {
    next(error);
  }
};