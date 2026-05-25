import { Request, Response } from 'express';
import { OrderModel } from '../models/order.model';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/api-response';
import { createLinkedActivityNotification } from '../services/activity-notification.service';
import { z } from 'zod';

const requireUserId = (req: Request) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }
  return userId;
};

const createOrderSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    totalPrice: z.number().min(0)
  })
});

export const createOrder = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { productId, productName, startDate, endDate, totalPrice } = createOrderSchema.parse(req).body;

  // Generate order code
  const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const order = await OrderModel.create({
    orderCode,
    productId,
    productName,
    customerId: userId,
    customerName: req.user?.displayName || 'Unknown User',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalPrice,
    status: 'pending'
  });

  // Create notification for the user
  await createLinkedActivityNotification({
    userId,
    activity: {
      action: 'order_created',
      description: `Đơn hàng ${orderCode} đã được tạo`,
      type: 'update'
    },
    notification: {
      title: 'Đơn hàng mới',
      description: `Bạn đã tạo đơn hàng ${orderCode} cho sản phẩm ${productName}`,
      type: 'order'
    }
  });

  return sendSuccess(res, order, undefined, 201);
};

export const getUserOrders = async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const orders = await OrderModel.find({ customerId: userId })
    .sort({ createdAt: -1 })
    .populate('productId', 'name image');

  return sendSuccess(res, orders);
};

export const getOrderById = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { id } = req.params;

  const order = await OrderModel.findOne({ _id: id, customerId: userId })
    .populate('productId', 'name image description');

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  return sendSuccess(res, order);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { id } = req.params;
  const { status } = req.body;

  const order = await OrderModel.findOneAndUpdate(
    { _id: id, customerId: userId },
    { status },
    { new: true }
  );

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  // Create notification for status update
  await createLinkedActivityNotification({
    userId,
    activity: {
      action: 'order_status_updated',
      description: `Trạng thái đơn hàng ${order.orderCode} đã được cập nhật thành ${status}`,
      type: 'update'
    },
    notification: {
      title: 'Cập nhật đơn hàng',
      description: `Đơn hàng ${order.orderCode} của bạn đã được cập nhật trạng thái thành ${status}`,
      type: 'order'
    }
  });

  return sendSuccess(res, order);
};