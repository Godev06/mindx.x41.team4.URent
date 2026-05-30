# 🏗 System Architecture & System Design

This document details the system design, network flows, components, and security architectures that power the **URent** ecosystem.

---

## 1. High-Level System Architecture

URent is built upon a modern, distributed architecture combining a React single-page application (SPA), an Express API gateway, a real-time WebSocket server, a managed document database, and specialized cloud services.

```mermaid
graph TD
    %% Client Tier
    subgraph Client Tier [Client Tier]
        RC[React Client SPA]
        FSDK[Firebase Web SDK]
    end

    %% Network & Gateway Tier
    subgraph Gateway Tier [Gateway / CDN Tier]
        VCDN[Vercel CDN]
        RL[Rate Limiter - 300 req/15m]
    end

    %% Service Tier
    subgraph Service Tier [App & Realtime Services]
        BE[Express API Server]
        WSS[Socket.IO Server]
    end

    %% Third Party Services
    subgraph Cloud Tier [External Cloud Integration]
        FBA[Firebase Auth Service]
        CLD[Cloudinary Storage]
        GEM[Google Gemini AI API]
        SMTP[SMTP Email Server]
    end

    %% Storage Tier
    subgraph Storage Tier [Data Storage Tier]
        MDB[(MongoDB Atlas)]
    end

    %% Relations
    RC -->|Assets| VCDN
    RC -->|REST Requests| RL
    RL -->|Route Mapping| BE
    RC <-->|WebSocket Stateful Connection| WSS
    RC -->|Oauth Sign-In| FSDK
    FSDK <--> FBA

    BE -->|Query / Sync| MDB
    WSS -->|State / Read Write| MDB
    BE -->|verifyIdToken| FBA
    BE -->|Upload Avatar| CLD
    BE -->|Secure API Proxy| GEM
    BE -->|SMTP Mail OTP| SMTP
```

---

## 2. Dual-Authentication Architecture (Dual-Auth)

To offer optimal onboarding flexibility, URent supports a dual-authentication mechanism:
1. **Local Authentication**: Classic email-and-password sign-up with dynamic multi-phase email OTP validation.
2. **Google Authentication**: Seamless third-party authentication verified through the Google Firebase Client SDK, secure backend ID Token verification, and dynamic identity synchronization in MongoDB.

### Google Firebase Authentication Flow
The backend accepts Firebase ID tokens directly in the HTTP `Authorization: Bearer <Token>` header. A specialized `authGuard` middleware validates the token, maps it to a MongoDB account, and maps the execution user identity.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client App
    participant FBA as Firebase Auth (Google)
    participant BE as Express API Server
    participant FSDK as Firebase Admin SDK
    participant MDB as MongoDB Database

    User->>FBA: Trigger Google Sign-In
    FBA-->>User: Authenticate & Return Firebase ID Token
    User->>BE: GET /api/v1/auth/me (Header: Authorization Bearer <Firebase_ID_Token>)
    Note over BE: Intercepted by authGuard middleware
    BE->>FSDK: verifyIdToken(Firebase_ID_Token)
    FSDK-->>BE: Decoded Token (email, firebaseUid)
    BE->>BE: Execute resolveAppIdentity()
    BE->>MDB: Find user by email
    alt User exists
        MDB-->>BE: Return UserModel
    else User does not exist
        BE->>MDB: Create new User (displayName, email, role: 'user', authProvider: 'google')
        MDB-->>BE: Return new UserModel
    end
    BE->>BE: Assign req.user = { sub: mongoDbUserId, email: userEmail, role: 'user' }
    BE-->>User: HTTP 200 OK (User Profile Payload)
```

### Local Email/Password + OTP Verification Flow
1. **Registration**: `POST /api/auth/register` $\rightarrow$ Validates credentials $\rightarrow$ Generates an 6-digit numeric OTP code $\rightarrow$ Sends it to the email via Nodemailer SMTP.
2. **Validation**: `POST /api/auth/register/verify-otp` $\rightarrow$ Compares input OTP with database record $\rightarrow$ If valid, registers the account as verified and generates a custom, secure JWT token.
3. **Subsequent Calls**: Client caches the JWT token in local storage and includes it as `Authorization: Bearer <Local_JWT>` in the HTTP headers. The `authGuard` verifies this using `JWT_SECRET`.

---

## 3. Real-Time WebSocket Architecture

Real-time interactions (chats, message read badges, and order updates) are handled by a standard **Socket.IO** server.

### WebSocket Gateway Details
- **Unified Authentication**: The WebSocket connection handshake uses the exact same `authGuard` logic, extracting the token from `auth.token` or the standard `Authorization` headers. Invalid tokens result in an immediate `UNAUTHORIZED` connection error.
- **Room Separation**: Client sockets join specialized rooms separated by `conversationId`. This prevents message leakage and restricts communication to authorized chat participants only.
- **Client-to-Server Requests**:
  - `conversation.join` (payload: `{ conversationId }`): Validates participant access, joins the room, and registers the active listener.
  - `conversation.leave` (payload: `{ conversationId }`): Safely unsubscribes from the room updates.
- **Server-to-Client Broadcasts**:
  - `conversation.message.created`: Sent when a member sends a new text, location, or product message.
  - `conversation.read.updated`: Sent when a user marks the chat history as read, updating `unreadCount` badges in real time.

```mermaid
sequenceDiagram
    autonumber
    actor Client A as Client A (Renter)
    participant WSS as Socket.IO Server
    participant MDB as MongoDB Database
    actor Client B as Client B (Owner)

    Client A->>WSS: Connect + Send Auth Token
    Note over WSS: Authenticates Token via authGuard
    WSS-->>Client A: Connection Established
    Client A->>WSS: Emit "conversation.join" { conversationId: "room_123" }
    Note over WSS: Validates Room Access (Is A in room_123?)
    WSS-->>Client A: Room Joined successfully

    Note over Client A, Client B: Real-Time Chat Cycle
    Client A->>WSS: REST POST /api/v1/conversations/room_123/messages { content: "Hi" }
    WSS->>MDB: Save Message & Update Conversation lastMessageAt
    WSS->>WSS: Emit "conversation.message.created" inside room_123
    WSS-->>Client B: Receive Message "Hi" in real time
    Client B->>WSS: REST POST /api/v1/conversations/room_123/read
    WSS->>MDB: Update lastReadAt for Client B
    WSS->>WSS: Emit "conversation.read.updated" inside room_123
    WSS-->>Client A: Clear Unread Badge / Show Read Checkmark
```

---

## 4. AI Pricing & Valuation Engine (Gemini Proxy)

URent integrates a modern **Google Gemini 2.5 Flash** artificial intelligence model to help users automatically price their rental listings based on images.

### Pipeline Architecture

```text
  [Image File / URL]
          │
          ▼
   [React Canvas API] ──► Resizes to max 768px, converts to JPEG base64 (removes CORS & reduces payload)
          │
          ▼
  [Client App Service] ──► Fetch POST /api/urent-ai/analyze (includes base64 payload & auth token)
          │
          ▼
   [Express Server] ──► Intercepts, runs authGuard, hides GEMINI_API_KEY, forwards request to Gemini
          │
          ▼
  [Google Gemini API] ──► Vision models analyze image against strict JSON Schema (Structured Outputs)
          │
          ▼
   [Express Server] ──► Receives valid JSON Schema response, sends back standard 200 payload
          │
          ▼
  [Client App Service] ──► Validates structure, normalizes values, updates session cache, populates listing form
```

### Vision Prompts & Structured Outputs
To guarantee 100% structural reliability, URent utilizes Gemini **Structured Outputs**. The client service configures `responseMimeType: "application/json"` and submits a highly rigid `responseSchema` detailing the expected attributes.

#### Value Constraints & Mathematical Valuation:
1. **Base Valuation**: The model estimates the item's original/current market value ($V_{\text{market}}$) based on brand, model, and physical appearance.
2. **Suggested Daily Rental Rate**:
   - *Electronics/High-Tech*: $0.5\% - 1.5\%$ of $V_{\text{market}}$ per day.
   - *Fashion/Events/Camping*: $2\% - 5\%$ of $V_{\text{market}}$ per day.
3. **Recommended Security Deposit**: Calculated between $70\% - 100\%$ of $V_{\text{market}}$ to protect listing owners.
4. **Fuzzy Normalization**: Client services parse raw AI responses to map categories directly to URent’s core taxonomy ("Điện tử & Công nghệ", "Du lịch & Dã ngoại", "Đồ dùng học tập", "Thời trang & Đời sống").
5. **Session Caching**: Dynamic responses are hashed based on image names, sizes, or URLs and saved in `sessionStorage` to eliminate redundant, expensive API calls during form edits.
