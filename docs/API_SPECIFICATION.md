# 🔌 API Reference & WebSocket Specification

This document provides a comprehensive technical reference for the URent REST API and real-time Socket.IO event gateway.

---

## 1. Global Standards & Payloads

### Base URL
- **Local Dev Server**: `http://localhost:5003/api/v1`
- **AI Proxy Route**: `http://localhost:5003/api` (for `/api/urent-ai/analyze`)
- **API Documentation**: `http://localhost:5003/api-docs`

### Request Headers
Every protected endpoint requires a valid JWT or Firebase ID Token passed in the `Authorization` header:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Standard Response Wrappers

#### 1. Success Response (Single Object)
```json
{
  "success": true,
  "data": {
    "_id": "664def...",
    "email": "user@example.com"
  }
}
```

#### 2. Success Response (Paginated List)
URent utilizes a highly efficient **Cursor-Based Pagination** model to prevent performance degradation on large datasets.
```json
{
  "success": true,
  "data": [
    { "_id": "664abc...", "content": "Hello" }
  ],
  "meta": {
    "nextCursor": "664def...",
    "hasMore": true
  }
}
```

#### 3. Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed on incoming request parameters.",
    "details": [
      { "field": "email", "message": "Invalid email address format." }
    ]
  }
}
```

### Standard Error Codes

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `ROUTE_NOT_FOUND` | `404 Not Found` | The requested route does not exist. |
| `UNAUTHORIZED` | `401 Unauthorized` | Missing, expired, or invalid token. Redirect user to login. |
| `FORBIDDEN` | `403 Forbidden` | Access denied for this resource (e.g. non-participant reading chats). |
| `VALIDATION_ERROR` | `400 Bad Request` | Incoming payload failed Zod schema checks. |
| `CONVERSATION_NOT_FOUND` | `404 Not Found` | The active chat conversation was not found or deleted. |
| `PRODUCT_NOT_FOUND` | `404 Not Found` | The requested product listing does not exist. |
| `RATE_LIMIT_EXCEEDED` | `429 Too Many Requests` | Exceeded 300 requests in a 15-minute window. |

---

## 2. REST API Endpoints

### 2.1 Authentication (`/api/v1/auth`)

#### Register A New Account
- **HTTP Method**: `POST`
- **Route**: `/api/v1/auth/register`
- **Authentication**: Public
- **Request Payload**:
  ```json
  {
    "email": "alex@example.com",
    "password": "SecurePassword123",
    "displayName": "Alex Carter"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Registration initiated. Verification OTP has been sent to your email.",
      "email": "alex@example.com"
    }
  }
  ```

#### Verify Registration OTP
- **HTTP Method**: `POST`
- **Route**: `/api/v1/auth/register/verify-otp`
- **Authentication**: Public
- **Request Payload**:
  ```json
  {
    "email": "alex@example.com",
    "otpCode": "843219"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "665def1a3c6...",
        "email": "alex@example.com",
        "displayName": "Alex Carter",
        "role": "user",
        "isEmailVerified": true
      },
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

#### Authenticate (Login)
- **HTTP Method**: `POST`
- **Route**: `/api/v1/auth/login`
- **Authentication**: Public
- **Request Payload**:
  ```json
  {
    "email": "alex@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "665def1a3c6...",
        "email": "alex@example.com",
        "displayName": "Alex Carter",
        "role": "user"
      },
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

#### Authenticate with Google (Firebase)
- **HTTP Method**: `POST`
- **Route**: `/api/v1/auth/google`
- **Authentication**: Public
- **Request Payload**:
  ```json
  {
    "token": "firebase_id_token_here"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "665fec72...",
        "email": "google.user@gmail.com",
        "displayName": "Google User",
        "role": "user"
      },
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

#### Fetch Active Session Profile
- **HTTP Method**: `GET`
- **Route**: `/api/v1/auth/me`
- **Authentication**: Required (`Bearer Token`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "665def1a3c6...",
        "email": "alex@example.com",
        "displayName": "Alex Carter",
        "role": "user",
        "avatarUrl": "https://res.cloudinary.com/..."
      }
    }
  }
  ```

---

### 2.2 Product Listings (`/api/v1/products`)

#### Create A Listing
- **HTTP Method**: `POST`
- **Route**: `/api/v1/products`
- **Authentication**: Required
- **Request Payload**:
  ```json
  {
    "name": "Sony Alpha 7 IV Camera",
    "category": "Điện tử & Công nghệ",
    "price": 450000,
    "imageUrl": "https://placehold.co/600x400.png",
    "description": ["Sony Mirrorless Camera", "24-70mm GM Lens Included"],
    "condition": "99%",
    "locationText": "Quận 1, TP. Hồ Chí Minh",
    "location": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "665def2b4d7...",
      "ownerId": "665def1a3c6...",
      "name": "Sony Alpha 7 IV Camera",
      "category": "Điện tử & Công nghệ",
      "price": 450000,
      "status": "Available",
      "statusQuantities": { "available": 1, "rented": 0, "overdue": 0 },
      "imageUrl": "https://placehold.co/600x400.png",
      "condition": "99%",
      "locationText": "Quận 1, TP. Hồ Chí Minh",
      "location": {
        "type": "Point",
        "coordinates": [106.7009, 10.7769]
      },
      "isArchived": false,
      "createdAt": "2026-05-31T01:30:00.000Z"
    }
  }
  ```

#### Query Listings
- **HTTP Method**: `GET`
- **Route**: `/api/v1/products?limit=20&cursor=&category=&search=`
- **Authentication**: Required
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "665def2b4d7...",
        "name": "Sony Alpha 7 IV Camera",
        "price": 450000,
        "imageUrl": "https://placehold.co/..."
      }
    ],
    "meta": {
      "nextCursor": "665def2b4d7...",
      "hasMore": false
    }
  }
  ```

---

### 2.3 Instant Messaging & Conversations (`/api/v1/conversations`)

#### Retrieve Active Chats
- **HTTP Method**: `GET`
- **Route**: `/api/v1/conversations?limit=20&cursor=`
- **Authentication**: Required
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "665def3c5e8...",
        "lastMessage": "Cho mình hỏi máy ảnh còn không?",
        "lastMessageAt": "2026-05-31T01:32:00.000Z",
        "unreadCount": 1,
        "lastReadAt": "2026-05-31T01:25:00.000Z",
        "participants": [
          {
            "userId": "665cba2e9f1...",
            "displayName": "Linh Nguyen",
            "avatarUrl": "https://...",
            "email": "linh@example.com"
          }
        ]
      }
    ]
  }
  ```

#### Send A Message
- **HTTP Method**: `POST`
- **Route**: `/api/v1/conversations/:id/messages`
- **Authentication**: Required
- **Request Payload Options**:

  *Option A: TEXT Message*
  ```json
  {
    "messageType": "TEXT",
    "content": "Giá thuê có giảm được không bạn?"
  }
  ```

  *Option B: PRODUCT Message*
  ```json
  {
    "messageType": "PRODUCT",
    "content": "Mình muốn thuê sản phẩm này.",
    "metadata": {
      "productId": "665def2b4d7..."
    }
  }
  ```

  *Option C: LOCATION Message*
  ```json
  {
    "messageType": "LOCATION",
    "content": "Vị trí giao đồ nha.",
    "metadata": {
      "latitude": 10.7769,
      "longitude": 106.7009,
      "address": "Quận 1, TP. Hồ Chí Minh"
    }
  }
  ```

- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "msg_0182cba9a...",
      "conversationId": "665def3c5e8...",
      "senderId": "665def1a3c6...",
      "messageType": "TEXT",
      "content": "Giá thuê có giảm được không bạn?",
      "metadata": null,
      "createdAt": "2026-05-31T01:33:00.000Z"
    }
  }
  ```

#### Mark Conversation As Read
- **HTTP Method**: `POST`
- **Route**: `/api/v1/conversations/:id/read`
- **Authentication**: Required
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "conversationId": "665def3c5e8...",
      "userId": "665def1a3c6...",
      "lastReadAt": "2026-05-31T01:34:00.000Z"
    }
  }
  ```

---

### 2.4 User Profiles & Settings

#### Update Profile Details
- **HTTP Method**: `PATCH`
- **Route**: `/api/v1/profile`
- **Authentication**: Required
- **Request Payload**:
  ```json
  {
    "displayName": "Alex C.",
    "bio": "Đam mê chụp ảnh và du lịch bụi.",
    "phone": "0987654321"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "displayName": "Alex C.",
      "bio": "Đam mê chụp ảnh và du lịch bụi.",
      "phone": "0987654321"
    }
  }
  ```

#### Upload Avatar Image
- **HTTP Method**: `POST`
- **Route**: `/api/v1/profile/avatar`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Request Payload**: Binary File under the key `avatar` (Max 5MB, JPG/PNG/WebP/GIF)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "avatarUrl": "https://res.cloudinary.com/urent/image/upload/v1726/avatars/665def1a3c6.png"
    }
  }
  ```

#### Update User Settings
- **HTTP Method**: `PATCH`
- **Route**: `/api/v1/settings`
- **Authentication**: Required
- **Request Payload**:
  ```json
  {
    "theme": "dark",
    "language": "vi",
    "notificationsEnabled": true,
    "twoFactorEnabled": false
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "theme": "dark",
      "language": "vi",
      "notificationsEnabled": true,
      "twoFactorEnabled": false
    }
  }
  ```

---

### 2.5 AI Secure Proxy (`/api/urent-ai`)

#### Run Vision Pricing Engine
- **HTTP Method**: `POST`
- **Route**: `/api/urent-ai/analyze`
- **Authentication**: Required
- **Request Payload**: Contains standard Gemini vision contents structures.
- **Response (200 OK)**: Returns verified, rigid JSON conforming to Structured Outputs.
  ```json
  {
    "product_analysis": {
      "brand": "Sony",
      "model": "Alpha 7 IV",
      "market_segment": "Cao cấp",
      "visual_condition": "Ngoại quan mới, không vết trầy xước, ống kính sạch."
    },
    "market_valuation": {
      "estimated_current_value": 45000000,
      "recommended_rent_per_day": 450000,
      "min_rent_per_day": 350000,
      "max_rent_per_day": 600000,
      "suggested_deposit": 30000000,
      "pricing_logic": "Dựa trên phân khúc chuyên nghiệp và độ mới 99% của máy Sony A7M4."
    },
    "category": "Điện tử & Công nghệ",
    "condition": "99%",
    "description": [
      "Cảm biến Full-frame 33MP chất lượng cao",
      "Hệ thống lấy nét mắt thời gian thực (Real-time Eye AF)",
      "Quay phim 4K 60p chuyên nghiệp",
      "Kèm ống kính zoom tiêu chuẩn chất lượng cao"
    ],
    "confidence": "high"
  }
  ```

---

## 3. Real-Time WebSocket Events (Socket.IO)

### Handshake Configuration
Handshake request must supply the authorization bearer token in the handshake authentication dictionary:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5003", {
  auth: {
    token: "eyJhbGciOiJIUzI1Ni..." // Bearer JWT or Firebase ID Token
  }
});
```

---

### 3.1 Client-to-Server Events (Submissions)

#### `conversation.join`
Joins a specific message channel.
- **Payload**:
  ```json
  {
    "conversationId": "665def3c5e8..."
  }
  ```
- **Server Acknowledgment**:
  ```json
  {
    "success": true,
    "message": "Joined room 665def3c5e8... successfully"
  }
  ```

#### `conversation.leave`
Unsubscribes from a message channel.
- **Payload**:
  ```json
  {
    "conversationId": "665def3c5e8..."
  }
  ```

---

### 3.2 Server-to-Client Events (Broadcasts)

#### `conversation.message.created`
Broadcasts when a new message is successfully recorded in a room.
- **Payload**:
  ```json
  {
    "conversationId": "665def3c5e8...",
    "message": {
      "id": "msg_0182cba9a...",
      "senderId": "665def1a3c6...",
      "messageType": "TEXT",
      "content": "Giá thuê có giảm được không bạn?",
      "createdAt": "2026-05-31T01:33:00.000Z"
    }
  }
  ```

#### `conversation.read.updated`
Broadcasts when a participant marks the conversation messages history as read.
- **Payload**:
  ```json
  {
    "conversationId": "665def3c5e8...",
    "userId": "665def1a3c6...",
    "lastReadAt": "2026-05-31T01:34:00.000Z"
  }
  ```
