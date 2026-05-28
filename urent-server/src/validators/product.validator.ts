import { z } from 'zod';

// Validator cho API lấy danh sách sản phẩm (Query Params)
export const listProductsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusInKm: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Validator cho API Tạo sản phẩm mới (Body)
export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  category: z.string().min(1, 'Danh mục không được để trống'),
  price: z.coerce.number().min(0, 'Giá thuê phải lớn hơn hoặc bằng 0'),
  condition: z.string().optional().default('New'),
  description: z.array(z.string()).optional().default([]),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  locationText: z.string().min(1, 'Vui lòng nhập địa chỉ/vị trí hiển thị của sản phẩm'),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.array(z.number()).length(2) // [Kinh độ, Vĩ độ]
  }).optional().default({
    type: 'Point',
    coordinates: [105.8342, 21.0278] // Tọa độ mặc định (Hà Nội) nếu không truyền GPS
  })
});

// Validator cho API Cập nhật sản phẩm
export const updateProductSchema = createProductSchema.partial();