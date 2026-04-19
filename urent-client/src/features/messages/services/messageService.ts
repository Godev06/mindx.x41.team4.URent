import { apiClient } from "../../../lib/api/apiClient";
import type {
  ApiConversation,
  ApiConversationParticipant,
  ApiMessage,
  ApiOneToOneConversation,
  ApiProduct,
  ApiResponse,
  ApiSearchMessage,
} from "../types";

export const messageService = {
  async getProducts(params?: { limit?: number; q?: string }) {
    const res = await apiClient.get<ApiResponse<ApiProduct[]>>(
      "/api/v1/products",
      { params },
    );
    return res.data;
  },

  async getConversations(params?: {
    cursor?: string;
    limit?: number;
    q?: string;
  }) {
    const res = await apiClient.get<ApiResponse<ApiConversation[]>>(
      "/api/v1/conversations",
      { params },
    );
    return res.data;
  },

  async createOneToOneConversationByEmail(peerEmail: string) {
    const res = await apiClient.post<ApiResponse<ApiOneToOneConversation>>(
      "/api/v1/conversations/one-to-one/by-email",
      { peerEmail },
    );

    return res.data.data;
  },

  async getConversationPeerByEmail(email: string) {
    const res = await apiClient.get<ApiResponse<ApiConversationParticipant>>(
      "/api/v1/conversations/peer-by-email",
      { params: { email } },
    );

    return res.data.data;
  },

  async getMessages(
    conversationId: string,
    params?: { cursor?: string; limit?: number; search?: string },
  ) {
    const res = await apiClient.get<ApiResponse<ApiMessage[]>>(
      `/api/v1/conversations/${conversationId}/messages`,
      { params },
    );
    return res.data;
  },

  async deleteConversation(conversationId: string) {
    const res = await apiClient.delete<
      ApiResponse<{
        conversationId: string;
        userId: string;
        deletedAt: string;
      }>
    >(`/api/v1/conversations/${conversationId}`);

    return res.data.data;
  },

  async sendMessage(
    conversationId: string,
    body: {
      messageType: "TEXT" | "PRODUCT" | "LOCATION";
      content?: string;
      metadata?: unknown;
    },
  ) {
    const res = await apiClient.post<ApiResponse<ApiMessage>>(
      `/api/v1/conversations/${conversationId}/messages`,
      body,
    );
    return res.data.data;
  },

  async markAsRead(conversationId: string) {
    const res = await apiClient.post<
      ApiResponse<{
        conversationId: string;
        userId: string;
        lastReadAt: string;
      }>
    >(`/api/v1/conversations/${conversationId}/read`);
    return res.data.data;
  },

  async searchMessages(params: {
    q: string;
    conversationId?: string;
    cursor?: string;
    limit?: number;
  }) {
    const res = await apiClient.get<ApiResponse<ApiSearchMessage[]>>(
      "/api/v1/messages/search",
      { params },
    );

    return {
      ...res.data,
      data: res.data.data.map((message) => ({
        id: message.messageId,
        conversationId: message.conversationId,
        senderId: message.senderId,
        messageType: message.messageType,
        content: message.content,
        metadata: message.metadata,
        createdAt: message.createdAt,
      })),
    };
  },
};
