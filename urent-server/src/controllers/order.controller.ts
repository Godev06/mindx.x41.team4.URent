import { Request, Response } from 'express';
import { OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
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

  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError(404, 'NOT_FOUND', 'Sản phẩm không tồn tại');
  }

  if (product.ownerId && String(product.ownerId) === String(userId)) {
    throw new AppError(400, 'BAD_REQUEST', 'Bạn không thể tự thuê sản phẩm của chính mình');
  }

  // Generate order code
  const orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  const order = await OrderModel.create({
    orderCode,
    productId,
    productName,
    ownerId: product.ownerId,
    renterId: userId,
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

  // Create notification for the product owner
  if (product.ownerId) {
    await createLinkedActivityNotification({
      userId: String(product.ownerId),
      activity: {
        action: 'order_requested',
        description: `Yêu cầu thuê mới cho sản phẩm ${productName} từ khách hàng ${order.customerName}`,
        type: 'update'
      },
      notification: {
        title: 'Yêu cầu thuê mới',
        description: `Bạn nhận được yêu cầu thuê mới cho sản phẩm ${productName} từ khách hàng ${order.customerName}`,
        type: 'order'
      }
    });
  }

  return sendSuccess(res, order, undefined, 201);
};

export const getUserOrders = async (req: Request, res: Response) => {
  const userId = requireUserId(req);

  const orders = await OrderModel.find({
    $or: [{ customerId: userId }, { ownerId: userId }],
  })
    .sort({ createdAt: -1 })
    .populate('productId', 'name image imageUrl');

  return sendSuccess(res, orders);
};

// Owner can view orders for their products
export const getOwnerOrders = async (req: Request, res: Response) => {
  const ownerId = requireUserId(req);

  const orders = await OrderModel.find({ ownerId })
    .sort({ createdAt: -1 })
    .populate('productId', 'name image imageUrl');

  return sendSuccess(res, orders);
};
export const getAllOrders = async (req: Request, res: Response) => {
  const orders = await OrderModel.find()
    .sort({ createdAt: -1 })
    .populate('productId', 'name image imageUrl');
  return sendSuccess(res, orders);
};

export const getAllOrdersByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const orders = await OrderModel.find({
    $or: [{ ownerId: userId }, { renterId: userId }, { customerId: userId }],
  })
    .sort({ createdAt: -1 })
    .populate('productId', 'name image imageUrl');
  return sendSuccess(res, orders);
};

export const getOrderById = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const { id } = req.params;

  const order = await OrderModel.findOne({
    _id: id,
    $or: [{ customerId: userId }, { ownerId: userId }],
  })
    // Populate product basic info and deep populate its owner
    .populate({
      path: 'productId',
      select: 'name image imageUrl description locationText location',
      populate: {
        path: 'ownerId',
        select: 'displayName avatarUrl phone rating trips',
      },
    })
    // Populate order owner (who listed the product)
    .populate('ownerId', 'displayName avatarUrl phone rating trips')
    // Populate renter (the user who rents)
    .populate('renterId', 'displayName avatarUrl phone rating trips')
    // Populate customer (might be same as renter)
    .populate('customerId', 'displayName avatarUrl phone rating trips');

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
    {
      _id: id,
      $or: [
        { customerId: userId },
        { ownerId: userId },
        { renterId: userId }
      ]
    },
    { status },
    { new: true }
  );

  if (!order) {
    throw new AppError(404, 'NOT_FOUND', 'Order not found');
  }

  // Create notification for status update (updater)
  await createLinkedActivityNotification({
    userId,
    activity: {
      action: 'order_status_updated',
      description: `Trạng thái đơn hàng ${order.orderCode} đã được cập nhật thành ${status}`,
      type: 'update'
    },
    notification: {
      title: 'Cập nhật đơn hàng',
      description: `Bạn đã cập nhật trạng thái đơn hàng ${order.orderCode} thành ${status}`,
      type: 'order'
    }
  });

  // Create notification for the other party
  const targetUserId = String(userId) === String(order.customerId) || String(userId) === String(order.renterId)
    ? String(order.ownerId)
    : (order.customerId ? String(order.customerId) : String(order.renterId));

  if (targetUserId) {
    await createLinkedActivityNotification({
      userId: targetUserId,
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
  }

  return sendSuccess(res, order);
};