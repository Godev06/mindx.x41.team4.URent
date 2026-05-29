import mongoose, { Schema } from 'mongoose';

const productStatusValues = ['Available', 'Active', 'Completed'] as const;
type ProductStatus = (typeof productStatusValues)[number];

export interface ProductDocument extends mongoose.Document {
  ownerId?: mongoose.Types.ObjectId | string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  statusQuantities: {
    available: number;
    rented: number;
    overdue: number;
  };
  isArchived: boolean;
  lastUpdated: Date;
  imageUrl: string;
  description?: string[];
  condition?: string;
  locationText?: string; // Giữ lại dạng chuỗi để hiển thị text
  location?: {
    type: string;
    coordinates: number[]; // [Kinh độ (lng), Vĩ độ (lat)]
  };
  unavailableDates?: { startDate: Date; endDate: Date }[]; // Các khoảng thời gian đã được thuê
  rating?: number;
  reviewsCount?: number;
}

const productSchema = new Schema<ProductDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: productStatusValues, default: 'Available' },
    statusQuantities: {
      available: { type: Number, default: 1, min: 0 },
      rented: { type: Number, default: 0, min: 0 },
      overdue: { type: Number, default: 0, min: 0 }
    },
    isArchived: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    image: { type: String, default: 'https://placehold.co/150' },
    imageUrl: { type: String, required: true, default: 'https://placehold.co/150' },
    description: [{ type: String, trim: true }],
    condition: { type: String, default: 'New' },
    locationText: { type: String, trim: true, default: 'Chưa cập nhật vị trí' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [105.8342, 21.0278] } // Default tại Hà Nội
    },
    unavailableDates: [
      {
        startDate: { type: Date },
        endDate: { type: Date }
      }
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

// Tạo index 2dsphere để MongoDB có thể query khoảng cách
productSchema.index({ location: '2dsphere' });

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema);