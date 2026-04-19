import { useCallback, useEffect, useState } from "react";
import { normalizeApiError } from "../../../lib/api/apiError";
import { messageService } from "../services/messageService";
import type { ApiConversation } from "../types";

export function useConversations() {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortConversations = useCallback((items: ApiConversation[]) => {
    return [...items].sort((left, right) => {
      const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      const rightTime = right.lastMessageAt
        ? new Date(right.lastMessageAt).getTime()
        : 0;

      return rightTime - leftTime;
    });
  }, []);

  const refresh = useCallback(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    messageService
      .getConversations({ limit: 50 })
      .then((res) => {
        if (!cancelled) {
          setConversations(sortConversations(res.data));
        }
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
  }, [sortConversations]);

  useEffect(() => {
    return refresh();
  }, [refresh]);

  const updateLastMessage = useCallback(
    (conversationId: string, lastMessage: string, lastMessageAt: string) => {
      setConversations((prev) => {
        const next = prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, lastMessage, lastMessageAt }
            : conversation,
        );

        return sortConversations(next);
      });
    },
    [sortConversations],
  );

  const incrementUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, unreadCount: c.unreadCount + 1 }
          : c,
      ),
    );
  }, []);

  const resetUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refresh,
    updateLastMessage,
    incrementUnread,
    resetUnread,
    deleteConversation,
  };
}
