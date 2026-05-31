import { Request, Response } from 'express';
import { ReviewModel } from '../models/review.model';
import { OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/api-response';
import { z } from 'zod';

const requireUserId = (req: Request) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }
  return userId;
};

const createReviewSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    rating: z.number().min(1).max(5),
    content: z.string().min(1),
  })
});

export const createReview = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { orderId, rating, content } = createReviewSchema.parse(req).body;

  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Đơn hàng không tồn tại');
  }

  // Verify that current user is the renter or customer of the order
  const isRenter = (order.renterId && String(order.renterId) === String(userId)) || 
                   (order.customerId && String(order.customerId) === String(userId));
  if (!isRenter) {
    throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền đánh giá đơn hàng này');
  }

  // Verify that the order is completed
  if (order.status !== 'delivered') {
    throw new AppError(400, 'BAD_REQUEST', 'Chỉ có thể đánh giá sau khi đơn hàng đã hoàn tất thành công');
  }

  // Check if a review already exists for this order
  const existingReview = await ReviewModel.findOne({ orderId: order._id });
  if (existingReview) {
    throw new AppError(400, 'BAD_REQUEST', 'Bạn đã đánh giá đơn hàng này rồi');
  }

  if (!order.productId) {
    throw new AppError(400, 'BAD_REQUEST', 'Đơn hàng không có sản phẩm hợp lệ để đánh giá');
  }

  // Create the review
  const review = await ReviewModel.create({
    productId: order.productId,
    orderId: order._id,
    userId,
    rating,
    content,
  });

  // Recalculate average rating & reviewsCount for the Product
  const reviews = await ReviewModel.find({ productId: order.productId });
  const reviewsCount = reviews.length;
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount;

  await ProductModel.findByIdAndUpdate(order.productId, {
    rating: Number(averageRating.toFixed(1)),
    reviewsCount,
  });

  return sendSuccess(res, review, 'Đánh giá đã được lưu thành công', 201);
};

export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;

  const reviews = await ReviewModel.find({ productId })
    .sort({ createdAt: -1 })
    .populate('userId', 'displayName username avatarUrl');

  return sendSuccess(res, reviews);
};

export const getReviewByOrder = async (req: Request, res: Response) => {
  requireUserId(req);
  const { orderId } = req.params;

  const review = await ReviewModel.findOne({ orderId })
    .populate('userId', 'displayName username avatarUrl');

  return sendSuccess(res, review);
};
