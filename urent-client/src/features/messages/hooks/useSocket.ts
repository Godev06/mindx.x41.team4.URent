import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getStoredAuthToken } from "../../../lib/api/tokenStorage";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:5003";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) return;

    const socket = io(BASE_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinConversation = (
    conversationId: string,
    onError?: (code: string) => void,
  ) => {
    socketRef.current?.emit(
      "conversation.join",
      { conversationId },
      (ack: { success: boolean; error?: { code: string; message: string } }) => {
        if (!ack.success && onError) {
          onError(ack.error?.code ?? "UNKNOWN");
        }
      },
    );
  };

  const leaveConversation = (conversationId: string) => {
    socketRef.current?.emit("conversation.leave", { conversationId });
  };

  return { socketRef, joinConversation, leaveConversation };
}
