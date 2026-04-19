# Tài liệu tích hợp API Message — Frontend

## 0. Quy ước chung

**Base URL:** `http://localhost:5003/api/v1`

**Auth header** (bắt buộc tất cả endpoint):

```
Authorization: Bearer <access_token>
```

**Response thành công:**

```json
{
  "success": true,
  "data": "<payload>",
  "meta": { "limit": 20, "nextCursor": "...", "hasMore": true }
}
```

**Response lỗi:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "content", "message": "Required" }]
  }
}
```

**Mã lỗi cần xử lý:**

| Code                            | HTTP | Ý nghĩa                                   |
| ------------------------------- | ---- | ----------------------------------------- |
| `UNAUTHORIZED`                  | 401  | Token thiếu hoặc hết hạn → redirect login |
| `FORBIDDEN_CONVERSATION_ACCESS` | 403  | Không là thành viên conversation          |
| `VALIDATION_ERROR`              | 400  | Sai payload / query / cursor              |
| `CONVERSATION_NOT_FOUND`        | 404  | Conversation không tồn tại                |
| `PRODUCT_NOT_FOUND`             | 404  | Product không tồn tại                     |

---

## 1. Danh sách hội thoại

```
GET /conversations?cursor=&limit=&q=
```

**Query params:**

| Param    | Kiểu   | Bắt buộc | Ghi chú                                   |
| -------- | ------ | -------- | ----------------------------------------- |
| `cursor` | string | Không    | Lấy từ `meta.nextCursor` của trang trước  |
| `limit`  | number | Không    | Mặc định 20, tối đa 50                    |
| `q`      | string | Không    | Tìm trong `lastMessage`, tối đa 200 ký tự |

**Response `data` — mảng conversation:**

```json
[
  {
    "id": "664abc...",
    "lastMessage": "Cho mình hỏi xe còn không?",
    "lastMessageAt": "2026-04-18T10:30:00.000Z",
    "unreadCount": 3,
    "lastReadAt": "2026-04-18T10:25:00.000Z",
    "participants": [
      {
        "userId": "664def...",
        "displayName": "Nguyễn Văn A",
        "avatarUrl": "https://...",
        "email": "a@example.com"
      }
    ]
  }
]
```

> `participants` chỉ chứa **người còn lại** (không phải current user). Conversation 1-1 sẽ có đúng 1 phần tử.

> `lastMessage` của PRODUCT hiển thị `"[Product]"`, của LOCATION hiển thị `"[Location]"`.

---

## 2. Lịch sử tin nhắn

```
GET /conversations/:conversationId/messages?cursor=&limit=&search=
```

**Path param:** `conversationId` — MongoDB ObjectId 24 ký tự hex.

**Query params:**

| Param    | Kiểu   | Bắt buộc | Ghi chú                                                                                   |
| -------- | ------ | -------- | ----------------------------------------------------------------------------------------- |
| `cursor` | string | Không    | Dùng để load thêm (cuộn lên)                                                              |
| `limit`  | number | Không    | Mặc định 20, tối đa 50                                                                    |
| `search` | string | Không    | Tìm trong nội dung, tên sản phẩm (`metadata.snapshot.name`), địa chỉ (`metadata.address`) |

**Response `data` — mảng message, sắp xếp mới nhất trước:**

```json
[
  {
    "id": "msg001",
    "conversationId": "664abc...",
    "senderId": "664def...",
    "messageType": "TEXT",
    "content": "Cho mình hỏi xe còn không?",
    "metadata": null,
    "createdAt": "2026-04-18T10:30:00.000Z"
  },
  {
    "id": "msg002",
    "conversationId": "664abc...",
    "senderId": "664ghi...",
    "messageType": "PRODUCT",
    "content": null,
    "metadata": {
      "productId": "664xyz...",
      "snapshot": {
        "name": "Honda Wave 110",
        "pricePerDay": 150000,
        "imageUrl": "https://...",
        "category": "Xe máy"
      }
    },
    "createdAt": "2026-04-18T10:28:00.000Z"
  },
  {
    "id": "msg003",
    "conversationId": "664abc...",
    "senderId": "664def...",
    "messageType": "LOCATION",
    "content": null,
    "metadata": {
      "latitude": 10.7769,
      "longitude": 106.7009,
      "address": "Quận 1, TP.HCM"
    },
    "createdAt": "2026-04-18T10:26:00.000Z"
  }
]
```

> **Lưu ý:** Mảng trả về **mới nhất trước** (index 0 = tin mới nhất). Khi render chat, FE cần reverse lại để hiển thị cũ → mới từ trên xuống.

---

## 3. Gửi tin nhắn

```
POST /conversations/:conversationId/messages
Content-Type: application/json
```

**Body — TEXT:**

```json
{
  "messageType": "TEXT",
  "content": "Cho mình hỏi xe còn không?"
}
```

- `content`: bắt buộc, trim không rỗng, tối đa 2000 ký tự

**Body — PRODUCT:**

```json
{
  "messageType": "PRODUCT",
  "content": "Mình muốn thuê cái này",
  "metadata": {
    "productId": "664xyz..."
  }
}
```

- `content`: tùy chọn
- `metadata.productId`: bắt buộc — BE tự snapshot `name`, `pricePerDay`, `imageUrl`, `category`

**Body — LOCATION:**

```json
{
  "messageType": "LOCATION",
  "content": "Mình ở đây",
  "metadata": {
    "latitude": 10.7769,
    "longitude": 106.7009,
    "address": "Quận 1, TP.HCM"
  }
}
```

- `content`: tùy chọn
- `metadata.latitude`, `metadata.longitude`: bắt buộc, số thực (lat: `-90..90`, lng: `-180..180`)
- `metadata.address`: tùy chọn, tối đa 500 ký tự

**Response:** HTTP 201 — trả về message object vừa tạo (cùng shape như mục 2).

> Sau khi POST thành công, **không cần prepend thủ công** nếu đã lắng nghe Socket.IO event `conversation.message.created` — BE emit ngay cho toàn bộ member trong room.

---

## 4. Đánh dấu đã đọc

```
POST /conversations/:conversationId/read
```

Không có body. Gọi khi user mở conversation hoặc scroll đến tin cuối.

**Response `data`:**

```json
{
  "conversationId": "664abc...",
  "userId": "664def...",
  "lastReadAt": "2026-04-18T10:35:00.000Z"
}
```

> BE sẽ đồng thời emit Socket.IO event `conversation.read.updated` cho tất cả member trong room.

---

## 5. Tìm kiếm tin nhắn

```
GET /messages/search?q=&conversationId=&cursor=&limit=
```

**Query params:**

| Param            | Kiểu   | Bắt buộc | Ghi chú                       |
| ---------------- | ------ | -------- | ----------------------------- |
| `q`              | string | **Có**   | Từ khóa, 1–200 ký tự          |
| `conversationId` | string | Không    | Giới hạn trong 1 conversation |
| `cursor`         | string | Không    | Phân trang                    |
| `limit`          | number | Không    | Mặc định 20, tối đa 50        |

Tìm kiếm trong: `content`, `metadata.snapshot.name` (PRODUCT), `metadata.address` (LOCATION).

**Response `data`** — tương tự mục 2 nhưng field `id` đổi thành `messageId`:

```json
[
  {
    "messageId": "msg001",
    "conversationId": "664abc...",
    "senderId": "664def...",
    "messageType": "TEXT",
    "content": "Cho mình hỏi xe còn không?",
    "metadata": null,
    "createdAt": "2026-04-18T10:30:00.000Z"
  }
]
```

---

## 6. Realtime — Socket.IO

**Cài package:**

```bash
npm install socket.io-client
```

**Kết nối & xác thực:**

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:5003", {
  auth: { token: "<access_token>" },
  // hoặc: extraHeaders: { Authorization: 'Bearer <token>' }
});

socket.on("connect_error", (err) => {
  if (err.message === "UNAUTHORIZED") {
    /* redirect login */
  }
});
```

**Join room (sau khi mở conversation):**

```ts
socket.emit("conversation.join", { conversationId: "664abc..." }, (ack) => {
  if (!ack.success) {
    console.error(ack.error); // FORBIDDEN_CONVERSATION_ACCESS | VALIDATION_ERROR
  }
});
```

**Leave room (khi đóng conversation):**

```ts
socket.emit("conversation.leave", { conversationId: "664abc..." });
```

**Lắng nghe tin nhắn mới:**

```ts
socket.on("conversation.message.created", ({ conversationId, message }) => {
  // message có shape giống response mục 3
  // - Prepend vào danh sách tin nhắn của conversationId
  // - Cập nhật lastMessage + lastMessageAt của conversation trong chat list
});
```

**Lắng nghe đã đọc:**

```ts
socket.on(
  "conversation.read.updated",
  ({ conversationId, userId, lastReadAt }) => {
    // userId là người vừa đọc
    // Reset badge unread của người đó nếu cần
  },
);
```

---

## 7. Pagination — Cursor

Tất cả list API dùng cursor-based pagination, không dùng page/offset.

```
// Trang đầu — không truyền cursor
GET /conversations/messages?limit=20

// Trang tiếp — lấy nextCursor từ meta trang trước
GET /conversations/messages?cursor=<nextCursor>&limit=20
```

Logic FE:

```ts
if (meta.hasMore) {
  // còn data → lưu meta.nextCursor để dùng cho request tiếp
} else {
  // đã hết → ẩn nút "Tải thêm"
}
// meta.nextCursor === null → không truyền cursor vào request tiếp
```
