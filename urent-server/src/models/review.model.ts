import mongoose, { Schema } from 'mongoose';

export interface ReviewDocument extends mongoose.Document {
  productId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User writing the review (renter)
  rating: number; // 1 to 5
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true }, // Max 1 review per order
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model<ReviewDocument>('Review', reviewSchema);
