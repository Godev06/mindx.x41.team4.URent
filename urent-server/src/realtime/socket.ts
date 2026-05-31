import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

import { connectDB } from "../config/db-lazy";
import { ConversationModel } from "../models/conversation.model";
import { ConversationParticipantModel } from "../models/conversation-participant.model";
import { UserModel } from "../models/user.model";

import { getConversationAccessState } from "../services/message.service";
import { resolveAppIdentity } from "../services/auth-identity.service";

import { verifyAccessToken } from "../utils/auth-token";

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
  const clients = rooms.get(room);

  if (!clients) return;

  clients.delete(ws);

  if (clients.size === 0) {
    rooms.delete(room);
  }
};

const cleanupSocket = (ws: WebSocket) => {
  for (const [room, clients] of rooms.entries()) {
    if (clients.has(ws)) {
      clients.delete(ws);

      if (clients.size === 0) {
        rooms.delete(room);
      }
    }
  }
};

const broadcastToRoom = (room: string, payload: string) => {
  const clients = rooms.get(room);

  if (!clients) return;

  for (const client of clients) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      } else {
        clients.delete(client);
      }
    } catch {
      clients.delete(client);
    }
  }

  if (clients.size === 0) {
    rooms.delete(room);
  }
};

const handleWebSocketConnection = async (
  ws: WebSocket,
  token?: string,
) => {
  console.log("🔗 New WebSocket connection");

  try {
    await connectDB();
  } catch (error) {
    console.error("❌ DB connection failed:", error);

    try {
      ws.send(
        JSON.stringify({
          type: "error",
          code: "DB_UNAVAILABLE",
          message: "Database connection failed",
        }),
      );
    } catch {
      //
    }

    ws.close(1011, "DB unavailable");
    return;
  }

  if (!token) {
    ws.send(
      JSON.stringify({
        type: "error",
        code: "UNAUTHORIZED",
        message: "Missing token",
      }),
    );

    ws.close(1008, "Unauthorized");
    return;
  }

  let userId: string;
  let userRole = "user";

  try {
    const identity = await verifyAccessToken(token);
    const appIdentity = await resolveAppIdentity(identity);

    userId = appIdentity.sub;
  } catch (error) {
    console.error("❌ Invalid token:", error);

    ws.send(
      JSON.stringify({
        type: "error",
        code: "UNAUTHORIZED",
        message: "Invalid token",
      }),
    );

    ws.close(1008, "Unauthorized");
    return;
  }

  try {
    joinRoom(ws, `user:${userId}`);

    console.log(
      `[WS] Joined personal room user:${userId}`,
    );

    const dbUser = await UserModel.findById(userId)
      .select("role")
      .lean();

    userRole = dbUser?.role ?? "user";

    if (userRole === "admin") {
      joinRoom(ws, "room:admin_pool");

      console.log(
        `[WS] Admin ${userId} joined room:admin_pool`,
      );
    }

    const participants =
      await ConversationParticipantModel.find({
        userId,
        deletedAt: null,
      })
        .select("conversationId")
        .lean();

    for (const participant of participants) {
      const room = roomForConversation(
        String(participant.conversationId),
      );

      joinRoom(ws, room);

      console.log(`[WS] Auto joined ${room}`);
    }
  } catch (error) {
    console.error(
      `[WS] Failed auto joining rooms for ${userId}`,
      error,
    );
  }

  ws.on("message", async (raw) => {
    try {
      await connectDB();

      const data = JSON.parse(raw.toString());

      switch (data.type) {
        case "conversation.join": {
          const conversationId =
            data.payload?.conversationId;

          if (
            !conversationId ||
            !/^[0-9a-fA-F]{24}$/.test(conversationId)
          ) {
            ws.send(
              JSON.stringify({
                type: "ack",
                id: data.id,
                success: false,
                error: {
                  code: "VALIDATION_ERROR",
                },
              }),
            );

            return;
          }

          const state =
            await getConversationAccessState(
              conversationId,
              userId,
            );

          let allowed = state.isMember;

          if (!allowed && userRole === "admin") {
            const conversation =
              await ConversationModel.findById(
                conversationId,
              )
                .select("type")
                .lean();

            if (conversation?.type === "support") {
              allowed = true;
            }
          }

          if (!state.exists || !allowed) {
            ws.send(
              JSON.stringify({
                type: "ack",
                id: data.id,
                success: false,
                error: {
                  code: "FORBIDDEN",
                },
              }),
            );

            return;
          }

          joinRoom(
            ws,
            roomForConversation(conversationId),
          );

          ws.send(
            JSON.stringify({
              type: "ack",
              id: data.id,
              success: true,
              data: {
                conversationId,
              },
            }),
          );

          break;
        }

        case "conversation.leave": {
          const conversationId =
            data.payload?.conversationId;

          if (!conversationId) return;

          leaveRoom(
            ws,
            roomForConversation(conversationId),
          );

          ws.send(
            JSON.stringify({
              type: "ack",
              id: data.id,
              success: true,
            }),
          );

          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.error(
        "❌ WebSocket message error:",
        error,
      );
    }
  });

  ws.on("close", (code, reason) => {
    console.log(
      `🔌 Closed (${code}) ${reason?.toString() || ""}`,
    );

    cleanupSocket(ws);
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);

    cleanupSocket(ws);
  });
};

export const attachWebSocketServer = (
  httpServer: HttpServer,
) => {
  const wss = new WebSocketServer({
    noServer: true,
  });

  console.log("🔌 WebSocket server attached");

  httpServer.on(
    "upgrade",
    (request: IncomingMessage, socket, head) => {
      try {
        const host =
          request.headers["x-forwarded-host"] ||
          request.headers.host ||
          "localhost";

        const protocol =
          request.headers["x-forwarded-proto"] ||
          "http";

        const url = new URL(
          request.url ?? "/",
          `${protocol}://${host}`,
        );

        console.log("[WS UPGRADE]", {
          pathname: url.pathname,
          host,
          protocol,
        });

        if (url.pathname !== "/ws") {
          socket.write(
            "HTTP/1.1 404 Not Found\r\n\r\n",
          );

          socket.destroy();

          return;
        }

        const token =
          url.searchParams.get("token") ??
          undefined;

        wss.handleUpgrade(
          request,
          socket,
          head,
          (ws) => {
            handleWebSocketConnection(
              ws,
              token,
            ).catch((error) => {
              console.error(
                "❌ Unhandled WS error:",
                error,
              );

              ws.close(
                1011,
                "Internal Server Error",
              );
            });
          },
        );
      } catch (error) {
        console.error(
          "❌ WebSocket upgrade error:",
          error,
        );

        socket.destroy();
      }
    },
  );

  return wss;
};

export const emitConversationMessageCreated = (
  conversationId: string,
  message: unknown,
  conversationType?: string,
) => {
  try {
    const payload = JSON.stringify({
      type: "conversation.message.created",
      data: {
        conversationId,
        message,
      },
    });

    broadcastToRoom(
      roomForConversation(conversationId),
      payload,
    );

    if (conversationType === "support") {
      broadcastToRoom(
        "room:admin_pool",
        payload,
      );
    }
  } catch (error) {
    console.error(
      "[WS emitConversationMessageCreated]",
      error,
    );
  }
};

export const emitConversationReadUpdated = (
  conversationId: string,
  payload: {
    userId: string;
    lastReadAt: string;
  },
) => {
  const msg = JSON.stringify({
    type: "conversation.read.updated",
    data: {
      conversationId,
      ...payload,
    },
  });

  broadcastToRoom(
    roomForConversation(conversationId),
    msg,
  );
};

export const emitNotificationToUser = (
  userId: string,
  notification: unknown,
) => {
  try {
    const payload = JSON.stringify({
      type: "notification.created",
      data: notification,
    });

    broadcastToRoom(
      `user:${userId}`,
      payload,
    );
  } catch (error) {
    console.error(
      "[WS emitNotificationToUser]",
      error,
    );
  }
};