import mongoose, { Schema } from 'mongoose';

const orderStatusValues = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

type OrderStatus = (typeof orderStatusValues)[number];

export interface OrderDocument extends mongoose.Document {
  orderCode: string;
  productId?: mongoose.Types.ObjectId;
  productName: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: OrderStatus;
  image?: string;
}

const orderSchema = new Schema<OrderDocument>(
  {
    orderCode: { type: String, required: true, unique: true, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: orderStatusValues, required: true, default: 'pending' },
    image: { type: String }
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema);