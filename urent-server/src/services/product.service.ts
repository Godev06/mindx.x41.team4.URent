import { ProductModel } from '../models/product.model';

export const listProducts = async (options: { 
  limit?: number; 
  q?: string; 
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusInKm?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const limit = options.limit ?? 20;
  
  const query: Record<string, any> = { 
    isArchived: false, 
    status: { $in: ['Available', 'Active'] } 
  };

  if (options.category) {
    query.category = options.category;
  }

  if (options.q) {
    const escaped = options.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [
      { name: regex }, 
      { category: regex },
      { description: regex }
    ];
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    query.price = {};
    if (options.minPrice !== undefined) query.price.$gte = Number(options.minPrice);
    if (options.maxPrice !== undefined) query.price.$lte = Number(options.maxPrice);
  }

  if (options.startDate && options.endDate) {
    query.unavailableDates = {
      $not: {
        $elemMatch: {
          startDate: { $lt: new Date(options.endDate) },
          endDate: { $gt: new Date(options.startDate) }
        }
      }
    };
  }

  if (options.lat && options.lng && options.radiusInKm) {
    query.location = {
      $near: {
        $geometry: { 
          type: 'Point', 
          coordinates: [Number(options.lng), Number(options.lat)] 
        },
        $maxDistance: Number(options.radiusInKm) * 1000
      }
    };
  }

  const rows = await ProductModel.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const items = rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    category: row.category,
    price: row.price,
    status: row.status,
    statusQuantities: row.statusQuantities || { available: 0, rented: 0, overdue: 0 },
    condition: row.condition,
    image: row.image,
    imageUrl: row.imageUrl ?? null,
    description: row.description,
    location: row.locationText || 'Chưa cập nhật vị trí',
    coordinates: row.location?.coordinates || null, // <-- THÊM DÒNG NÀY ĐỂ FRONTEND TÍNH TOÁN
    rating: row.rating,
    reviewsCount: row.reviewsCount
  }));

  return { items, limit, hasMore: rows.length === limit };
};

export const getProductById = async (id: string) => {
  const product = await ProductModel.findById(id).lean();
  if (!product || product.isArchived) throw new Error('PRODUCT_NOT_FOUND');
  
  return {
    id: String(product._id),
    name: product.name,
    category: product.category,
    price: product.price,
    status: product.status,
    statusQuantities: product.statusQuantities,
    condition: product.condition,
    image: product.image,
    imageUrl: product.imageUrl,
    description: product.description,
    location: product.locationText || 'Chưa cập nhật vị trí',
    coordinates: product.location?.coordinates || null, // <-- THÊM DÒNG NÀY
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    lastUpdated: product.lastUpdated
  };
};

export const createProduct = async (data: any) => {
  const product = new ProductModel({
    ...data,
    image: data.image || data.imageUrl || 'https://via.placeholder.com/150'
  });
  await product.save();
  return product;
};

export const updateProduct = async (id: string, data: any) => {
  const product = await ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  return product;
};

export const deleteProduct = async (id: string) => {
  const product = await ProductModel.findByIdAndDelete(id);
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  return product;
};

export const archiveProduct = async (id: string) => {
  const product = await ProductModel.findByIdAndUpdate(id, { isArchived: true }, { new: true });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  return product;
};