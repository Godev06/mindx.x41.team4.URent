import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
  deleteConversation,
  getConversationPeerByEmailQuery,
  getConversationMessages,
  getConversations,
  getMessagesSearch,
  postOneToOneConversationByEmail,
  postOneToOneConversation,
  postConversationMessage,
  postConversationRead
} from '../controllers/message.controller';

export const messageRouter = Router();

messageRouter.get('/conversations', authGuard, getConversations);
messageRouter.get('/conversations/peer-by-email', authGuard, getConversationPeerByEmailQuery);
messageRouter.post('/conversations/one-to-one', authGuard, postOneToOneConversation);
messageRouter.post('/conversations/one-to-one/by-email', authGuard, postOneToOneConversationByEmail);
messageRouter.get('/conversations/:conversationId/messages', authGuard, getConversationMessages);
messageRouter.delete('/conversations/:conversationId', authGuard, deleteConversation);
messageRouter.post('/conversations/:conversationId/messages', authGuard, postConversationMessage);
messageRouter.post('/conversations/:conversationId/read', authGuard, postConversationRead);
messageRouter.get('/messages/search', authGuard, getMessagesSearch);
