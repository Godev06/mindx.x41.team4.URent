import mongoose from "mongoose";
import { ConversationModel } from "../models/conversation.model";
import { ConversationParticipantModel } from "../models/conversation-participant.model";
import {
  MessageModel,
  MessageLocationMetadata,
  MessageProductMetadata,
} from "../models/message.model";
import { ProductModel } from "../models/product.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { createLinkedActivityNotification } from "./activity-notification.service";
import { SYSTEM_ADMIN_DISPLAY_NAME, SYSTEM_ADMIN_AVATAR_URL, getSystemAdmin, getSystemAdminId } from "../utils/admin";

const DEFAULT_LIMIT = 20;
const ONLY_ONE_TO_ONE_MESSAGE = "Chi ho tro tin nhan cho hoi thoai 1v1";

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const ensureLimit = (limit?: number) => limit ?? DEFAULT_LIMIT;

const buildOneToOnePairKey = (firstUserId: string, secondUserId: string) => {
  const [a, b] = [firstUserId, secondUserId].sort();
  return `${a}:${b}`;
};

const isDuplicateKeyError = (error: unknown) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
};

const buildTextSearchRegex = (value?: string) => {
  if (!value) {
    return null;
  }

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
};

interface ConversationAccessState {
  exists: boolean;
  isMember: boolean;
  participantCount: number;
}

export const getConversationAccessState = async (
  conversationId: string,
  userId: string,
): Promise<ConversationAccessState> => {
  if (
    !mongoose.Types.ObjectId.isValid(conversationId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return { exists: false, isMember: false, participantCount: 0 };
  }

  const [conversationExists, participants] = await Promise.all([
    ConversationModel.exists({ _id: conversationId }),
    ConversationParticipantModel.find({ conversationId })
      .select("userId deletedAt")
      .lean(),
  ]);

  const isMember = participants.some(
    (participant) =>
      String(participant.userId) === userId && !participant.deletedAt,
  );

  return {
    exists: Boolean(conversationExists),
    isMember,
    participantCount: participants.length,
  };
};

const getOneToOneConversationIdSet = async (
  conversationIds: mongoose.Types.ObjectId[],
) => {
  if (conversationIds.length === 0) {
    return new Set<string>();
  }

  const rows = await ConversationParticipantModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
  }>([
    { $match: { conversationId: { $in: conversationIds } } },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    { $match: { count: 2 } },
  ]);

  return new Set(rows.map((row) => String(row._id)));
};

export const isConversationMember = async (
  conversationId: string,
  userId: string,
) => {
  const state = await getConversationAccessState(conversationId, userId);
  return state.isMember;
};

export const getOrCreateOneToOneConversation = async (
  userId: string,
  peerUserId: string,
) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(peerUserId)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid user id");
  }

  const [userObj, peerObj] = await Promise.all([
    UserModel.findById(userId).select("role").lean(),
    UserModel.findById(peerUserId).select("role").lean(),
  ]);

  const hasAdmin = (userObj?.role === "admin") || (peerObj?.role === "admin");

  if (hasAdmin) {
    if (userObj?.role === "admin" && peerObj?.role === "admin") {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Khong the tao hoi thoai giua cac tai khoan Admin",
      );
    }

    const clientUserId = userObj?.role === "admin" ? peerUserId : userId;
    const adminUserId = userObj?.role === "admin" ? userId : peerUserId;

    // Find if the client already has a support conversation
    const clientParticipants = await ConversationParticipantModel.find({
      userId: toObjectId(clientUserId),
    }).select("conversationId").lean();

    const conversationIds = clientParticipants.map((p) => p.conversationId);

    let conversation = await ConversationModel.findOne({
      _id: { $in: conversationIds },
      type: "support",
    });

    if (!conversation) {
      conversation = await ConversationModel.create({
        type: "support",
        conversationType: "ONE_TO_ONE",
      });

      await ConversationParticipantModel.create({
        conversationId: conversation._id,
        userId: toObjectId(clientUserId),
        role: "client",
        unreadCount: 0,
      });
    }

    // Ensure client is active
    await ConversationParticipantModel.updateOne(
      { conversationId: conversation._id, userId: toObjectId(clientUserId) },
      { $set: { deletedAt: null } }
    );

    // If the admin is starting the conversation, ensure the admin is added as participant
    if (userObj?.role === "admin") {
      const adminParticipantExists = await ConversationParticipantModel.exists({
        conversationId: conversation._id,
        userId: toObjectId(adminUserId),
      });

      if (!adminParticipantExists) {
        await ConversationParticipantModel.create({
          conversationId: conversation._id,
          userId: toObjectId(adminUserId),
          role: "admin_moderator",
          unreadCount: 0,
        });
      } else {
        await ConversationParticipantModel.updateOne(
          { conversationId: conversation._id, userId: toObjectId(adminUserId) },
          { $set: { deletedAt: null } }
        );
      }
    }

    const peerAdminUser = await UserModel.findById(adminUserId)
      .select("displayName avatarUrl email role")
      .lean();

    const peerClientUser = await UserModel.findById(clientUserId)
      .select("displayName avatarUrl email role")
      .lean();

    const isRequesterAdmin = userObj?.role === "admin";

    return {
      id: String(conversation._id),
      conversationType: "ONE_TO_ONE" as const,
      type: "support" as const,
      lastMessage: conversation.lastMessage ?? null,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      peer: isRequesterAdmin
        ? (peerClientUser
            ? {
                userId: String(peerClientUser._id),
                displayName: peerClientUser.displayName ?? null,
                avatarUrl: peerClientUser.avatarUrl ?? null,
                email: peerClientUser.email,
              }
            : null)
        : {
            userId: String(peerAdminUser?._id || adminUserId),
            displayName: SYSTEM_ADMIN_DISPLAY_NAME,
            avatarUrl: SYSTEM_ADMIN_AVATAR_URL,
            email: peerAdminUser?.email || "support@urent.com",
          },
    };
  }

  let mappedUserId = userId;
  let mappedPeerUserId = peerUserId;

  if (mappedUserId === mappedPeerUserId) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Khong the tao hoi thoai 1v1 voi chinh minh hoac giua cac tai khoan Admin",
    );
  }

  const pairKey = buildOneToOnePairKey(mappedUserId, mappedPeerUserId);
  const conversationTypeField = "one_to_one";

  let conversation = await ConversationModel.findOne({
    conversationType: "ONE_TO_ONE",
    pairKey,
  });

  if (!conversation) {
    try {
      conversation = await ConversationModel.create({
        conversationType: "ONE_TO_ONE",
        pairKey,
        type: conversationTypeField,
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      conversation = await ConversationModel.findOne({
        conversationType: "ONE_TO_ONE",
        pairKey,
      });
    }
  }

  if (!conversation) {
    throw new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Cannot create conversation",
    );
  }

  await Promise.all([
    ConversationParticipantModel.updateOne(
      { conversationId: conversation._id, userId: mappedUserId },
      {
        $set: { deletedAt: null },
        $setOnInsert: { unreadCount: 0 },
      },
      { upsert: true },
    ),
    ConversationParticipantModel.updateOne(
      { conversationId: conversation._id, userId: mappedPeerUserId },
      { $setOnInsert: { unreadCount: 0, deletedAt: null } },
      { upsert: true },
    ),
  ]);

  const peer = await UserModel.findById(mappedPeerUserId)
    .select("displayName avatarUrl email role")
    .lean();

  return {
    id: String(conversation._id),
    conversationType: "ONE_TO_ONE" as const,
    pairKey,
    lastMessage: conversation.lastMessage ?? null,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    peer: peer
      ? {
          userId: String(peer._id),
          displayName: peer.displayName ?? null,
          avatarUrl: peer.avatarUrl ?? null,
          email: peer.email,
        }
      : null,
  };
};

export const getConversationPeerByEmail = async (
  userId: string,
  email: string,
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const peer = await UserModel.findOne({ email: normalizedEmail })
    .select("displayName avatarUrl email phone role")
    .lean();

  if (!peer) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  if (String(peer._id) === userId) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Khong the tao hoi thoai voi chinh minh",
    );
  }

  if (peer.role === "admin") {
    return {
      userId: String(peer._id),
      displayName: SYSTEM_ADMIN_DISPLAY_NAME,
      avatarUrl: SYSTEM_ADMIN_AVATAR_URL,
      email: peer.email,
      phone: null,
    };
  }

  return {
    userId: String(peer._id),
    displayName: peer.displayName ?? null,
    avatarUrl: peer.avatarUrl ?? null,
    email: peer.email,
    phone: peer.phone ?? null,
  };
};

export const getConversationPeerByPhone = async (
  userId: string,
  phone: string,
) => {
  const normalizedPhone = phone.trim();

  const peer = await UserModel.findOne({ phone: normalizedPhone })
    .select("displayName avatarUrl email phone role")
    .lean();

  if (!peer) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  if (String(peer._id) === userId) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Khong the tao hoi thoai voi chinh minh",
    );
  }

  if (peer.role === "admin") {
    return {
      userId: String(peer._id),
      displayName: SYSTEM_ADMIN_DISPLAY_NAME,
      avatarUrl: SYSTEM_ADMIN_AVATAR_URL,
      email: peer.email,
      phone: null,
    };
  }

  return {
    userId: String(peer._id),
    displayName: peer.displayName ?? null,
    avatarUrl: peer.avatarUrl ?? null,
    email: peer.email,
    phone: peer.phone ?? null,
  };
};

const ensureConversationAccess = async (
  conversationId: string,
  userId: string,
) => {
  const conversation = await ConversationModel.findById(conversationId).select("type").lean();
  if (!conversation) {
    throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  }

  if (conversation.type === "support") {
    const user = await UserModel.findById(userId).select("role").lean();
    if (user?.role === "admin") {
      return; // Admin always has access to support conversations
    }
  }

  const state = await getConversationAccessState(conversationId, userId);

  if (!state.exists) {
    throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  }

  if (!state.isMember) {
    throw new AppError(
      403,
      "FORBIDDEN_CONVERSATION_ACCESS",
      "You are not a member of this conversation",
    );
  }

  if (conversation.type !== "support" && state.participantCount !== 2) {
    throw new AppError(400, "CONVERSATION_NOT_1V1", ONLY_ONE_TO_ONE_MESSAGE);
  }
};

const buildConversationLastMessage = (
  messageType: "TEXT" | "PRODUCT" | "LOCATION",
  content?: string,
) => {
  if (messageType === "TEXT") {
    return content ?? "";
  }

  if (messageType === "PRODUCT") {
    return "[Product]";
  }

  return "[Location]";
};

export const listConversations = async (
  userId: string,
  options: { cursor?: string; limit?: number; q?: string },
) => {
  const limit = ensureLimit(options.limit);

  const memberRows = await ConversationParticipantModel.find({
    userId,
    deletedAt: null,
  }).select("conversationId unreadCount lastReadAt");
  if (memberRows.length === 0) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  const allConversationIds = memberRows.map((row) => row.conversationId);
  const conversationsList = await ConversationModel.find({
    _id: { $in: allConversationIds },
  }).select("_id type").lean();

  const supportConvIdSet = new Set(
    conversationsList.filter((c) => c.type === "support").map((c) => String(c._id))
  );

  const oneToOneConversationIdSet = await getOneToOneConversationIdSet(
    allConversationIds,
  );

  const allowedConversationIdSet = new Set([
    ...oneToOneConversationIdSet,
    ...supportConvIdSet,
  ]);

  const allowedMemberRows = memberRows.filter((row) =>
    allowedConversationIdSet.has(String(row.conversationId)),
  );

  if (allowedMemberRows.length === 0) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  const conversationIds = allowedMemberRows.map((row) => row.conversationId);
  const memberMap = new Map(
    allowedMemberRows.map((row) => [String(row.conversationId), row]),
  );

  const query: Record<string, unknown> = {
    _id: { $in: conversationIds },
  };

  const regex = buildTextSearchRegex(options.q);
  if (regex) {
    query.lastMessage = regex;
  }

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cursor");
  }

  if (decodedCursor) {
    query.$or = [
      { lastMessageAt: { $lt: decodedCursor.createdAt } },
      {
        lastMessageAt: decodedCursor.createdAt,
        _id: { $lt: decodedCursor.id },
      },
    ];
  }

  const rows = await ConversationModel.find(query)
    .sort({ lastMessageAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const selectedRows = rows.slice(0, limit);

  const selectedIds = selectedRows.map((row) => row._id);
  const participants = await ConversationParticipantModel.find({
    conversationId: { $in: selectedIds },
    userId: { $ne: toObjectId(userId) },
  })
    .select("conversationId userId")
    .lean();

  const otherUserIds = participants.map((participant) => participant.userId);

  const uniqueOtherUserIds = [...new Set(otherUserIds.map(String))].map((id) =>
    toObjectId(id),
  );

  const users = await UserModel.find({ _id: { $in: uniqueOtherUserIds } })
    .select("displayName avatarUrl email role")
    .lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  const participantByConversation = new Map<
    string,
    {
      userId: string;
      displayName: string | null;
      avatarUrl: string | null;
      email: string;
    }
  >();
  for (const participant of participants) {
    const key = String(participant.conversationId);
    const participantUserId = String(participant.userId);

    const participantUser = userMap.get(participantUserId);
    if (!participantUser) {
      continue;
    }

    participantByConversation.set(key, {
      userId: participantUserId,
      displayName:
        participantUser.role === "admin"
          ? SYSTEM_ADMIN_DISPLAY_NAME
          : (participantUser.displayName ?? null),
      avatarUrl:
        participantUser.role === "admin"
          ? SYSTEM_ADMIN_AVATAR_URL
          : (participantUser.avatarUrl ?? null),
      email: participantUser.email,
    });
  }

  const items = selectedRows.map((row) => {
    const key = String(row._id);
    const member = memberMap.get(key);

    let peer = participantByConversation.get(key) ?? null;

    if (row.type === "support") {
      peer = {
        userId: "system_admin",
        displayName: SYSTEM_ADMIN_DISPLAY_NAME,
        avatarUrl: SYSTEM_ADMIN_AVATAR_URL,
        email: "support@urent.com",
      };
    }

    return {
      id: key,
      type: row.type,
      lastMessage: row.lastMessage ?? null,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      unreadCount: member?.unreadCount ?? 0,
      lastReadAt: member?.lastReadAt?.toISOString() ?? null,
      peer,
      participants: peer ? [peer] : [],
    };
  });

  const nextRow = rows[limit];
  const nextCursor =
    hasMore && nextRow && nextRow.lastMessageAt
      ? encodeCursor(nextRow.lastMessageAt, nextRow._id)
      : null;

  return { items, nextCursor, hasMore, limit };
};

export const listConversationMessages = async (
  userId: string,
  conversationId: string,
  options: { cursor?: string; limit?: number; search?: string },
) => {
  await ensureConversationAccess(conversationId, userId);

  const limit = ensureLimit(options.limit);
  const filters: Record<string, unknown>[] = [
    { conversationId: toObjectId(conversationId) },
  ];

  const searchRegex = buildTextSearchRegex(options.search);
  if (searchRegex) {
    filters.push({
      $or: [
        { content: searchRegex },
        { "metadata.snapshot.name": searchRegex },
        { "metadata.address": searchRegex },
      ],
    });
  }

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cursor");
  }

  if (decodedCursor) {
    filters.push({
      $or: [
        { createdAt: { $lt: decodedCursor.createdAt } },
        { createdAt: decodedCursor.createdAt, _id: { $lt: decodedCursor.id } },
      ],
    });
  }

  const query: Record<string, unknown> =
    filters.length === 1 ? filters[0] : { $and: filters };

  const rows = await MessageModel.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const selectedRows = rows.slice(0, limit);

  const items = selectedRows.map((row) => ({
    id: String(row._id),
    conversationId: String(row.conversationId),
    senderId: String(row.senderId),
    messageType: row.messageType,
    content: row.content ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  }));

  const nextRow = rows[limit];
  const nextCursor =
    hasMore && nextRow ? encodeCursor(nextRow.createdAt, nextRow._id) : null;

  return { items, nextCursor, hasMore, limit };
};

export const sendConversationMessage = async (
  userId: string,
  conversationId: string,
  payload: {
    messageType: "TEXT" | "PRODUCT" | "LOCATION";
    content?: string;
    metadata?: unknown;
  },
) => {
  try {
    const conversation = await ConversationModel.findById(conversationId).select("type").lean();
    if (conversation && conversation.type === "support") {
      const sender = await UserModel.findById(userId).select("role").lean();
      if (sender?.role === "admin") {
        const participantExists = await ConversationParticipantModel.exists({
          conversationId,
          userId,
        });
        if (!participantExists) {
          await ConversationParticipantModel.create({
            conversationId,
            userId,
            role: "admin_moderator",
            unreadCount: 0,
          });
        }
      }
    }

    await ensureConversationAccess(conversationId, userId);

    let metadata:
      | MessageProductMetadata
      | MessageLocationMetadata
      | Record<string, unknown>
      | undefined;
    let content = payload.content?.trim() || undefined;

    if (payload.messageType === "TEXT") {
      if (!content) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "TEXT message content is required",
        );
      }
    }

    if (payload.messageType === "PRODUCT") {
      const productId = (payload.metadata as { productId?: string } | undefined)
        ?.productId;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "metadata.productId is required for PRODUCT",
        );
      }

      const product = await ProductModel.findById(productId)
        .select("name price image imageUrl category")
        .lean();
      if (!product) {
        throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
      }

      metadata = {
        productId,
        snapshot: {
          name: product.name,
          pricePerDay: product.price,
          imageUrl: product.imageUrl ?? product.image,
          category: product.category,
        },
      };
    }

    if (payload.messageType === "LOCATION") {
      const location = payload.metadata as MessageLocationMetadata | undefined;
      const latitude = Number(location?.latitude);
      const longitude = Number(location?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          "metadata.latitude and metadata.longitude are required for LOCATION",
        );
      }

      metadata = {
        latitude,
        longitude,
        address: location?.address?.trim() || undefined,
      };
    }

    const now = new Date();

    const message = await MessageModel.create({
      conversationId,
      senderId: userId,
      messageType: payload.messageType,
      content,
      metadata,
    });

    await ConversationModel.updateOne(
      { _id: conversationId },
      {
        $set: {
          lastMessage: buildConversationLastMessage(
            payload.messageType,
            content,
          ),
          lastMessageAt: now,
        },
      },
    );

    await ConversationParticipantModel.updateMany(
      {
        conversationId,
        userId: { $ne: userId },
      },
      {
        $inc: { unreadCount: 1 },
        $set: { deletedAt: null },
      },
    );

    // Lấy thông tin người gửi
    const sender = await UserModel.findById(userId).select("displayName role").lean();
    let senderName = sender?.displayName || "Người dùng";

    // Nếu người gửi là Admin, hiển thị tên chuyên nghiệp thay vì "Người dùng" hoặc tên cá nhân
    if (sender?.role === "admin") {
      const conversation = await ConversationModel.findById(conversationId).select("type").lean();
      if (conversation?.type === "support") {
        senderName = "U-Rent Support";
      } else {
        senderName = SYSTEM_ADMIN_DISPLAY_NAME;
      }
    }

    // Chuẩn bị phần xem trước tin nhắn (message preview)
    let messagePreview = "";
    if (message.messageType === "TEXT") {
      const contentLimit = 60;
      const cleanContent = message.content ? message.content.trim() : "";
      if (cleanContent.length > contentLimit) {
        messagePreview = cleanContent.substring(0, contentLimit) + "...";
      } else {
        messagePreview = cleanContent;
      }
    } else if (message.messageType === "PRODUCT") {
      const productName = (message.metadata as any)?.snapshot?.name || "Sản phẩm";
      messagePreview = `[Sản phẩm] ${productName}`;
    } else if (message.messageType === "LOCATION") {
      const address = (message.metadata as any)?.address || "Vị trí đã chia sẻ";
      messagePreview = `[Vị trí] ${address}`;
    } else {
      messagePreview = "Đã gửi một tin nhắn";
    }

    // Tạo notification cho người nhận
    const recipients = await ConversationParticipantModel.find(
      { conversationId, userId: { $ne: userId } },
      { userId: 1 },
    ).lean();

    const recipientUserIds = recipients.map((r) => r.userId);
    const recipientUsers = await UserModel.find(
      { _id: { $in: recipientUserIds } },
      { role: 1 },
    ).lean();

    const recipientRoleMap = new Map(
      recipientUsers.map((u) => [String(u._id), u.role]),
    );

    for (const recipient of recipients) {
      const recipientRole = recipientRoleMap.get(String(recipient.userId));
      const actionUrl =
        recipientRole === "admin"
          ? "/admin/chat"
          : `/messages/${conversationId}`;

      await createLinkedActivityNotification({
        userId: String(recipient.userId),
        activity: {
          action: "message_received",
          description: `Nhận tin nhắn mới từ ${senderName}: ${messagePreview}`,
          type: "update",
        },
        notification: {
          title: "Tin nhắn mới",
          description: `Bạn có tin nhắn mới từ ${senderName}: ${messagePreview}`,
          type: "message",
          actionUrl,
        },
        eventKey: `message_${String(message._id)}`,
      });
    }

    return {
      id: String(message._id),
      conversationId,
      senderId: userId,
      messageType: message.messageType,
      content: message.content ?? null,
      metadata: message.metadata ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("[sendConversationMessage] failed:", {
      userId,
      conversationId,
      messageType: payload.messageType,
      error: error instanceof Error ? (error.stack ?? error.message) : error,
    });
    throw error;
  }
};

export const markConversationAsRead = async (
  userId: string,
  conversationId: string,
) => {
  await ensureConversationAccess(conversationId, userId);

  const now = new Date();
  await ConversationParticipantModel.updateOne(
    {
      conversationId,
      userId,
    },
    {
      $set: {
        unreadCount: 0,
        lastReadAt: now,
      },
    },
  );

  return {
    conversationId,
    userId,
    lastReadAt: now.toISOString(),
  };
};

export const deleteConversationForUser = async (
  userId: string,
  conversationId: string,
) => {
  await ensureConversationAccess(conversationId, userId);

  const deletedAt = new Date();

  await ConversationParticipantModel.updateOne(
    {
      conversationId,
      userId,
    },
    {
      $set: {
        deletedAt,
        unreadCount: 0,
        lastReadAt: deletedAt,
      },
    },
  );

  return {
    conversationId,
    userId,
    deletedAt: deletedAt.toISOString(),
  };
};

export const searchMessages = async (
  userId: string,
  options: {
    q: string;
    conversationId?: string;
    cursor?: string;
    limit?: number;
  },
) => {
  const limit = ensureLimit(options.limit);
  const searchRegex = buildTextSearchRegex(options.q);

  if (!searchRegex) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  let conversationIds: string[] = [];

  if (options.conversationId) {
    await ensureConversationAccess(options.conversationId, userId);
    conversationIds = [options.conversationId];
  } else {
    const memberships = await ConversationParticipantModel.find({
      userId,
      deletedAt: null,
    })
      .select("conversationId")
      .lean();
    const candidateIds = memberships.map(
      (membership) => membership.conversationId as mongoose.Types.ObjectId,
    );
    const oneToOneConversationIdSet =
      await getOneToOneConversationIdSet(candidateIds);
    conversationIds = candidateIds
      .map((conversationId) => String(conversationId))
      .filter((conversationId) =>
        oneToOneConversationIdSet.has(conversationId),
      );
  }

  if (conversationIds.length === 0) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  const filters: Record<string, unknown>[] = [
    { conversationId: { $in: conversationIds.map((id) => toObjectId(id)) } },
    {
      $or: [
        { content: searchRegex },
        { "metadata.snapshot.name": searchRegex },
        { "metadata.address": searchRegex },
      ],
    },
  ];

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid cursor");
  }

  if (decodedCursor) {
    filters.push({
      $or: [
        { createdAt: { $lt: decodedCursor.createdAt } },
        { createdAt: decodedCursor.createdAt, _id: { $lt: decodedCursor.id } },
      ],
    });
  }

  const query: Record<string, unknown> = { $and: filters };

  const rows = await MessageModel.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const selectedRows = rows.slice(0, limit);

  const items = selectedRows.map((row) => ({
    messageId: String(row._id),
    conversationId: String(row.conversationId),
    senderId: String(row.senderId),
    messageType: row.messageType,
    content: row.content ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  }));

  const nextRow = rows[limit];
  const nextCursor =
    hasMore && nextRow ? encodeCursor(nextRow.createdAt, nextRow._id) : null;

  return { items, nextCursor, hasMore, limit };
};
