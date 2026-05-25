import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/db-lazy";

import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middlewares/error.middleware";

import { authRouter } from "./routes/auth.route";
import { messageRouter } from "./routes/message.route";
import { adminChatRouter } from "./routes/admin-chat.route";
import { notificationRouter } from "./routes/notification.route";
import { orderRouter } from "./routes/order.route";
import { profileRouter } from "./routes/profile.route";
import { productRouter } from "./routes/product.route";
import { settingsRouter } from "./routes/settings.route";
import userRouter from "./routes/user.route";

export const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    next(new Error("Không thể kết nối đến cơ sở dữ liệu."));
  }
});

// Các route kiểm tra hệ thống ở tầng gốc
app.get("/health", (_req, res) => res.json({ ok: true, status: "healthy" }));

app.post("/debug-post", (req, res) => {
  res.json({ ok: true, bodyReceived: req.body });
});

// 1. Trả về thông báo chuẩn khi vào trang chủ API trống
app.get("/", (req, res) => {
  console.log(
    `\x1b[32m[WELCOME]\x1b[0m \x1b[36m${req.method}\x1b[0m ${req.originalUrl}`,
  );
  res.json({
    success: true,
    status: "running",
    message: "Chào mừng bạn đến với URent API Server!",
    documentation: "/api-docs",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Thêm bẫy cho cả trường hợp gọi /api hoặc /api/v1 trống
app.get(["/api", "/api/v1"], (req, res) => {
  res.json({
    success: true,
    status: "running",
    message:
      "URent API v1 đang hoạt động ổn định. Vui lòng sử dụng các endpoint cụ thể hoặc xem tài liệu.",
    documentation: "/api-docs",
  });
});

// Cấu hình Swagger UI Docs
const swaggerUiOptions = {
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
  ],
  customCss: ".swagger-ui .topbar { display: none }",
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions),
);
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

// Hệ thống các Routers chức năng
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1", productRouter);
app.use("/api/v1", messageRouter);
app.use("/api/v1", adminChatRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1", userRouter);

// 2. Middleware bẫy lỗi 404 Fallback cho tất cả các route không tồn tại công khai hơn
app.use((req, res, _next) => {
  console.log(
    `\x1b[33m[404]\x1b[0m \x1b[36m${req.method}\x1b[0m ${req.originalUrl}`,
  );
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên URent API Server.`,
      suggestion:
        "Vui lòng kiểm tra lại chính tả hoặc tham khảo tài liệu hướng dẫn tại /api-docs",
    },
    timestamp: new Date().toISOString(),
  });
});

app.use(errorMiddleware);
