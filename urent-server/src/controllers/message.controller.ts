import { Request, Response } from "express";
import { ConversationModel } from "../models/conversation.model";
import { UserModel } from "../models/user.model";
import {
  deleteConversationParamsSchema,
  conversationPeerQuerySchema,
  createOneToOneConversationBodySchema,
  listConversationsQuerySchema,
  listMessagesParamsSchema,
  listMessagesQuerySchema,
  readConversationParamsSchema,
  searchMessagesQuerySchema,
  sendMessageBodySchema,
} from "../validators/message.validator";
import {
  deleteConversationForUser,
  getConversationPeerByEmail,
  getConversationPeerByPhone,
  getOrCreateOneToOneConversation,
  listConversationMessages,
  listConversations,
  markConversationAsRead,
  searchMessages,
  sendConversationMessage,
} from "../services/message.service";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import {
  emitConversationMessageCreated,
  emitConversationReadUpdated,
} from "../realtime/socket";
import { getSystemAdminId } from "../utils/admin";

const requireUserId = (req: Request) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return userId;
};

export const getConversations = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const query = listConversationsQuerySchema.parse(req.query);

  const result = await listConversations(userId, query);

  return sendSuccess(res, result.items, {
    limit: result.limit,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
};

export const postConversation = async (req: Request, res: Response) => {
  let userId = requireUserId(req);
  const body = createOneToOneConversationBodySchema.parse(req.body);


  const conversation = await getOrCreateOneToOneConversation(
    userId,
    body.peerUserId,
  );

  return sendSuccess(res, conversation, undefined, 201);
};

export const getConversationPeerQuery = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const query = conversationPeerQuerySchema.parse(req.query);

  const peer = query.email
    ? await getConversationPeerByEmail(userId, query.email)
    : await getConversationPeerByPhone(userId, query.phone!);

  return sendSuccess(res, peer);
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const params = listMessagesParamsSchema.parse(req.params);
  const query = listMessagesQuerySchema.parse(req.query);

  const result = await listConversationMessages(
    userId,
    params.conversationId,
    query,
  );

  return sendSuccess(res, result.items, {
    limit: result.limit,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
};

export const postConversationMessage = async (req: Request, res: Response) => {
  let userId = requireUserId(req);
  const params = listMessagesParamsSchema.parse(req.params);
  const body = sendMessageBodySchema.parse(req.body);


  try {
    const message = await sendConversationMessage(
      userId,
      params.conversationId,
      {
        messageType: body.messageType,
        content: body.content,
        metadata: body.metadata,
      },
    );

    let conversationType: string | undefined;
    try {
      const conversation = await ConversationModel.findById(params.conversationId).select("type").lean();
      conversationType = conversation?.type;
    } catch (err) {
      console.error("[postConversationMessage] Failed to fetch conversation type:", err);
    }

    emitConversationMessageCreated(params.conversationId, message, conversationType);

    return sendSuccess(res, message, undefined, 201);
  } catch (error) {
    console.error("[postConversationMessage] failed:", {
      conversationId: params.conversationId,
      userId,
      messageType: body.messageType,
      error: error instanceof Error ? (error.stack ?? error.message) : error,
    });
    throw error;
  }
};

export const postConversationRead = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const params = readConversationParamsSchema.parse(req.params);

  const readResult = await markConversationAsRead(
    userId,
    params.conversationId,
  );
  emitConversationReadUpdated(params.conversationId, {
    userId,
    lastReadAt: readResult.lastReadAt,
  });

  return sendSuccess(res, readResult);
};

export const deleteConversation = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const params = deleteConversationParamsSchema.parse(req.params);

  const result = await deleteConversationForUser(userId, params.conversationId);

  return sendSuccess(res, result);
};

export const getMessagesSearch = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const query = searchMessagesQuerySchema.parse(req.query);

  const result = await searchMessages(userId, query);

  return sendSuccess(res, result.items, {
    limit: result.limit,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
};
