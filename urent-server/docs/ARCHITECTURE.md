# Tài liệu Backend URent

Tài liệu tổng hợp kiến trúc kỹ thuật, API endpoints, luồng xác thực, realtime và hướng dẫn vận hành hệ thống backend URent.

---

## 1. Tổng quan kiến trúc

Hệ thống backend URent được xây dựng theo kiến trúc modular, hướng microservices nhẹ, phục vụ nền tảng cho thuê đồ trực tuyến.

**Thành phần chính:**

- **API Gateway & REST API** – xử lý request từ client (web/app)
- **Realtime service** – Socket.IO cho nhắn tin và thông báo
- **Authentication service** – JWT kết hợp Firebase Auth (dual-auth)
- **Background workers** – gửi email OTP, xử lý ảnh

**Luồng cơ bản:**

```
Client → CDN/Vercel (FE) → Backend (Node.js/Express)
                                ↓
                           MongoDB (Mongoose)
                                ↓
                        Cloudinary (media storage)
```

---

## 2. Stack Công nghệ

| Thành phần    | Công nghệ                                 |
| :------------ | :---------------------------------------- |
| Runtime       | Node.js 20+                               |
| Framework     | Express 5 (TypeScript)                    |
| Cơ sở dữ liệu | MongoDB + Mongoose ODM                    |
| Xác thực      | JWT + Firebase Admin SDK (dual-auth)      |
| Realtime      | Socket.IO 4                               |
| Upload file   | Cloudinary                                |
| Email         | Nodemailer (SMTP)                         |
| Rate limiting | express-rate-limit (300 requests/15 phút) |
| Deploy        | Vercel (Serverless)                       |

---

## 3. Cấu trúc Thư mục

```
urent-server/src/
├── app.ts                    # Khởi tạo Express, đăng ký middleware và routes
├── server.ts                 # Khởi động HTTP server + Socket.IO (local)
├── config/
│   ├── env.ts                # Parse và validate biến môi trường
│   ├── db.ts                 # Kết nối MongoDB với fallback DNS
│   ├── cloudinary.ts         # Cấu hình Cloudinary SDK
│   └── firebase.ts           # Khởi tạo Firebase Admin SDK
├── controllers/              # Xử lý request/response
├── middlewares/              # Auth guard, error handler, request validator
├── models/                   # Mongoose schemas
├── realtime/
│   └── socket.ts             # Socket.IO server — auth middleware + event handlers
├── routes/                   # Đăng ký route cho từng domain
├── services/                 # Logic nghiệp vụ
├── types/
│   └── express.d.ts          # Mở rộng kiểu Express Request (req.user)
├── utils/                    # Tiện ích nhỏ (hash, jwt, otp, v.v.)
└── validators/               # Zod schemas cho request body (Zod)
```

---

## 4. Middleware Pipeline

Thứ tự xử lý request (toàn cục & theo route):

```
Request
  │
  ├─► cors()                     Kiểm tra CORS, whitelist từ CLIENT_URLS
  ├─► express.json()             Parse JSON body
  ├─► rateLimit()                300 req / 15 phút / IP
  ├─► [route handler]
  │     └─► authGuard            Xác thực token (JWT hoặc Firebase ID token)
  │     └─► validateBody(schema) Zod validation cho request body
  │     └─► controller logic
  │
  └─► errorMiddleware            Bắt tất cả lỗi, trả về JSON chuẩn
```

---

## 5. Xác thực – Dual Auth (JWT + Firebase)

Hệ thống hỗ trợ đồng thời hai phương thức xác thực.

### 5a. JWT (Email / Password)

1. Client gửi `POST /api/auth/register` → server tạo tài khoản, gửi OTP email.
2. Client xác nhận OTP qua `POST /api/auth/register/verify-otp` → server cấp **JWT**.
3. Mọi request tiếp theo gửi `Authorization: Bearer <jwt>` trong header.
4. `authGuard` middleware xác minh JWT bằng `JWT_SECRET`.

### 5b. Firebase (Google Sign-In / Phone OTP)

1. Client thực hiện Google Sign-In trực tiếp qua Firebase Web SDK → nhận **Firebase ID token**.
2. Client gửi ID token đến `authGuard`; server xác minh qua `admin.auth().verifyIdToken()`.
3. **Phone OTP:** JWT users cần Firebase session để link số điện thoại. Server cấp **Firebase Custom Token** qua `GET /api/auth/firebase/custom-token`. Client dùng token này để `signInWithCustomToken()` trước khi bắt đầu OTP flow.

### Luồng xác thực tổng quát

```
Client Request
    │
    ▼
authGuard middleware
    │
    ├─► Bearer token dạng Firebase ID token?
    │       └─► admin.auth().verifyIdToken()
    │               └─► resolveAppIdentity() → chuẩn hóa → req.user
    │
    └─► Bearer token dạng JWT?
            └─► jwt.verify(token, JWT_SECRET)
                    └─► req.user = { sub, email, ... }
```

`resolveAppIdentity()` trong `auth-identity.service.ts` đảm bảo `req.user` luôn có dạng chuẩn `{ sub: string, email: string }` bất kể nguồn token.

**File liên quan:**

- `config/firebase.ts` – khởi tạo Firebase Admin SDK
- `utils/auth-token.ts` – tạo/verify JWT và Firebase ID token
- `services/auth-identity.service.ts` – đồng bộ user giữa JWT và Firebase
- `middlewares/auth.middleware.ts` – `authGuard`
- `realtime/socket.ts` – xác thực socket bằng cùng verifier

---

## 6. API Endpoints

### Auth — `/api/auth`

| Method | Path                     | Auth | Mô tả                                             |
| :----- | :----------------------- | :--- | :------------------------------------------------ |
| POST   | `/register`              | ✗    | Đăng ký, gửi OTP email                            |
| POST   | `/register/verify-otp`   | ✗    | Xác nhận OTP đăng ký → trả JWT                    |
| POST   | `/login`                 | ✗    | Đăng nhập, gửi OTP email (nếu bật 2FA)            |
| POST   | `/google`                | ✗    | Đăng nhập Google bằng Firebase ID token → trả JWT |
| POST   | `/login/verify-otp`      | ✗    | Xác nhận OTP đăng nhập → trả JWT                  |
| POST   | `/verify-otp`            | ✗    | Xác nhận OTP chung (forgot password, v.v.)        |
| POST   | `/forgot-password`       | ✗    | Gửi link reset mật khẩu qua email                 |
| POST   | `/reset-password`        | ✗    | Đặt lại mật khẩu bằng reset token                 |
| GET    | `/me`                    | ✔    | Lấy thông tin người dùng hiện tại                 |
| GET    | `/firebase/custom-token` | ✔    | Cấp Firebase Custom Token cho JWT users           |

### Profile — `/api/profile`

| Method | Path      | Auth | Mô tả                                           |
| :----- | :-------- | :--- | :---------------------------------------------- |
| GET    | `/`       | ✔    | Lấy profile người dùng                          |
| PATCH  | `/`       | ✔    | Cập nhật displayName, bio, phone, mật khẩu      |
| POST   | `/avatar` | ✔    | Upload/thay avatar (max 5MB, JPEG/PNG/WebP/GIF) |

### Settings — `/api/settings`

| Method | Path | Auth | Mô tả                                        |
| :----- | :--- | :--- | :------------------------------------------- |
| GET    | `/`  | ✔    | Lấy cài đặt (upsert mặc định nếu chưa có)    |
| PATCH  | `/`  | ✔    | Cập nhật theme, language, notifications, 2FA |

### Products — `/api/v1`

| Method | Path            | Auth | Mô tả                                   |
| :----- | :-------------- | :--- | :-------------------------------------- |
| GET    | `/products`     | ✔    | Danh sách sản phẩm (có phân trang, lọc) |
| GET    | `/products/:id` | ✔    | Chi tiết sản phẩm                       |
| POST   | `/products`     | ✔    | Tạo sản phẩm mới                        |
| PATCH  | `/products/:id` | ✔    | Cập nhật sản phẩm (chủ sở hữu)          |
| DELETE | `/products/:id` | ✔    | Xoá sản phẩm                            |

### Messages — `/api/v1`

| Method | Path                                 | Auth | Mô tả                                |
| :----- | :----------------------------------- | :--- | :----------------------------------- | --- | --- | ------------------------------ | --- | --------------------------- | --- | ---- | --------------------------- | --- | -------------------------- |
| GET    | `/conversations`                     | ✔    | Danh sách cuộc trò chuyện            |
| GET    | `/conversations/peer-by-email`       | ✔    | Tìm peer theo email                  |     | GET | `/conversations/peer-by-phone` | ✔   | Tìm peer theo số điện thoại |     | POST | `/conversations/one-to-one` | ✔   | Tạo/mở cuộc trò chuyện 1-1 |
| POST   | `/conversations/one-to-one/by-email` | ✔    | Tạo/mở cuộc trò chuyện 1-1 qua email |
| GET    | `/conversations/:id/messages`        | ✔    | Lấy tin nhắn của cuộc trò chuyện     |
| DELETE | `/conversations/:id`                 | ✔    | Xóa cuộc trò chuyện                  |
| POST   | `/conversations/:id/messages`        | ✔    | Gửi tin nhắn                         |
| POST   | `/conversations/:id/read`            | ✔    | Đánh dấu đã đọc                      |
| GET    | `/messages/search`                   | ✔    | Tìm kiếm tin nhắn                    |

---

## 7. Realtime (Socket.IO)

Server khởi tạo Socket.IO trên cùng HTTP server. Client xác thực bằng token giống REST API.

**Kết nối:**

```ts
const socket = io("http://localhost:5003", {
  auth: { token: "<access_token>" },
  // hoặc: extraHeaders: { Authorization: 'Bearer <token>' }
});
```

**Events client → server:**

| Event                | Payload              | Mô tả                         |
| :------------------- | :------------------- | :---------------------------- |
| `conversation.join`  | `{ conversationId }` | Tham gia room cuộc trò chuyện |
| `conversation.leave` | `{ conversationId }` | Rời room                      |

**Events server → client:**

| Event                          | Mô tả                      |
| :----------------------------- | :------------------------- |
| `conversation.message.created` | Tin nhắn mới trong room    |
| `conversation.read.updated`    | Trạng thái đã đọc cập nhật |

---

## 8. Models Chính

| Model               | File                           | Mô tả                            |
| :------------------ | :----------------------------- | :------------------------------- |
| `UserModel`         | `models/user.model.ts`         | Người dùng, password hash, OTP   |
| `ProductModel`      | `models/product.model.ts`      | Sản phẩm cho thuê                |
| `OrderModel`        | `models/order.model.ts`        | Đơn thuê                         |
| `ConversationModel` | `models/conversation.model.ts` | Cuộc trò chuyện                  |
| `MessageModel`      | `models/message.model.ts`      | Tin nhắn                         |
| `NotificationModel` | `models/notification.model.ts` | Thông báo hệ thống               |
| `ActivityLogModel`  | `models/activity-log.model.ts` | Nhật ký hoạt động của người dùng |
| `SettingsModel`     | `models/settings.model.ts`     | Cài đặt cá nhân                  |

---

## 9. Quy tắc chung cho API Response

**Thành công:**

```json
{
  "success": true,
  "data": { "...": "..." }
}
```

**Thành công có phân trang:**

```json
{
  "success": true,
  "data": ["..."],
  "meta": { "nextCursor": "...", "hasMore": true }
}
```

**Lỗi:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email không hợp lệ",
    "details": [{ "field": "email", "message": "Required" }]
  }
}
```

HTTP status codes chuẩn: 200, 201, 400, 401, 403, 404, 500.

**Mã lỗi thường gặp:**

| Code                            | HTTP | Ý nghĩa                                   |
| :------------------------------ | :--- | :---------------------------------------- |
| `UNAUTHORIZED`                  | 401  | Token thiếu hoặc hết hạn → redirect login |
| `FORBIDDEN_CONVERSATION_ACCESS` | 403  | Không là thành viên conversation          |
| `VALIDATION_ERROR`              | 400  | Sai payload / query / cursor              |
| `CONVERSATION_NOT_FOUND`        | 404  | Conversation không tồn tại                |
| `PRODUCT_NOT_FOUND`             | 404  | Product không tồn tại                     |

---

## 10. Bảo mật & Hiệu năng

- **Rate limit** 300 requests / 15 phút / IP (toàn cục).
- **Input validation** tất cả body và query params qua Zod schema.
- **CORS** chỉ cho phép các domain trong `CLIENT_URLS`.
- **JWT** gửi qua `Authorization: Bearer <token>` header.
- **OTP** có thời gian sống giới hạn (`OTP_EXPIRES_MINUTES`), lưu trong MongoDB.
- **Cloudinary** chỉ nhận file ≤ 5MB, định dạng JPEG/PNG/WebP/GIF cho avatar.

---

## 11. Biến Môi Trường

Tạo file `.env` trong thư mục `urent-server/`:

```env
# Server
PORT=5003
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/urent
MONGO_URI_FALLBACK=               # tuỳ chọn, dùng khi MONGO_URI lỗi

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OTP_EXPIRES_MINUTES=10
RESET_TOKEN_EXPIRES_MINUTES=15

# CORS
CLIENT_URLS=http://localhost:5173,https://your-app.vercel.app

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=app-password
EMAIL_FROM="URent <your@email.com>"

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Firebase Admin (chọn một trong hai)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Hoặc dùng file service account:
# FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

## 12. Triển khai (Deployment)

Backend hiện deploy trên **Vercel** dưới dạng serverless functions:

- Sử dụng `@vercel/node` builder
- Các route map qua `vercel.json`
- WebSocket (Socket.IO) yêu cầu cấu hình riêng biệt

> Nếu cần WebSocket ổn định, khuyến nghị chạy backend trên VPS (DigitalOcean, AWS EC2) với Nginx reverse proxy.

---

## 13. Hướng dẫn mở rộng

### Thêm một entity mới (ví dụ: `Order`)

1. Tạo model trong `models/order.model.ts`
2. Tạo service trong `services/order.service.ts`
3. Tạo controller trong `controllers/order.controller.ts`
4. Định nghĩa Zod schema trong `validators/order.validator.ts`
5. Khai báo route trong `routes/order.route.ts`
6. Mount route vào `app.ts`

### Thêm realtime cho feature mới

- Emit event từ controller/service bằng `getIO().to(room).emit(eventName, payload)`
- Đảm bảo client join đúng room trước khi nhận event.
