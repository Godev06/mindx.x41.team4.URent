import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
  deleteConversation,
  getConversationPeerQuery,
  getConversationMessages,
  getConversations,
  getMessagesSearch,
  postConversation,
  postConversationMessage,
  postConversationRead
} from '../controllers/message.controller';

export const messageRouter = Router();

/**
 * @openapi
 * /api/v1/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: Lấy danh sách cuộc trò chuyện của user hiện tại
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Con trỏ phân trang cursor-based
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string, maxLength: 200 }
 *         description: Tìm kiếm theo nội dung cuộc trò chuyện
 *     responses:
 *       200:
 *         description: Danh sách conversations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationListResponse'
 */
messageRouter.get('/conversations', authGuard, getConversations);

/**
 * @openapi
 * /api/v1/conversations/peer:
 *   get:
 *     tags: [Messages]
 *     summary: Tìm thông tin user đối phương theo email hoặc số điện thoại
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema: { type: string, format: email }
 *         description: Tìm theo email (email hoặc phone bắt buộc có 1)
 *       - in: query
 *         name: phone
 *         schema: { type: string, minLength: 7, maxLength: 20 }
 *         description: Tìm theo số điện thoại
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *                 meta: { nullable: true, example: null }
 */
messageRouter.get('/conversations/peer', authGuard, getConversationPeerQuery);

/**
 * @openapi
 * /api/v1/conversations:
 *   post:
 *     tags: [Messages]
 *     summary: Tạo hoặc lấy cuộc trò chuyện với một user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversationBody'
 *     responses:
 *       201:
 *         description: Conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationResponse'
 */
messageRouter.post('/conversations', authGuard, postConversation);

/**
 * @openapi
 * /api/v1/conversations/{conversationId}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Lấy tin nhắn trong một cuộc trò chuyện (cursor-based)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 200 }
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageListResponse'
 */
messageRouter.get('/conversations/:conversationId/messages', authGuard, getConversationMessages);

/**
 * @openapi
 * /api/v1/conversations/{conversationId}:
 *   delete:
 *     tags: [Messages]
 *     summary: Xoá cuộc trò chuyện (soft delete phía user hiện tại)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã xoá
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *                 meta: { nullable: true, example: null }
 */
messageRouter.delete('/conversations/:conversationId', authGuard, deleteConversation);

/**
 * @openapi
 * /api/v1/conversations/{conversationId}/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Gửi tin nhắn mới (TEXT / PRODUCT / LOCATION)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageBody'
 *     responses:
 *       201:
 *         description: Tin nhắn đã gửi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageItemResponse'
 */
messageRouter.post('/conversations/:conversationId/messages', authGuard, postConversationMessage);

/**
 * @openapi
 * /api/v1/conversations/{conversationId}/read:
 *   post:
 *     tags: [Messages]
 *     summary: Đánh dấu đã đọc tất cả tin nhắn trong conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Đã đánh dấu đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastReadAt: { type: string, format: date-time }
 *                 meta: { nullable: true, example: null }
 */
messageRouter.post('/conversations/:conversationId/read', authGuard, postConversationRead);

/**
 * @openapi
 * /api/v1/messages/search:
 *   get:
 *     tags: [Messages]
 *     summary: Tìm kiếm tin nhắn toàn cục hoặc trong một conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 1, maxLength: 200 }
 *         description: Từ khoá tìm kiếm
 *       - in: query
 *         name: conversationId
 *         schema: { type: string }
 *         description: Giới hạn tìm trong conversation cụ thể
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageListResponse'
 */
messageRouter.get('/messages/search', authGuard, getMessagesSearch);

