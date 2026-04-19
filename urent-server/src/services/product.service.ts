import { ProductModel } from '../models/product.model';

const DEFAULT_LIMIT = 20;

const ensureLimit = (limit?: number) => limit ?? DEFAULT_LIMIT;

const buildTextSearchRegex = (value?: string) => {
  if (!value) {
    return null;
  }

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
};

export const listProducts = async (options: { limit?: number; q?: string }) => {
  const limit = ensureLimit(options.limit);
  const regex = buildTextSearchRegex(options.q);

  const query: Record<string, unknown> = {};
  if (regex) {
    query.$or = [{ name: regex }, { category: regex }, { description: regex }];
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
    image: row.image,
    imageUrl: row.imageUrl ?? null,
    rating: row.rating ?? null,
    reviews: row.reviews ?? null
  }));

  return { items, limit, hasMore: rows.length === limit };
};