import { useCallback, useEffect, useState } from "react";
import { normalizeApiError } from "../../../lib/api/apiError";
import { messageService } from "../services/messageService";
import type { ApiMessage } from "../types";

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markConversationAsRead = useCallback(async () => {
    if (!conversationId) return;
    await messageService.markAsRead(conversationId);
  }, [conversationId]);

  const refresh = useCallback(() => {
    if (!conversationId) {
      setMessages([]);
      setError(null);
      return () => {};
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMessages([]);

    messageService
      .getMessages(conversationId, { limit: 50 })
      .then(async (res) => {
        if (!cancelled) {
          setMessages(res.data);
        }

        await messageService.markAsRead(conversationId);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(normalizeApiError(error).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  /** Prepend a message — deduplicates by id (handles socket + REST race). */
  const prependMessage = useCallback((message: ApiMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [message, ...prev];
    });
  }, []);

  const sendText = useCallback(
    async (content: string) => {
      if (!conversationId) return null;
      return messageService.sendMessage(conversationId, {
        messageType: "TEXT",
        content,
      });
    },
    [conversationId],
  );

  const sendProduct = useCallback(
    async (productId: string, content?: string) => {
      if (!conversationId) return null;
      return messageService.sendMessage(conversationId, {
        messageType: "PRODUCT",
        content,
        metadata: { productId },
      });
    },
    [conversationId],
  );

  const sendLocation = useCallback(
    async (latitude: number, longitude: number, address?: string) => {
      if (!conversationId) return null;
      return messageService.sendMessage(conversationId, {
        messageType: "LOCATION",
        metadata: { latitude, longitude, address },
      });
    },
    [conversationId],
  );

  return {
    messages,
    isLoading,
    error,
    refresh,
    markConversationAsRead,
    prependMessage,
    sendText,
    sendProduct,
    sendLocation,
  };
}
