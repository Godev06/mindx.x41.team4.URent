import { Router } from "express";
import { authGuard } from "../middlewares/auth.middleware";
import { adminGuard } from "../middlewares/admin-guard.middleware";
import { UserModel } from "../models/user.model";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { ActivityLogModel } from "../models/activity-log.model";
import { ConversationModel } from "../models/conversation.model";
import { MessageModel } from "../models/message.model";
import { sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export const adminRouter = Router();

adminRouter.get(
  "/dashboard-stats",
  authGuard,
  adminGuard,
  async (req, res, next) => {
    try {
      const [totalUsers, users, totalOrders, orders, products, recentActivities] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.find().select("role").lean(),
        OrderModel.countDocuments(),
        OrderModel.find().lean(),
        ProductModel.find().lean(),
        ActivityLogModel.find()
          .populate("userId", "username displayName email avatarUrl")
          .sort({ timestamp: -1 })
          .limit(10)
          .lean(),
      ]);

      // Users stats
      const onlineUsers = Math.floor(totalUsers * 0.7); // Simulate 70% online
      const offlineUsers = totalUsers - onlineUsers;

      // Orders stats
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const completedOrders = orders.filter((o) => o.status === "delivered" || o.status === "confirmed" || o.status === "shipped").length;

      // Inventory stats
      let rentedCount = 0;
      let overdueCount = 0;
      let availableCount = 0;

      for (const p of products) {
        if (p.statusQuantities) {
          rentedCount += p.statusQuantities.rented || 0;
          overdueCount += p.statusQuantities.overdue || 0;
          availableCount += p.statusQuantities.available || 0;
        } else {
          // Fallback if statusQuantities is not populated
          if (p.status === "Active") rentedCount++;
          else if (p.status === "Available") availableCount++;
        }
      }

      const totalInventory = rentedCount + overdueCount + availableCount;

      return sendSuccess(res, {
        totalUsers,
        onlineUsers,
        offlineUsers,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalInventory,
        rentedCount,
        overdueCount,
        recentActivities,
        users
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/conversations/escrow",
  authGuard,
  adminGuard,
  async (req, res, next) => {
    try {
      const { renterId, ownerId } = req.query;
      if (!renterId || !ownerId) {
        throw new AppError(400, "VALIDATION_ERROR", "Renter ID and Owner ID are required");
      }

      const pairKey = [String(renterId), String(ownerId)].sort().join(":");
      
      const conversation = await ConversationModel.findOne({
        conversationType: "ONE_TO_ONE",
        pairKey
      }).lean();

      if (!conversation) {
        return sendSuccess(res, { messages: [], conversationId: null });
      }

      const messages = await MessageModel.find({
        conversationId: conversation._id
      }).sort({ createdAt: 1 }).lean();

      return sendSuccess(res, {
        messages,
        conversationId: String(conversation._id)
      });
    } catch (error) {
      next(error);
    }
  }
);

