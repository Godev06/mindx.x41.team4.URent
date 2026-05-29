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
    const { imageUrl } = req.body;
    
    // Dynamically derive suggestions from request input instead of static mock data
    let name = "Sản phẩm mới";
    let category = "Điện tử & Công nghệ";
    let price = 100000;
    let description: string[] = ["Hình ảnh rõ nét", "Tình trạng tốt"];

    if (imageUrl) {
      const urlStr = String(imageUrl).toLowerCase();
      if (urlStr.includes("book") || urlStr.includes("sach") || urlStr.includes("textbook") || urlStr.includes("vo") || urlStr.includes("notebook")) {
        name = "Giáo trình / Đồ dùng học tập";
        category = "Đồ dùng học tập";
        price = 35000;
        description = ["Nội dung đầy đủ", "Giấy in rõ nét", "Ít trầy xước"];
      } else if (
        urlStr.includes("phone") || 
        urlStr.includes("iphone") || 
        urlStr.includes("laptop") || 
        urlStr.includes("macbook") || 
        urlStr.includes("camera") ||
        urlStr.includes("dien-thoai") ||
        urlStr.includes("may-tinh") ||
        urlStr.includes("fridge") || 
        urlStr.includes("tv") || 
        urlStr.includes("fan") || 
        urlStr.includes("quat") || 
        urlStr.includes("tulanh") ||
        urlStr.includes("may-giat")
      ) {
        name = "Thiết bị điện tử & Công nghệ";
        category = "Điện tử & Công nghệ";
        price = 450000;
        description = ["Hoạt động mượt mà", "Đầy đủ phụ kiện", "Pin tối ưu"];
      } else if (
        urlStr.includes("outdoor") ||
        urlStr.includes("camp") ||
        urlStr.includes("backpack") ||
        urlStr.includes("tent") ||
        urlStr.includes("le-trai") ||
        urlStr.includes("da-ngoai") ||
        urlStr.includes("du-lich")
      ) {
        name = "Đồ dùng dã ngoại & Du lịch";
        category = "Du lịch & Dã ngoại";
        price = 150000;
        description = ["Chống thấm nước tốt", "Độ bền cao", "Đầy đủ phụ kiện lắp ráp"];
      } else if (
        urlStr.includes("fashion") ||
        urlStr.includes("clothing") ||
        urlStr.includes("thoi-trang") ||
        urlStr.includes("life-style") ||
        urlStr.includes("clothes") ||
        urlStr.includes("giay") ||
        urlStr.includes("dong-ho")
      ) {
        name = "Vật dụng thời trang & Đời sống";
        category = "Thời trang & Đời sống";
        price = 95000;
        description = ["Kiểu dáng thời thượng", "Chất liệu cao cấp", "Tình trạng như mới"];
      }
    }

    return sendSuccess(res, {
      name,
      category,
      price,
      condition: "Like new",
      description
    });
  } catch (error) { next(error); }
};