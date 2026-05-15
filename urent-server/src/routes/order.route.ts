import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/order.controller';

export const orderRouter = Router();

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Tạo đơn hàng mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - productName
 *               - startDate
 *               - endDate
 *               - totalPrice
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID của sản phẩm
 *               productName:
 *                 type: string
 *                 description: Tên sản phẩm
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày bắt đầu thuê
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày kết thúc thuê
 *               totalPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Tổng giá tiền
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 */
orderRouter.post('/', authGuard, createOrder);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy danh sách đơn hàng của user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
orderRouter.get('/', authGuard, getUserOrders);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy chi tiết đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 */
orderRouter.get('/:id', authGuard, getOrderById);

/**
 * @openapi
 * /api/v1/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Cập nhật trạng thái đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Trạng thái đơn hàng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
 */
orderRouter.patch('/:id/status', authGuard, updateOrderStatus);