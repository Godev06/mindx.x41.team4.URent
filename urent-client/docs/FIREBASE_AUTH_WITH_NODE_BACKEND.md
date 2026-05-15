# Firebase Authentication với Node.js Backend (URent)

Tài liệu mô tả luồng xác thực Dual-Auth: JWT (email/password + OTP) và Firebase (Google Sign-In).

---

## 1. Tổng quan Dual-Auth

| Phương thức     | Luồng                                                                  |
| :-------------- | :--------------------------------------------------------------------- |
| JWT             | Register → OTP email → JWT → `Authorization: Bearer <jwt>`             |
| Firebase Google | Google Sign-In (Firebase SDK) → ID token → backend verify → JWT nội bộ |

Backend chấp nhận **cả hai loại token** trong header `Authorization: Bearer <token>`. `authGuard` middleware tự phân biệt và xác minh.

---

## 2. Luồng xác thực

```
Client Request
    │
    ▼
authGuard middleware
    │
    ├─► Bearer token là Firebase ID token?
    │       └─► admin.auth().verifyIdToken()
    │               └─► resolveAppIdentity() → req.user = { sub, email }
    │
    └─► Bearer token là JWT nội bộ?
            └─► jwt.verify(token, JWT_SECRET)
                    └─► req.user = { sub, email, ... }
```

`resolveAppIdentity()` trong `auth-identity.service.ts` tìm/tạo user MongoDB từ Firebase identity, đảm bảo `req.user.sub` luôn là MongoDB `_id`.

---

## 3. Cấu hình Frontend

### 3.1 Biến môi trường (`urent-client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5003
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3.2 Firebase init

`src/lib/firebase.ts` khởi tạo Firebase app và export `auth`. `apiClient` tự động đính kèm Firebase ID token (refresh nếu cần) qua request interceptor.

### 3.3 Google Sign-In (ví dụ)

```tsx
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export function GoogleLoginButton() {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // apiClient tự động lấy token từ auth.currentUser
  };

  return <button onClick={handleSignIn}>Đăng nhập với Google</button>;
}
```

> `apiClient` đã có interceptor tự refresh token — không cần set `Authorization` header thủ công trong hầu hết trường hợp.

---

## 4. Cấu hình Backend

### 4.1 Biến môi trường (`urent-server/.env`)

Chọn **một** trong hai cách cấu hình Firebase Admin:

**Option A — Service account file:**

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

**Option B — Inline credentials:**

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> Thêm `serviceAccountKey.json` vào `.gitignore`, không commit lên git.

### 4.2 Khởi động

```bash
cd urent-server
npm run dev
```

`initializeFirebase()` được gọi tự động trong `server.ts` khi khởi động.

### 4.3 Files liên quan

| File                                    | Vai trò                                              |
| :-------------------------------------- | :--------------------------------------------------- |
| `src/config/firebase.ts`                | Khởi tạo Firebase Admin SDK                          |
| `src/utils/auth-token.ts`               | `verifyAccessToken()` — verify JWT và Firebase token |
| `src/services/auth-identity.service.ts` | Map Firebase identity → MongoDB user                 |
| `src/middlewares/auth.middleware.ts`    | `authGuard` middleware                               |
| `src/realtime/socket.ts`                | Socket.IO auth dùng cùng verifier                    |
| `src/controllers/auth.controller.ts`    | `getMe`, `googleLogin`, `getFirebaseCustomToken`     |

---

## 5. Bảo mật

- Dùng HTTPS trong production.
- Giới hạn CORS chỉ cho domain trong `CLIENT_URLS`.
- Xử lý `auth/id-token-expired` ở client bằng cách re-authenticate tự động (interceptor đã có sẵn).
- `authGuard` chỉ xác thực danh tính (authentication) — phân quyền (authorization) cần kiểm tra thêm trong từng controller/service.

---

## 6. Checklist kiểm tra

- [ ] Firebase login thành công trên frontend
- [ ] `GET /api/auth/me` trả về 200 với dữ liệu user
- [ ] Các route `/api/v1/*` chấp nhận Firebase Bearer token
- [ ] Luồng JWT đăng ký/đăng nhập vẫn hoạt động bình thường
