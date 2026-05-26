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

// Initialize Socket Server (attaches 'upgrade' listener immediately)
attachWebSocketServer(httpServer);

// Ensure shared lazy Mongo connection is ready
connectDB()
  .then(async () => {
    console.log("✅ DB connected");
    try {
      const deleteResult = await NotificationModel.deleteMany({
        $or: [
          { _id: { $in: ["notif_1", "notif_2", "notif_3"] } },
          { title: /chào mừng|khuyến mãi|mazda/i },
          { description: /urent/i }
        ]
      });
      if (deleteResult.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deleteResult.deletedCount} mock notifications from backend database.`);
      }
    } catch (e) {
      console.warn("⚠️ Failed to clean up mock notifications on startup:", e);
    }
  })
  .catch((err) => {
    console.error("❌ DB connection failed.", err);
  });

if (process.env.NODE_ENV !== "production") {
  httpServer.listen(PORT, () => {
    console.log(
      `  \x1b[32m➜\x1b[0m  \x1b[1m\x1b[37mAPI Local:\x1b[0m   \x1b[36mhttp://localhost:${PORT}/\x1b[0m`,
    );
  });
}

export default app;
