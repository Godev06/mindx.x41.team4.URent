import mongoose, { Schema } from 'mongoose';

const productStatusValues = ['Available', 'Active', 'Completed'] as const;
const stockStatusValues = ['In Stock', 'Low Stock', 'Out of Stock'] as const;

type ProductStatus = (typeof productStatusValues)[number];
type StockStatus = (typeof stockStatusValues)[number];

interface ProductOwner {
  userId?: mongoose.Types.ObjectId;
  name: string;
  avatar: string;
  rating: number;
  trips: number;
}

export interface ProductDocument extends mongoose.Document {
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  quantity: number;
  stockStatus: StockStatus;
  lastUpdated: Date;
  image: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  owner?: ProductOwner;
  description?: string;
  specs?: string[];
}

const productOwnerSchema = new Schema<ProductOwner>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    trips: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: productStatusValues, default: 'Available' },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    stockStatus: { type: String, enum: stockStatusValues, default: 'In Stock' },
    lastUpdated: { type: Date, default: Date.now },
    image: { type: String, required: true },
    imageUrl: { type: String },
    rating: { type: Number, min: 0, max: 5 },
    reviews: { type: Number, min: 0, default: 0 },
    owner: { type: productOwnerSchema },
    description: { type: String, trim: true, maxlength: 2000 },
    specs: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema);