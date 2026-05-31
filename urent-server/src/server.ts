import http from "node:http";
import "dotenv/config";
import dns from "node:dns";
import { app } from "./app";
import { connectDB } from "./config/db-lazy";

import { initializeFirebase } from "./config/firebase";
import { attachWebSocketServer } from "./realtime/socket";
import { NotificationModel } from "./models/notification.model";

dns.setDefaultResultOrder("ipv4first");
initializeFirebase();

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);

// Initialize Socket Server
attachWebSocketServer(httpServer);

// Start HTTP Server
httpServer.listen(PORT, () => {
  console.log(
    `\x1b[32m➜\x1b[0m \x1b[1mAPI Listening:\x1b[0m http://localhost:${PORT}/`,
  );
});

// Connect Database
connectDB()
  .then(async () => {
    console.log("✅ DB connected");

    try {
      const deleteResult = await NotificationModel.deleteMany({
        $or: [
          { title: /chào mừng|khuyến mãi|mazda/i },
          { description: /urent/i },
        ],
      });

      if (deleteResult.deletedCount > 0) {
        console.log(
          `🧹 Cleaned up ${deleteResult.deletedCount} mock notifications.`,
        );
      }
    } catch (e) {
      console.warn(
        "⚠️ Failed to clean up mock notifications on startup:",
        e,
      );
    }
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });

export default app;