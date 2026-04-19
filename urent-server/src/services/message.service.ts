import mongoose from 'mongoose';
import { ConversationModel } from '../models/conversation.model';
import { ConversationParticipantModel } from '../models/conversation-participant.model';
import { MessageModel, MessageLocationMetadata, MessageProductMetadata } from '../models/message.model';
import { ProductModel } from '../models/product.model';
import { UserModel } from '../models/user.model';
import { AppError } from '../utils/app-error';
import { decodeCursor, encodeCursor } from '../utils/cursor';

const DEFAULT_LIMIT = 20;
const ONLY_ONE_TO_ONE_MESSAGE = 'Chi ho tro tin nhan cho hoi thoai 1v1';

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const ensureLimit = (limit?: number) => limit ?? DEFAULT_LIMIT;

const buildOneToOnePairKey = (firstUserId: string, secondUserId: string) => {
  const [a, b] = [firstUserId, secondUserId].sort();
  return `${a}:${b}`;
};

const isDuplicateKeyError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
};

const buildTextSearchRegex = (value?: string) => {
  if (!value) {
    return null;
  }

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
};

interface ConversationAccessState {
  exists: boolean;
  isMember: boolean;
  participantCount: number;
}

export const getConversationAccessState = async (
  conversationId: string,
  userId: string
): Promise<ConversationAccessState> => {
  if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return { exists: false, isMember: false, participantCount: 0 };
  }

  const [conversationExists, participants] = await Promise.all([
    ConversationModel.exists({ _id: conversationId }),
    ConversationParticipantModel.find({ conversationId })
      .select('userId deletedAt')
      .lean()
  ]);

  const isMember = participants.some(
    (participant) =>
      String(participant.userId) === userId && !participant.deletedAt
  );

  return {
    exists: Boolean(conversationExists),
    isMember,
    participantCount: participants.length
  };
};

const getOneToOneConversationIdSet = async (conversationIds: mongoose.Types.ObjectId[]) => {
  if (conversationIds.length === 0) {
    return new Set<string>();
  }

  const rows = await ConversationParticipantModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { conversationId: { $in: conversationIds } } },
    { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    { $match: { count: 2 } }
  ]);

  return new Set(rows.map((row) => String(row._id)));
};

export const isConversationMember = async (conversationId: string, userId: string) => {
  const state = await getConversationAccessState(conversationId, userId);
  return state.isMember;
};

export const getOrCreateOneToOneConversation = async (userId: string, peerUserId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(peerUserId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid user id');
  }

  if (userId === peerUserId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Khong the tao hoi thoai 1v1 voi chinh minh');
  }

  const peerExists = await UserModel.exists({ _id: peerUserId });
  if (!peerExists) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const pairKey = buildOneToOnePairKey(userId, peerUserId);

  let conversation = await ConversationModel.findOne({
    conversationType: 'ONE_TO_ONE',
    pairKey
  }).lean();

  if (!conversation) {
    try {
      conversation = await ConversationModel.create({
        conversationType: 'ONE_TO_ONE',
        pairKey
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      conversation = await ConversationModel.findOne({
        conversationType: 'ONE_TO_ONE',
        pairKey
      }).lean();
    }
  }

  if (!conversation) {
    throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'Cannot create conversation');
  }

  await Promise.all([
    ConversationParticipantModel.updateOne(
      { conversationId: conversation._id, userId },
      {
        $set: { deletedAt: null },
        $setOnInsert: { unreadCount: 0 }
      },
      { upsert: true }
    ),
    ConversationParticipantModel.updateOne(
      { conversationId: conversation._id, userId: peerUserId },
      { $setOnInsert: { unreadCount: 0, deletedAt: null } },
      { upsert: true }
    )
  ]);

  const peer = await UserModel.findById(peerUserId).select('displayName avatarUrl email').lean();

  return {
    id: String(conversation._id),
    conversationType: 'ONE_TO_ONE' as const,
    pairKey,
    lastMessage: conversation.lastMessage ?? null,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    peer: peer
      ? {
          userId: String(peer._id),
          displayName: peer.displayName ?? null,
          avatarUrl: peer.avatarUrl ?? null,
          email: peer.email
        }
      : null
  };
};

export const getOrCreateOneToOneConversationByEmail = async (
  userId: string,
  peerEmail: string
) => {
  const normalizedEmail = peerEmail.trim().toLowerCase();

  const peer = await UserModel.findOne({ email: normalizedEmail })
    .select('_id')
    .lean();

  if (!peer) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return getOrCreateOneToOneConversation(userId, String(peer._id));
};

export const getConversationPeerByEmail = async (
  userId: string,
  email: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const peer = await UserModel.findOne({ email: normalizedEmail })
    .select('displayName avatarUrl email')
    .lean();

  if (!peer) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (String(peer._id) === userId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Khong the tao hoi thoai voi chinh minh');
  }

  return {
    userId: String(peer._id),
    displayName: peer.displayName ?? null,
    avatarUrl: peer.avatarUrl ?? null,
    email: peer.email
  };
};

const ensureConversationAccess = async (conversationId: string, userId: string) => {
  const state = await getConversationAccessState(conversationId, userId);

  if (!state.exists) {
    throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
  }

  if (!state.isMember) {
    throw new AppError(403, 'FORBIDDEN_CONVERSATION_ACCESS', 'You are not a member of this conversation');
  }

  if (state.participantCount !== 2) {
    throw new AppError(400, 'CONVERSATION_NOT_1V1', ONLY_ONE_TO_ONE_MESSAGE);
  }
};

const buildConversationLastMessage = (messageType: 'TEXT' | 'PRODUCT' | 'LOCATION', content?: string) => {
  if (messageType === 'TEXT') {
    return content ?? '';
  }

  if (messageType === 'PRODUCT') {
    return '[Product]';
  }

  return '[Location]';
};

export const listConversations = async (userId: string, options: { cursor?: string; limit?: number; q?: string }) => {
  const limit = ensureLimit(options.limit);

  const memberRows = await ConversationParticipantModel.find({ userId, deletedAt: null })
    .select('conversationId unreadCount lastReadAt');
  if (memberRows.length === 0) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  const oneToOneConversationIdSet = await getOneToOneConversationIdSet(memberRows.map((row) => row.conversationId));
  const oneToOneMemberRows = memberRows.filter((row) => oneToOneConversationIdSet.has(String(row.conversationId)));

  if (oneToOneMemberRows.length === 0) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  const conversationIds = oneToOneMemberRows.map((row) => row.conversationId);
  const memberMap = new Map(oneToOneMemberRows.map((row) => [String(row.conversationId), row]));

  const query: Record<string, unknown> = {
    _id: { $in: conversationIds }
  };

  const regex = buildTextSearchRegex(options.q);
  if (regex) {
    query.lastMessage = regex;
  }

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid cursor');
  }

  if (decodedCursor) {
    query.$or = [
      { lastMessageAt: { $lt: decodedCursor.createdAt } },
      { lastMessageAt: decodedCursor.createdAt, _id: { $lt: decodedCursor.id } }
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
    userId: { $ne: toObjectId(userId) }
  })
    .select('conversationId userId')
    .lean();

  const otherUserIds = participants.map((participant) => participant.userId);

  const uniqueOtherUserIds = [...new Set(otherUserIds.map(String))].map((id) => toObjectId(id));

  const users = await UserModel.find({ _id: { $in: uniqueOtherUserIds } })
    .select('displayName avatarUrl email')
    .lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  const participantByConversation = new Map<string, { userId: string; displayName: string | null; avatarUrl: string | null; email: string }>();
  for (const participant of participants) {
    const key = String(participant.conversationId);
    const participantUserId = String(participant.userId);

    const participantUser = userMap.get(participantUserId);
    if (!participantUser) {
      continue;
    }

    participantByConversation.set(key, {
      userId: participantUserId,
      displayName: participantUser.displayName ?? null,
      avatarUrl: participantUser.avatarUrl ?? null,
      email: participantUser.email
    });
  }

  const items = selectedRows.map((row) => {
    const key = String(row._id);
    const member = memberMap.get(key);

    const peer = participantByConversation.get(key) ?? null;

    return {
      id: key,
      lastMessage: row.lastMessage ?? null,
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      unreadCount: member?.unreadCount ?? 0,
      lastReadAt: member?.lastReadAt?.toISOString() ?? null,
      peer,
      participants: peer ? [peer] : []
    };
  });

  const nextRow = rows[limit];
  const nextCursor = hasMore && nextRow?.lastMessageAt ? encodeCursor(nextRow.lastMessageAt, nextRow._id) : null;

  return { items, nextCursor, hasMore, limit };
};

export const listConversationMessages = async (
  userId: string,
  conversationId: string,
  options: { cursor?: string; limit?: number; search?: string }
) => {
  await ensureConversationAccess(conversationId, userId);

  const limit = ensureLimit(options.limit);
  const filters: Record<string, unknown>[] = [{ conversationId: toObjectId(conversationId) }];

  const searchRegex = buildTextSearchRegex(options.search);
  if (searchRegex) {
    filters.push({
      $or: [{ content: searchRegex }, { 'metadata.snapshot.name': searchRegex }, { 'metadata.address': searchRegex }]
    });
  }

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid cursor');
  }

  if (decodedCursor) {
    filters.push({
      $or: [
        { createdAt: { $lt: decodedCursor.createdAt } },
        { createdAt: decodedCursor.createdAt, _id: { $lt: decodedCursor.id } }
      ]
    });
  }

  const query: Record<string, unknown> = filters.length === 1 ? filters[0] : { $and: filters };

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
    createdAt: row.createdAt.toISOString()
  }));

  const nextRow = rows[limit];
  const nextCursor = hasMore ? encodeCursor(nextRow.createdAt, nextRow._id) : null;

  return { items, nextCursor, hasMore, limit };
};

export const sendConversationMessage = async (
  userId: string,
  conversationId: string,
  payload: {
    messageType: 'TEXT' | 'PRODUCT' | 'LOCATION';
    content?: string;
    metadata?: unknown;
  }
) => {
  await ensureConversationAccess(conversationId, userId);

  let metadata: MessageProductMetadata | MessageLocationMetadata | Record<string, unknown> | undefined;
  let content = payload.content?.trim() || undefined;

  if (payload.messageType === 'TEXT') {
    if (!content) {
      throw new AppError(400, 'VALIDATION_ERROR', 'TEXT message content is required');
    }
  }

  if (payload.messageType === 'PRODUCT') {
    const productId = (payload.metadata as { productId?: string } | undefined)?.productId;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'metadata.productId is required for PRODUCT');
    }

    const product = await ProductModel.findById(productId).select('name price image imageUrl category').lean();
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    metadata = {
      productId,
      snapshot: {
        name: product.name,
        pricePerDay: product.price,
        imageUrl: product.imageUrl ?? product.image,
        category: product.category
      }
    };
  }

  if (payload.messageType === 'LOCATION') {
    const location = payload.metadata as MessageLocationMetadata | undefined;
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'metadata.latitude and metadata.longitude are required for LOCATION');
    }

    metadata = {
      latitude,
      longitude,
      address: location?.address?.trim() || undefined
    };
  }

  const now = new Date();

  const message = await MessageModel.create({
    conversationId,
    senderId: userId,
    messageType: payload.messageType,
    content,
    metadata
  });

  await ConversationModel.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: buildConversationLastMessage(payload.messageType, content),
        lastMessageAt: now
      }
    }
  );

  await ConversationParticipantModel.updateMany(
    {
      conversationId,
      userId: { $ne: userId }
    },
    {
      $inc: { unreadCount: 1 },
      $set: { deletedAt: null }
    }
  );

  return {
    id: String(message._id),
    conversationId,
    senderId: userId,
    messageType: message.messageType,
    content: message.content ?? null,
    metadata: message.metadata ?? null,
    createdAt: message.createdAt.toISOString()
  };
};

export const markConversationAsRead = async (userId: string, conversationId: string) => {
  await ensureConversationAccess(conversationId, userId);

  const now = new Date();
  await ConversationParticipantModel.updateOne(
    {
      conversationId,
      userId
    },
    {
      $set: {
        unreadCount: 0,
        lastReadAt: now
      }
    }
  );

  return {
    conversationId,
    userId,
    lastReadAt: now.toISOString()
  };
};

export const deleteConversationForUser = async (
  userId: string,
  conversationId: string
) => {
  await ensureConversationAccess(conversationId, userId);

  const deletedAt = new Date();

  await ConversationParticipantModel.updateOne(
    {
      conversationId,
      userId
    },
    {
      $set: {
        deletedAt,
        unreadCount: 0,
        lastReadAt: deletedAt
      }
    }
  );

  return {
    conversationId,
    userId,
    deletedAt: deletedAt.toISOString()
  };
};

export const searchMessages = async (
  userId: string,
  options: { q: string; conversationId?: string; cursor?: string; limit?: number }
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
    const memberships = await ConversationParticipantModel.find({ userId, deletedAt: null })
      .select('conversationId')
      .lean();
    const candidateIds = memberships.map((membership) => membership.conversationId as mongoose.Types.ObjectId);
    const oneToOneConversationIdSet = await getOneToOneConversationIdSet(candidateIds);
    conversationIds = candidateIds
      .map((conversationId) => String(conversationId))
      .filter((conversationId) => oneToOneConversationIdSet.has(conversationId));
  }

  if (conversationIds.length === 0) {
    return { items: [], nextCursor: null, hasMore: false, limit };
  }

  const filters: Record<string, unknown>[] = [
    { conversationId: { $in: conversationIds.map((id) => toObjectId(id)) } },
    { $or: [{ content: searchRegex }, { 'metadata.snapshot.name': searchRegex }, { 'metadata.address': searchRegex }] }
  ];

  const decodedCursor = decodeCursor(options.cursor);
  if (options.cursor && !decodedCursor) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid cursor');
  }

  if (decodedCursor) {
    filters.push({
      $or: [
        { createdAt: { $lt: decodedCursor.createdAt } },
        { createdAt: decodedCursor.createdAt, _id: { $lt: decodedCursor.id } }
      ]
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
    createdAt: row.createdAt.toISOString()
  }));

  const nextRow = rows[limit];
  const nextCursor = hasMore ? encodeCursor(nextRow.createdAt, nextRow._id) : null;

  return { items, nextCursor, hasMore, limit };
};
