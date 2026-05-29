import { ProductModel } from '../models/product.model';
import { UserModel } from '../models/user.model';

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
    .populate('ownerId', 'displayName avatarUrl trustScore')
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const items = rows.map((row) => {
    const ownerDoc = row.ownerId as any;
    return {
      id: String(row._id),
      name: row.name,
      category: row.category,
      price: row.price,
      status: row.status,
      statusQuantities: row.statusQuantities || { available: 0, rented: 0, overdue: 0 },
      condition: row.condition,
      imageUrl: row.imageUrl || 'https://placehold.co/150',
      description: row.description,
      locationText: row.locationText || 'Chưa cập nhật vị trí',
      coordinates: row.location?.coordinates || null,
      rating: row.rating,
      reviewsCount: row.reviewsCount,
      owner: ownerDoc ? {
        id: String(ownerDoc._id),
        name: ownerDoc.displayName || 'URent User',
        avatar: ownerDoc.avatarUrl || null,
        rating: ownerDoc.trustScore ?? 100,
      } : null,
    };
  });

  return { items, limit, hasMore: rows.length === limit };
};

/**
 * Get products owned by a specific user (for inventory management)
 */
export const listMyProducts = async (ownerId: string, options: {
  limit?: number;
  q?: string;
  category?: string;
}) => {
  const limit = options.limit ?? 100;

  const query: Record<string, any> = {
    ownerId,
    isArchived: false,
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

  const rows = await ProductModel.find(query)
    .populate('ownerId', 'displayName avatarUrl trustScore')
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  const items = rows.map((row) => {
    const ownerDoc = row.ownerId as any;
    return {
      id: String(row._id),
      name: row.name,
      category: row.category,
      price: row.price,
      status: row.status,
      statusQuantities: row.statusQuantities || { available: 1, rented: 0, overdue: 0 },
      condition: row.condition,
      imageUrl: row.imageUrl || 'https://placehold.co/150',
      description: row.description,
      locationText: row.locationText || 'Chưa cập nhật vị trí',
      coordinates: row.location?.coordinates || null,
      rating: row.rating,
      reviewsCount: row.reviewsCount,
      owner: ownerDoc ? {
        id: String(ownerDoc._id),
        name: ownerDoc.displayName || 'URent User',
        avatar: ownerDoc.avatarUrl || null,
        rating: ownerDoc.trustScore ?? 100,
      } : null,
    };
  });

  return { items, limit, hasMore: rows.length === limit };
};

export const getProductById = async (id: string) => {
  const product = await ProductModel.findById(id).populate('ownerId', 'displayName avatarUrl trustScore').lean();
  if (!product || product.isArchived) throw new Error('PRODUCT_NOT_FOUND');
  
  const ownerDoc = product.ownerId as any;
  return {
    id: String(product._id),
    name: product.name,
    category: product.category,
    price: product.price,
    status: product.status,
    statusQuantities: product.statusQuantities,
    condition: product.condition,
    imageUrl: product.imageUrl || 'https://placehold.co/150',
    description: product.description,
    locationText: product.locationText || 'Chưa cập nhật vị trí',
    coordinates: product.location?.coordinates || null,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    lastUpdated: product.lastUpdated,
    ownerId: ownerDoc ? String(ownerDoc._id) : String(product.ownerId || ''),
    owner: ownerDoc ? {
      id: String(ownerDoc._id),
      name: ownerDoc.displayName || 'URent User',
      avatar: ownerDoc.avatarUrl || null,
      rating: ownerDoc.trustScore ?? 100,
    } : null
  };
};

export const createProduct = async (data: any, ownerId?: string) => {
  // Fetch owner display info to embed in response
  let ownerInfo: { id: string; name: string; avatar: string | null; rating: number } | null = null;
  if (ownerId) {
    try {
      const ownerUser = await UserModel.findById(ownerId).select('displayName avatarUrl trustScore').lean();
      if (ownerUser) {
        ownerInfo = {
          id: String(ownerUser._id),
          name: ownerUser.displayName || 'URent User',
          avatar: ownerUser.avatarUrl || null,
          rating: ownerUser.trustScore ?? 100,
        };
      }
    } catch (e) {
      console.warn('[createProduct] Could not fetch owner info:', e);
    }
  }

  const product = new ProductModel({
    ...data,
    ownerId: ownerId || undefined,
    imageUrl: data.imageUrl || 'https://placehold.co/150',
    image: data.imageUrl || 'https://placehold.co/150'
  });
  await product.save();

  // Return normalized object (same shape as listMyProducts)
  return {
    id: String(product._id),
    name: product.name,
    category: product.category,
    price: product.price,
    status: product.status,
    statusQuantities: product.statusQuantities || { available: 1, rented: 0, overdue: 0 },
    condition: product.condition,
    imageUrl: product.imageUrl || 'https://placehold.co/150',
    description: product.description,
    locationText: product.locationText || 'Chưa cập nhật vị trí',
    coordinates: product.location?.coordinates || null,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    owner: ownerInfo,
  };
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