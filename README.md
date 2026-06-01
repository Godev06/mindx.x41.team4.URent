# 🚀 URent - Multi-Purpose Rental Ecosystem

[![React Version](https://img.shields.io/badge/React-19.2-00D8FF?logo=react&logoColor=white)](https://react.dev)
[![Vite Version](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS Version](https://img.shields.io/badge/TailwindCSS-4.2-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express Version](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Mongoose Version](https://img.shields.io/badge/Mongoose-8.18-800000?logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![Socket.io Version](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io)
[![Firebase Admin](https://img.shields.io/badge/Firebase_Admin-13.10-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com)
[![Google Gemini API](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)

Welcome to the **URent** ecosystem, an enterprise-grade multi-purpose rental platform designed for listing, renting, and tracking assets—from consumer electronics and camping gear to event spaces and transportation. 

URent integrates modern technologies including Google Firebase dual-authentication, stateful real-time chat, dynamic Google Maps geospatial discovery, and a secure Google Gemini-driven asset valuation engine.

---

## 📖 Centralized Documentation Hub

To onboard developers, support operations, and guide architects, the project's technical documentation is unified under the root `/docs` directory:

```text
mindx.x41.team4.URent/
└── docs/
    ├── onboarding-development.md   # 30-minute quickstart, file mappings, standards, & Git Flow
    ├── system-architecture.md      # Dual-Auth sequence, Websocket gateway, and AI Vision pipelines
    ├── api-specification.md        # Comprehensive REST endpoints and real-time Socket.IO schemas
    ├── database-schema.md          # MongoDB NoSQL structure, index strategies, and Mongoose definitions
    ├── deployment-operation.md     # Env variables checklist, serverless routing, and VPS hosting
    ├── ROADMAP_4_SPRINTS.md        # Comprehensive 4-Sprint Agile development plan & deliverables
    ├── SUMMARY_FUTURE_OUTLOOK.md   # Architectural accomplishments & high-level roadmap summary
    └── FUTURE_ORIENTATION.md       # Strategic long-term vision, next-gen tech (AI eKYC, TrustScore), & monetization
```

---

## 🛠 Technology Stack

### Frontend Client (`urent-client`)
- **Core Engine**: React 19 (Concurrent Mode ready)
- **Asset Bundler**: Vite 6 (ultra-fast compilation pipeline)
- **Styling Architecture**: TailwindCSS v4 with custom system properties and modern dark mode support
- **Client Routing**: React Router v7 (clean, robust route declarations)
- **HTTP Client**: Axios with centralized interception layers (automatic token injections & session expires)
- **Third-Party Services**: Google Maps API (geospatial mapping) & Firebase Web SDK (OAuth verification)

### Backend Server (`urent-server`)
- **Runtime Environment**: Node.js 20+ (ES Modules compilation via `tsx`)
- **Server Framework**: Express 5 (TypeScript declarations and async routing improvements)
- **Database ODM**: Mongoose 8 (flexible schema typing, indexes, and automated timestamps)
- **Real-Time Layer**: Socket.IO 4 (secure WebSocket upgrade channels and namespaces)
- **Cloud Media Storage**: Cloudinary (profile avatar uploads and product photography storage)
- **Email Service**: Nodemailer (SMTP dispatcher for email verification OTP codes)
- **Authentication**: JWT verification coupled with Firebase Admin SDK for hybrid credential parsing
- **Security Utilities**: BcryptJS, Zod input validation schemas, and `express-rate-limit`

---

## 🚀 One-Command Quickstart

URent utilizes **npm workspaces** to orchestrate monorepo workflows without manually navigating sub-directories.

### 1. Configure Environments
- Duplicate `urent-client/.env.example` into `urent-client/.env` and update values.
- Duplicate `urent-server/.env.example` into `urent-server/.env` and update values.

### 2. Install and Run
From the root repository directory:
```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Boot up both client and server in dev concurrently
npm run dev
```

The system will automatically bind to the default local port mappings:
- **Frontend Client**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:5003/api/v1](http://localhost:5003/api/v1)
- **Swagger Documentation**: [http://localhost:5003/api-docs](http://localhost:5003/api-docs)

---

## 💎 Primary Feature Modules

### 1. Secure Authentication Flow (Dual-Auth)
- **OAuth Google Sign-In**: Authenticates natively via Firebase, submits ID Tokens, and handles MongoDB user mapping.
- **Local OTP System**: Custom registration with SMTP 6-digit verification code delivery and session-controlled JWT generation.

### 2. AI Pricing Vision Engine
- **Structured Image Analysis**: Uses Google Gemini 2.5 Flash to automatically detect brand, model, and physical condition.
- **Pricing Optimization**: Returns optimal daily pricing bounds and safety deposits.
- **Client Compression & Caching**: Processes image resizing using Canvas (JPEG, max 768px) and implements persistent session caches.

### 3. Stateful Real-Time Communication
- **Instant Messaging**: Chat with listing owners via WebSockets.
- **Dynamic Indicators**: Real-time read status updates and message count badges.
- **Rich Message Metadata**: Seamlessly send text, map locations, or product cards.

### 4. Geospatial Discovery
- **Map Visualizations**: Discover products near you with Google Maps markers.
- **2dsphere Query Optimizations**: Utilizes MongoDB's geospatial indices to calculate physical product proximity.
