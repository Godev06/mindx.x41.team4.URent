import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { getConversationAccessState } from "../services/message.service";
import { verifyAccessToken } from "../utils/auth-token";
import { resolveAppIdentity } from "../services/auth-identity.service";
import { connectDB } from "../config/db-lazy";

type RoomMap = Map<string, Set<WebSocket>>;
const rooms: RoomMap = new Map();

export const roomForConversation = (conversationId: string) =>
  `conversation:${conversationId}`;

const joinRoom = (ws: WebSocket, room: string) => {
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room)!.add(ws);
};

const leaveRoom = (ws: WebSocket, room: string) => {
  if (rooms.has(room)) {
    rooms.get(room)!.delete(ws);
    if (rooms.get(room)!.size === 0) {
      rooms.delete(room);
    }
  }
};

const handleWebSocketConnection = async (
  serverWs: WebSocket,
  token?: string,
) => {
  console.log("🔗 New WebSocket connection established");

  try {
    await connectDB();
  } catch (err) {
    console.error("❌ DB connection failed for WS:", err);
    try {
      serverWs.send(
        JSON.stringify({
          type: "error",
          code: "DB_UNAVAILABLE",
          message: "Database connection failed",
        }),
      );
    } catch {
      // ignore
    }
    serverWs.close(1011, "DB Unavailable");
    return;
  }

  if (!token) {
    console.error("❌ WebSocket auth failed: Missing token");
    serverWs.send(
      JSON.stringify({
        type: "error",
        code: "UNAUTHORIZED",
        message: "Missing token",
      }),
    );
    serverWs.close(1008, "Unauthorized");
    return;
  }

  let userId: string;
  try {
    const identity = await verifyAccessToken(token);
    const appIdentity = await resolveAppIdentity(identity);
    userId = appIdentity.sub;
  } catch (err) {
    console.error("❌ WebSocket auth failed: Invalid token", err);
    serverWs.send(
      JSON.stringify({
        type: "error",
        code: "UNAUTHORIZED",
        message: "Invalid token",
      }),
    );
    serverWs.close(1008, "Unauthorized");
    return;
  }

  serverWs.on("message", async (raw) => {
    // Ensure DB is connected for every WS message in case of reconnect / cold start.
    await connectDB();
    try {
      const data = JSON.parse(String(raw));

      if (data.type === "conversation.join") {
        const { conversationId } = data.payload || {};
        if (!conversationId) {
          serverWs.send(
            JSON.stringify({
              type: "ack",
              id: data.id,
              success: false,
              error: { code: "VALIDATION_ERROR" },
            }),
          );
          return;
        }

        const validId = /^[0-9a-fA-F]{24}$/.test(conversationId);
        if (!validId) {
          serverWs.send(
            JSON.stringify({
              type: "ack",
              id: data.id,
              success: false,
              error: { code: "VALIDATION_ERROR" },
            }),
          );
          return;
        }

        const state = await getConversationAccessState(conversationId, userId);
        if (!state.exists || !state.isMember) {
          serverWs.send(
            JSON.stringify({
              type: "ack",
              id: data.id,
              success: false,
              error: { code: "FORBIDDEN" },
            }),
          );
          return;
        }

        joinRoom(serverWs, roomForConversation(conversationId));
        serverWs.send(
          JSON.stringify({
            type: "ack",
            id: data.id,
            success: true,
            data: { conversationId },
          }),
        );
      }

      if (data.type === "conversation.leave") {
        const { conversationId } = data.payload || {};
        if (conversationId) {
          leaveRoom(serverWs, roomForConversation(conversationId));
          serverWs.send(
            JSON.stringify({ type: "ack", id: data.id, success: true }),
          );
        }
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  });

  serverWs.on("close", (code, reason) => {
    console.log(`🔌 WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    for (const [, clients] of rooms.entries()) {
      if (clients.has(serverWs)) {
        clients.delete(serverWs);
      }
    }
  });
};

export const attachWebSocketServer = (httpServer: HttpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  console.log("🔌 WebSocket server attached to HTTP server");

  httpServer.on("upgrade", (request: IncomingMessage, socket, head) => {
    try {
      const host = request.headers.host ?? "localhost";
      const url = new URL(request.url ?? "/", `http://${host}`);

      if (url.pathname !== "/ws") {
        socket.destroy();
        return;
      }

      const token = url.searchParams.get("token") ?? undefined;

      wss.handleUpgrade(request, socket, head, (ws) => {
        handleWebSocketConnection(ws, token).catch((err) => {
          console.error("❌ Uncaught WebSocket connection error:", err);
          ws.close(1011, "Internal Server Error");
        });
      });
    } catch (err) {
      console.error("❌ WebSocket upgrade error:", err);
      socket.destroy();
    }
  });
};

export const emitConversationMessageCreated = (
  conversationId: string,
  message: unknown,
) => {
  const room = roomForConversation(conversationId);
  if (!rooms.has(room)) return;

  const payload = JSON.stringify({
    type: "conversation.message.created",
    data: { conversationId, message },
  });

  for (const client of rooms.get(room)!) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    } catch {
      // Ignore broken pipe
    }
  }
};

export const emitConversationReadUpdated = (
  conversationId: string,
  payload: { userId: string; lastReadAt: string },
) => {
  const room = roomForConversation(conversationId);
  if (!rooms.has(room)) return;

  const msg = JSON.stringify({
    type: "conversation.read.updated",
    data: { conversationId, ...payload },
  });

  for (const client of rooms.get(room)!) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    } catch {
      // Ignore
    }
  }
};
