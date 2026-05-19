import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredAuthToken } from "../../../../lib/api/tokenStorage";

const BASE_URL =
  ((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) as string | undefined)?.trim() ||
  "http://localhost:5003";

function getWebSocketUrl(baseUrl: string, token: string) {
  try {
    const url = new URL(baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return baseUrl.replace(/^http/, "ws") + `/ws?token=${token}`;
  }
}

export function useSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // We maintain a map of pending acknowledgments to mimic socket.io's callbacks
  const ackMap = useRef<Map<string, (data: any) => void>>(new Map());

  const connect = useCallback(() => {
    const token = getStoredAuthToken();
    if (!token) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl(BASE_URL, token);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle acknowledgments for our custom events
        if (data.type === "ack" && data.id) {
          const cb = ackMap.current.get(data.id);
          if (cb) {
            cb(data);
            ackMap.current.delete(data.id);
          }
        } else if (data.type) {
          // Dispatch native events for message components to listen to
          const customEvent = new CustomEvent(data.type, { detail: data.data });
          window.dispatchEvent(customEvent);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      // Auto reconnect
      setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        // Prevent auto-reconnect on unmount by clearing onclose
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [connect]);

  const joinConversation = useCallback(
    (conversationId: string, onError?: (code: string) => void) => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        if (onError) onError("NOT_CONNECTED");
        return;
      }

      const id = Math.random().toString(36).substring(7);
      
      ackMap.current.set(id, (ack: { success: boolean; error?: { code: string; message: string } }) => {
        if (!ack.success && onError) {
          onError(ack.error?.code ?? "UNKNOWN");
        }
      });

      socketRef.current.send(
        JSON.stringify({
          type: "conversation.join",
          id,
          payload: { conversationId },
        })
      );
    },
    []
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "conversation.leave",
            id: Math.random().toString(36).substring(7),
            payload: { conversationId },
          })
        );
      }
    },
    []
  );

  return { socket: socketRef.current, isConnected, joinConversation, leaveConversation };
}
