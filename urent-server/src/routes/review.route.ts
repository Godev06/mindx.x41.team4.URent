import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
  createReview,
  getProductReviews,
  getReviewByOrder
} from '../controllers/review.controller';

export const reviewRouter = Router();

/**
 * @openapi
 * /api/v1/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Tạo đánh giá mới cho đơn hàng đã hoàn tất
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *               - content
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID của đơn hàng
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Số sao đánh giá từ 1 đến 5
 *               content:
 *                 type: string
 *                 description: Nội dung nhận xét
 *     responses:
 *       201:
 *         description: Đánh giá đã được tạo thành công
 */
reviewRouter.post('/', authGuard, createReview);

/**
 * @openapi
 * /api/v1/reviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Lấy danh sách đánh giá của sản phẩm
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 */
reviewRouter.get('/product/:productId', getProductReviews);

/**
 * @openapi
 * /api/v1/reviews/order/{orderId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Lấy thông tin đánh giá theo ID đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Thông tin đánh giá
 */
reviewRouter.get('/order/:orderId', authGuard, getReviewByOrder);
