import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getStoredAuthToken } from "../../../lib/api/tokenStorage";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:5003";

function getSocketOrigin(baseUrl: string) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl;
  }
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) return;

    const socket = io(getSocketOrigin(BASE_URL), {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setSocket(socket);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  const joinConversation = useCallback(
    (conversationId: string, onError?: (code: string) => void) => {
      socket?.emit(
      "conversation.join",
      { conversationId },
      (ack: { success: boolean; error?: { code: string; message: string } }) => {
        if (!ack.success && onError) {
          onError(ack.error?.code ?? "UNKNOWN");
        }
      },
    );
    },
    [socket],
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      socket?.emit("conversation.leave", { conversationId });
    },
    [socket],
  );

  return { socket, socketRef, joinConversation, leaveConversation };
}
