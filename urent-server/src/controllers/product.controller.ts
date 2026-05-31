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

    // Smart fallback (when no API key or AI call failed)
    const urlStr = String(imageUrl ?? '').toLowerCase();
    const fileStr = String(fileName ?? '').toLowerCase();
    const searchStr = `${urlStr} ${fileStr}`;
    let name = 'Sản phẩm cho thuê';
    let category = 'Điện tử & Công nghệ';
    let price = 100000;
    let priceMin = 70000;
    let priceMax = 130000;
    let priceReason = 'Giá ước tính dựa trên danh mục sản phẩm tương tự trên thị trường.';
    let description: string[] = ['Tình trạng tốt', 'Sẵn sàng cho thuê'];
    const condition = '99%';

    if (searchStr.includes('book') || searchStr.includes('sach') || searchStr.includes('notebook') || searchStr.includes('vo') || searchStr.includes('vở')) {
      name = 'Giáo trình / Sách học tập';
      category = 'Đồ dùng học tập';
      price = 15000;
      priceMin = 5000;
      priceMax = 30000;
      priceReason = 'Sách và giáo trình thường có giá thuê thấp, phù hợp cho học sinh sinh viên.';
      description = ['Nội dung đầy đủ', 'Giấy in rõ nét', 'Ít trầy xước'];
    } else if (searchStr.includes('laptop') || searchStr.includes('macbook') || searchStr.includes('may-tinh') || searchStr.includes('máy tính')) {
      name = 'Laptop / Máy tính xách tay';
      category = 'Điện tử & Công nghệ';
      price = 180000;
      priceMin = 80000;
      priceMax = 300000;
      priceReason = 'Laptop có giá thuê trung bình-cao do giá trị thiết bị lớn và nhu cầu cao.';
      description = ['Hoạt động mượt mà', 'Pin bền', 'Đầy đủ sạc và phụ kiện'];
    } else if (searchStr.includes('phone') || searchStr.includes('iphone') || searchStr.includes('dien-thoai') || searchStr.includes('điện thoại')) {
      name = 'Điện thoại thông minh';
      category = 'Điện tử & Công nghệ';
      price = 80000;
      priceMin = 50000;
      priceMax = 150000;
      priceReason = 'Điện thoại cho thuê theo ngày phổ biến cho du lịch hoặc thay thế tạm thời.';
      description = ['Màn hình sắc nét', 'Pin tốt', 'Bảo hành đầy đủ'];
    } else if (searchStr.includes('camera') || searchStr.includes('may-anh') || searchStr.includes('máy ảnh')) {
      name = 'Máy ảnh / Camera';
      category = 'Điện tử & Công nghệ';
      price = 250000;
      priceMin = 100000;
      priceMax = 500000;
      priceReason = 'Thiết bị chụp ảnh chuyên nghiệp có giá thuê cao do giá trị và nhu cầu sự kiện.';
      description = ['Ống kính rõ nét', 'Đầy đủ phụ kiện', 'Pin dự phòng'];
    } else if (searchStr.includes('outdoor') || searchStr.includes('camp') || searchStr.includes('tent') || searchStr.includes('da-ngoai') || searchStr.includes('dã ngoại') || searchStr.includes('lều')) {
      name = 'Đồ dùng cắm trại / Dã ngoại';
      category = 'Du lịch & Dã ngoại';
      price = 100000;
      priceMin = 50000;
      priceMax = 200000;
      priceReason = 'Thiết bị dã ngoại có nhu cầu theo mùa, thường được thuê cho các chuyến đi ngắn ngày.';
      description = ['Chống thấm nước', 'Độ bền cao', 'Đầy đủ phụ kiện'];
    } else if (searchStr.includes('fashion') || searchStr.includes('thoi-trang') || searchStr.includes('thời trang') || searchStr.includes('clothes') || searchStr.includes('dong-ho') || searchStr.includes('đồng hồ') || searchStr.includes('váy') || searchStr.includes('đầm') || searchStr.includes('vest')) {
      name = 'Trang phục / Phụ kiện thời trang';
      category = 'Thời trang & Đời sống';
      price = 80000;
      priceMin = 30000;
      priceMax = 200000;
      priceReason = 'Thời trang cho thuê phổ biến cho sự kiện, tiết kiệm chi phí cho người dùng.';
      description = ['Chất liệu cao cấp', 'Đã vệ sinh sạch sẽ', 'Kiểu dáng thời thượng'];
    } else if (searchStr.includes('ipad') || searchStr.includes('tablet') || searchStr.includes('máy tính bảng')) {
      name = 'Máy tính bảng / iPad';
      category = 'Điện tử & Công nghệ';
      price = 120000;
      priceMin = 80000;
      priceMax = 180000;
      priceReason = 'Máy tính bảng hỗ trợ học tập và vẽ thiết kế tiện dụng có giá thuê hợp lý.';
      description = ['Màn hình cảm ứng mượt', 'Độ nét cao', 'Kèm bút cảm ứng'];
    } else if (searchStr.includes('loa') || searchStr.includes('speaker') || searchStr.includes('headphone') || searchStr.includes('tai nghe') || searchStr.includes('tai-nghe')) {
      name = 'Loa Bluetooth / Tai nghe';
      category = 'Điện tử & Công nghệ';
      price = 80000;
      priceMin = 40000;
      priceMax = 150000;
      priceReason = 'Thiết bị âm thanh giải trí có nhu cầu cao vào dịp lễ và cuối tuần.';
      description = ['Âm thanh trung thực', 'Thời lượng pin lâu', 'Hỗ trợ chống ồn'];
    } else if (searchStr.includes('xe dap') || searchStr.includes('xe-dap') || searchStr.includes('bicycle') || searchStr.includes('xe đạp')) {
      name = 'Xe đạp thể thao / Dã ngoại';
      category = 'Du lịch & Dã ngoại';
      price = 80000;
      priceMin = 50000;
      priceMax = 150000;
      priceReason = 'Xe đạp dã ngoại hoặc đạp xe quanh thành phố rất thích hợp cho những kỳ nghỉ ngắn.';
      description = ['Khung sườn chắc chắn', 'Hệ thống phanh nhạy', 'Đã được bảo dưỡng định kỳ'];
    }

    return sendSuccess(res, {
      name,
      category,
      price,
      priceMin,
      priceMax,
      priceReason,
      condition,
      description,
      confidence: 'low',
      aiPowered: false,
      aiError: serverAiError,
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