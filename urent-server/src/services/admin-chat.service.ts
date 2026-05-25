import mongoose from "mongoose";
import { ConversationModel } from "../models/conversation.model";
import { ConversationParticipantModel } from "../models/conversation-participant.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { decodeCursor, encodeCursor } from "../utils/cursor";

const DEFAULT_LIMIT = 20;

/**
 * Xử lý logic tìm hoặc tạo mới phòng chat support cho khách hàng.
 */
export const getOrCreateSupportConversation = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid user id");
  }

  // Lấy các participant của user này
  const userParticipants = await ConversationParticipantModel.find({
    userId: new mongoose.Types.ObjectId(userId)
  }).lean();

  const conversationIds = userParticipants.map(p => p.conversationId);

  // Tìm phòng chat loại support đã có
  let conversation = await ConversationModel.findOne({
    _id: { $in: conversationIds },
    type: "support"
  });

  if (!conversation) {
    try {
      conversation = await ConversationModel.create({
        type: "support",
        conversationType: "ONE_TO_ONE"
      });

      await ConversationParticipantModel.create({
        conversationId: conversation._id,
        userId: new mongoose.Types.ObjectId(userId),
        role: "client",
        unreadCount: 0
      });
    } catch (error) {
      // Đề phòng tranh chấp song song (race condition)
      console.error("[getOrCreateSupportConversation] Error creating conversation:", error);
      
      // Tìm lại lần nữa
      conversation = await ConversationModel.findOne({
        _id: { $in: conversationIds },
        type: "support"
      });

      if (!conversation) {
        throw new AppError(500, "INTERNAL_SERVER_ERROR", "Cannot create support conversation");
      }
    }
  }

  const clientUser = await UserModel.findById(userId)
    .select("displayName avatarUrl email")
    .lean();

  return {
    id: String(conversation._id),
    type: conversation.type,
    conversationType: conversation.conversationType,
    lastMessage: conversation.lastMessage ?? null,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    client: clientUser
      ? {
          userId: String(clientUser._id),
          displayName: clientUser.displayName ?? null,
          avatarUrl: clientUser.avatarUrl ?? null,
          email: clientUser.email,
        }
      : null
  };
};

/**
 * Trích xuất toàn bộ các cuộc hội thoại support kèm tin nhắn cuối cùng (lastMessage)
 * và thông tin người dùng (participants.user) để hiển thị lên Console Dashboard.
 */
export const listAllSupportConversations = async (options: { cursor?: string; limit?: number }) => {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const query: Record<string, any> = { type: "support" };

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cursor");
  }

  if (decodedCursor) {
    query.$or = [
      { updatedAt: { $lt: decodedCursor.createdAt } },
      {
        updatedAt: decodedCursor.createdAt,
        _id: { $lt: decodedCursor.id },
      },
    ];
  }

  const rows = await ConversationModel.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const selectedRows = rows.slice(0, limit);
  const selectedIds = selectedRows.map(row => row._id);

  // Lấy danh sách người tham gia
  const participants = await ConversationParticipantModel.find({
    conversationId: { $in: selectedIds }
  }).lean();

  const userIds = participants.map(p => p.userId);
  const uniqueUserIds = [...new Set(userIds.map(String))].map(id => new mongoose.Types.ObjectId(id));

  const users = await UserModel.find({ _id: { $in: uniqueUserIds } })
    .select("displayName avatarUrl email role")
    .lean();

  const userMap = new Map(users.map(u => [String(u._id), u]));

  const items = selectedRows.map(row => {
    const convId = String(row._id);
    const convParticipants = participants.filter(p => String(p.conversationId) === convId);

    const mappedParticipants = convParticipants.map(p => {
      const u = userMap.get(String(p.userId));
      return {
        userId: String(p.userId),
        role: p.role || "client",
        unreadCount: p.unreadCount || 0,
        lastReadAt: p.lastReadAt?.toISOString() ?? null,
        displayName: u?.displayName ?? null,
        avatarUrl: u?.avatarUrl ?? null,
        email: u?.email ?? null,
      };
    });

    const client = mappedParticipants.find(p => p.role === "client") || mappedParticipants[0] || null;

    return {
      id: convId,
      type: row.type,
      conversationType: row.conversationType,
      lastMessage: row.lastMessage ?? null,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      client,
      participants: mappedParticipants
    };
  });

  const nextRow = rows[limit];
  const nextCursor = hasMore && nextRow && nextRow.updatedAt
    ? encodeCursor(nextRow.updatedAt, nextRow._id)
    : null;

  return { items, nextCursor, hasMore, limit };
};
