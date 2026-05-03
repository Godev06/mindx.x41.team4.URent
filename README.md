# URent — Nền tảng Cho thuê Đồ dùng

URent là ứng dụng web hỗ trợ người dùng đăng ký cho thuê và thuê đồ dùng, thiết bị giữa các cá nhân (peer-to-peer rental).

---

## Cấu trúc Monorepo

```
mindx.x41.team4.URent/
├── urent-client/       # React + Vite frontend (TypeScript)
├── urent-server/       # Express 5 backend (TypeScript)
└── package.json        # Workspace scripts (concurrently)
```

---

## Yêu cầu Hệ thống

- **Node.js** >= 20
- **MongoDB** Atlas (hoặc local)
- **Firebase** authentication (google, phone)
- **Cloudinary** account (upload avatar)
- **SMTP** server (gửi email OTP)

---

## Cài đặt & Chạy

### 1. Cài dependencies

```bash
npm install              # cài devDeps workspace (concurrently)
cd urent-client && npm install
cd ../urent-server && npm install
```

### 2. Cấu hình biến môi trường

**Client** — tạo `urent-client/.env` (xem `urent-client/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:5003
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

**Server** — tạo `urent-server/.env` (xem `urent-server/docs/ARCHITECTURE.md` mục 8):

```env
PORT=5003
MONGO_URI=...
JWT_SECRET=...
# ... (xem docs đầy đủ)
```

### 3. Chạy development

```bash
# Chạy cả client + server cùng lúc (từ root):
npm run dev

# Hoặc chạy riêng:
npm run dev:client
npm run dev:server
```

Client chạy tại `http://localhost:5173`, Server tại `http://localhost:5003`.

---

## Tài liệu

| Tài liệu                                                                                                     | Mô tả                                       |
| :----------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| [urent-client/docs/ARCHITECTURE.md](urent-client/docs/ARCHITECTURE.md)                                       | Kiến trúc frontend, auth flow, data flow    |
| [urent-client/docs/FRONTEND_DOCUMENTATION.md](urent-client/docs/FRONTEND_DOCUMENTATION.md)                   | Hướng dẫn phát triển frontend               |
| [urent-client/docs/DEVELOPMENT_GUIDELINE.md](urent-client/docs/DEVELOPMENT_GUIDELINE.md)                     | Quy ước code, branching, commit             |
| [urent-client/docs/FIREBASE_AUTH_WITH_NODE_BACKEND.md](urent-client/docs/FIREBASE_AUTH_WITH_NODE_BACKEND.md) | Tích hợp Firebase Auth với Node backend     |
| [urent-client/docs/message-api-integration.md](urent-client/docs/message-api-integration.md)                 | Tích hợp Messages API                       |
| [urent-server/docs/ARCHITECTURE.md](urent-server/docs/ARCHITECTURE.md)                                       | Kiến trúc backend, API endpoints, Socket.io |

---

## Tính năng Chính

- Đăng ký / Đăng nhập (Email+OTP, Google OAuth)
- Xác minh số điện thoại (Firebase Phone OTP)
- Đăng sản phẩm cho thuê, quản lý kho hàng
- Nhắn tin realtime giữa người dùng (Socket.io)
- Thông báo hệ thống
- Quản lý đơn thuê
- Cài đặt tài khoản (theme, ngôn ngữ, 2FA)
- Upload avatar (Cloudinary)
