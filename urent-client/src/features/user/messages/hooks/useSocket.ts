import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getStoredAuthToken } from "../../../../lib/api/tokenStorage";

const ENV_BASE_URL = (
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) as
    | string
    | undefined
)?.trim();

const INITIAL_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 15000;
const ACK_TIMEOUT = 10000;

function getBaseUrlForWebSocket() {
  return (
    ENV_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

function getWebSocketUrl(baseUrl: string, token: string) {
  const url = new URL(baseUrl, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const pathname = url.pathname.replace(/\/$/, "");
  url.pathname = `${pathname}/ws`;
  url.searchParams.set("token", token);
  return url.toString();
}

type AckCallback = (data: any) => void;

interface SocketContextType {
  isConnected: boolean;
  joinConversation: (
    conversationId: string,
    onError?: (code: string) => void,
  ) => void;
  leaveConversation: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// Dùng React.createElement thay vì cú pháp <SocketProvider> để chạy được trong file .ts
export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const mountedRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const ackMap = useRef<Map<string, AckCallback>>(new Map());

  const [isConnected, setIsConnected] = useState(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const cleanupAck = (id: string) => {
    ackMap.current.delete(id);
  };

  const triggerReconnect = useCallback(() => {
    if (!mountedRef.current || !shouldReconnectRef.current) return;

    const token = getStoredAuthToken();
    if (!token) {
      console.warn("[WS] Reconnect skipped: no auth token");
      return;
    }

    if (reconnectTimeoutRef.current !== null) return;

    const delay = reconnectDelayRef.current;
    console.warn(`[WS] Reconnecting in ${delay}ms`);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_DELAY,
      );
      connect();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = getStoredAuthToken();
    if (!token) {
      console.warn("[WS] Connection skipped: no token");
      return;
    }

    const currentSocket = socketRef.current;
    if (
      currentSocket &&
      (currentSocket.readyState === WebSocket.OPEN ||
        currentSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const wsUrl = getWebSocketUrl(getBaseUrlForWebSocket(), token);
      console.log("[WS] Connecting:", wsUrl);

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (!parsed || typeof parsed !== "object") return;

          if (parsed.type === "ack" && parsed.id) {
            const callback = ackMap.current.get(parsed.id);
            if (callback) {
              callback(parsed);
              cleanupAck(parsed.id);
            }
            return;
          }

          if (typeof parsed.type === "string") {
            const customEvent = new CustomEvent(parsed.type, {
              detail: parsed.data,
            });
            window.dispatchEvent(customEvent);
          }
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WS] Socket error:", error);
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
        }
      };

      ws.onclose = () => {
        console.warn("[WS] Disconnected");
        setIsConnected(false);

        if (socketRef.current === ws) {
          socketRef.current = null;
        }

        triggerReconnect();
      };
    } catch (error) {
      console.error("[WS] Connection failed:", error);
      triggerReconnect();
    }
  }, [triggerReconnect]);

  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;

    connect();

    return () => {
      mountedRef.current = false;
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      ackMap.current.clear();

      const socket = socketRef.current;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }
      socketRef.current = null;
      setIsConnected(false);
      console.log("[WS] Cleaned up global context");
    };
  }, [connect, clearReconnectTimeout]);

  const joinConversation = useCallback(
    (conversationId: string, onError?: (code: string) => void) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        onError?.("NOT_CONNECTED");
        return;
      }

      const id = crypto.randomUUID();
      const timeout = window.setTimeout(() => {
        console.warn(`[WS] Ack timeout: ${id}`);
        cleanupAck(id);
        onError?.("ACK_TIMEOUT");
      }, ACK_TIMEOUT);

      ackMap.current.set(id, (ack) => {
        clearTimeout(timeout);
        if (!ack.success) {
          onError?.(ack.error?.code ?? "UNKNOWN");
        }
      });

      socket.send(
        JSON.stringify({
          type: "conversation.join",
          id,
          payload: { conversationId },
        }),
      );
    },
    [],
  );

  const leaveConversation = useCallback((conversationId: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "conversation.leave",
        id: crypto.randomUUID(),
        payload: { conversationId },
      }),
    );
  }, []);

  // Thay thế cho đoạn gạch đỏ <SocketContext.Provider value={{...}}> {children} </SocketContext.Provider>
  return React.createElement(
    SocketContext.Provider,
    { value: { isConnected, joinConversation, leaveConversation } },
    children,
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
