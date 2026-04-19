import { Request, Response } from 'express';
import {
  deleteConversationParamsSchema,
  conversationPeerByEmailQuerySchema,
  createOneToOneConversationByEmailBodySchema,
  createOneToOneConversationBodySchema,
  listConversationsQuerySchema,
  listMessagesParamsSchema,
  listMessagesQuerySchema,
  readConversationParamsSchema,
  searchMessagesQuerySchema,
  sendMessageBodySchema
} from '../validators/message.validator';
import {
  deleteConversationForUser,
  getConversationPeerByEmail,
  getOrCreateOneToOneConversationByEmail,
  getOrCreateOneToOneConversation,
  listConversationMessages,
  listConversations,
  markConversationAsRead,
  searchMessages,
  sendConversationMessage
} from '../services/message.service';
import { AppError } from '../utils/app-error';
import { sendSuccess } from '../utils/api-response';
import { emitConversationMessageCreated, emitConversationReadUpdated } from '../realtime/socket';

const requireUserId = (req: Request) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
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
    hasMore: result.hasMore
  });
};

export const postOneToOneConversation = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const body = createOneToOneConversationBodySchema.parse(req.body);

  const conversation = await getOrCreateOneToOneConversation(userId, body.peerUserId);

  return sendSuccess(res, conversation, undefined, 201);
};

export const postOneToOneConversationByEmail = async (
  req: Request,
  res: Response
) => {
  const userId = requireUserId(req);
  const body = createOneToOneConversationByEmailBodySchema.parse(req.body);

  const conversation = await getOrCreateOneToOneConversationByEmail(
    userId,
    body.peerEmail
  );

  return sendSuccess(res, conversation, undefined, 201);
};

export const getConversationPeerByEmailQuery = async (
  req: Request,
  res: Response
) => {
  const userId = requireUserId(req);
  const query = conversationPeerByEmailQuerySchema.parse(req.query);

  const peer = await getConversationPeerByEmail(userId, query.email);

  return sendSuccess(res, peer);
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const params = listMessagesParamsSchema.parse(req.params);
  const query = listMessagesQuerySchema.parse(req.query);

  const result = await listConversationMessages(userId, params.conversationId, query);

  return sendSuccess(res, result.items, {
    limit: result.limit,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore
  });
};

export const postConversationMessage = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const params = listMessagesParamsSchema.parse(req.params);
  const body = sendMessageBodySchema.parse(req.body);

  const message = await sendConversationMessage(userId, params.conversationId, {
    messageType: body.messageType,
    content: body.content,
    metadata: body.metadata
  });

  emitConversationMessageCreated(params.conversationId, message);

  return sendSuccess(res, message, undefined, 201);
};

export const postConversationRead = async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const params = readConversationParamsSchema.parse(req.params);

  const readResult = await markConversationAsRead(userId, params.conversationId);
  emitConversationReadUpdated(params.conversationId, {
    userId,
    lastReadAt: readResult.lastReadAt
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
    hasMore: result.hasMore
  });
};
