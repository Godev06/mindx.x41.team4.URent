import http from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { getConversationAccessState } from '../services/message.service';
import { verifyToken } from '../utils/jwt';

let io: Server | null = null;

const roomForConversation = (conversationId: string) => `conversation:${conversationId}`;

export const initRealtime = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: env.clientOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const rawAuth = socket.handshake.auth as { token?: string };
    const authHeader = socket.handshake.headers.authorization;
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    const token = rawAuth?.token ?? bearerToken;

    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('conversation.join', async (payload: { conversationId?: string }, ack?: (data: unknown) => void) => {
      const conversationId = payload?.conversationId;
      const userId = socket.data.userId as string | undefined;

      if (!conversationId || !userId) {
        ack?.({ success: false, error: { code: 'VALIDATION_ERROR', message: 'conversationId is required' } });
        return;
      }

      const validId = /^[0-9a-fA-F]{24}$/.test(conversationId);
      if (!validId) {
        ack?.({ success: false, error: { code: 'VALIDATION_ERROR', message: 'conversationId is invalid' } });
        return;
      }

      const state = await getConversationAccessState(conversationId, userId);

      if (!state.exists) {
        ack?.({
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found'
          }
        });
        return;
      }

      if (!state.isMember) {
        ack?.({
          success: false,
          error: {
            code: 'FORBIDDEN_CONVERSATION_ACCESS',
            message: 'You are not a member of this conversation'
          }
        });
        return;
      }

      if (state.participantCount !== 2) {
        ack?.({
          success: false,
          error: {
            code: 'CONVERSATION_NOT_1V1',
            message: 'Chi ho tro tin nhan cho hoi thoai 1v1'
          }
        });
        return;
      }

      socket.join(roomForConversation(conversationId));
      ack?.({ success: true, data: { conversationId } });
    });

    socket.on('conversation.leave', (payload: { conversationId?: string }, ack?: (data: unknown) => void) => {
      const conversationId = payload?.conversationId;

      if (!conversationId) {
        ack?.({ success: false, error: { code: 'VALIDATION_ERROR', message: 'conversationId is required' } });
        return;
      }

      socket.leave(roomForConversation(conversationId));
      ack?.({ success: true, data: { conversationId } });
    });
  });

  return io;
};

export const emitConversationMessageCreated = (conversationId: string, message: unknown) => {
  io?.to(roomForConversation(conversationId)).emit('conversation.message.created', {
    conversationId,
    message
  });
};

export const emitConversationReadUpdated = (conversationId: string, payload: { userId: string; lastReadAt: string }) => {
  io?.to(roomForConversation(conversationId)).emit('conversation.read.updated', {
    conversationId,
    ...payload
  });
};
