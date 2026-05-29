import { useCallback, useEffect, useState } from "react";
import { messageService } from "../services/messageService";
import { useAuth } from "../../auth/hooks/useAuth";

export function useUnreadMessagesCount() {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await messageService.getConversations({ limit: 50 });
      const total = res.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (err) {
      console.error("[useUnreadMessagesCount] Failed to fetch conversations:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMessageCreated = (event: Event) => {
      const { message } = (event as CustomEvent).detail;
      if (message.senderId !== user?.id) {
        fetchUnreadCount();
      }
    };

    const handleReadUpdated = (event: Event) => {
      const { userId } = (event as CustomEvent).detail;
      if (userId === user?.id) {
        fetchUnreadCount();
      }
    };

    window.addEventListener("conversation.message.created", handleMessageCreated);
    window.addEventListener("conversation.read.updated", handleReadUpdated);

    return () => {
      window.removeEventListener("conversation.message.created", handleMessageCreated);
      window.removeEventListener("conversation.read.updated", handleReadUpdated);
    };
  }, [isAuthenticated, user?.id, fetchUnreadCount]);

  return unreadCount;
}
