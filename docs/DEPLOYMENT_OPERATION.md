# 🚀 Deployment, Operations & Environment Setup

This document serves as the operational guide for deploying, configuring, and maintaining the **URent** ecosystem across local development and production environments.

---

## 1. Environment Variable Configuration

Both the client and server projects require specific environment variables to interact with databases, external APIs, and security providers.

### 1.1 Frontend Environment (`urent-client/.env`)
Vite requires client variables to be prefixed with `VITE_` to be exposed to the browser application.

| Variable Name | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:5003` | Core API server address. |
| `VITE_FIREBASE_API_KEY` | Yes | `AIzaSyBBpQzt...` | Firebase Project Web API Key. |
| `VITE_FIREBASE_AUTH_DOMAIN`| Yes | `urent-x41.firebaseapp.com`| Auth domain from Firebase console. |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `urent-x41` | Firebase Project identifier. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Yes| `urent-x41.firebasestorage.app`| Cloud storage bucket name. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Yes| `558317520080`| Firebase cloud messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Yes | `1:558317520080:web:...` | Firebase Web App Identifier. |
| `VITE_FIREBASE_MEASUREMENT_ID`| No | `G-CSWTYMGVF3` | Google Analytics measurements ID. |
| `VITE_RECAPTCHA_ENTERPRISE_KEY`| No | `your-site-key-here` | reCAPTCHA Site Key for App Check. |
| `VITE_APPCHECK_DEBUG_TOKEN`| No | `your-debug-token-here` | Debug token for local App Check testing. |

---

### 1.2 Backend Environment (`urent-server/.env`)
These variables must be kept secure. **Never commit the `.env` file to source control.**

| Variable Name | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| **Server & Node** | | | |
| `PORT` | No | `5003` | Port where the server binds locally. |
| `NODE_ENV` | Yes | `development` | Environment mode (`development`, `production`). |
| **MongoDB Configuration**| | | |
| `MONGO_URI` | Yes | `mongodb+srv://...` | Primary MongoDB Atlas connection string. |
| `MONGO_URI_FALLBACK` | No | `mongodb://localhost:27017/urent`| Connection string fallback in case of DNS lookups fail. |
| `DNS_SERVERS` | No | `1.1.1.1,8.8.8.8` | Custom DNS servers to resolve MongoDB SRV. |
| **Authorization Tokens** | | | |
| `JWT_SECRET` | Yes | `your-secure-secret-key` | Secret key signing internal JWT tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Access token lifespan. |
| `OTP_EXPIRES_MINUTES` | No | `10` | Email OTP expiration countdown. |
| `RESET_TOKEN_EXPIRES_MINUTES`| No| `15` | Password reset link timeout limit. |
| **CORS Access Limits** | | | |
| `CLIENT_URLS` | Yes | `http://localhost:5173` | Comma-separated list of whitelisted client domains. |
| **SMTP Mail Server** | | | |
| `SMTP_HOST` | Yes | `smtp.gmail.com` | SMTP Host for OTP email dispatches. |
| `SMTP_PORT` | Yes | `587` | SMTP Server Port. |
| `SMTP_SECURE` | Yes | `false` | Enable TLS (`true`/`false`). |
| `SMTP_USER` | Yes | `your-email@gmail.com` | Email account to dispatch messages. |
| `SMTP_PASS` | Yes | `app-specific-password` | App password (e.g. Gmail App Password). |
| `EMAIL_FROM` | Yes | `URent <noreply@urent.com>`| Sender signature block. |
| **Cloudinary File CDN** | | | |
| `CLOUDINARY_CLOUD_NAME` | Yes | `urent-cloud` | Cloudinary Account Name. |
| `CLOUDINARY_API_KEY` | Yes | `123456789` | Cloudinary Access API Key. |
| `CLOUDINARY_API_SECRET` | Yes | `secureSecret...` | Cloudinary Private Secret. |
| **Firebase Admin Credentials**| | | |
| `FIREBASE_PROJECT_ID` | Yes | `urent-x41` | Project ID (Inline Credential Option). |
| `FIREBASE_CLIENT_EMAIL` | Yes | `firebase-adminsdk...` | Admin SDK email account. |
| `FIREBASE_PRIVATE_KEY` | Yes | `"-----BEGIN PRIVATE KEY-----\n..."`| Private security key string. |
| `FIREBASE_SERVICE_ACCOUNT_PATH`| No| `./serviceAccountKey.json` | Path to JSON key file (Alternative Option). |
| **Gemini AI Configuration**| | | |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` | API Key for secure proxy vision requests. |

---

## 2. Local Monorepo Operations

The repository leverages **npm workspaces** to orchestrate monorepo execution from the root folder without needing to manually step into sub-directories.

### Complete CLI Command Reference

#### 1. Launch All Services Concurrently
Runs the React developer server and the Node/Express server simultaneously, outputting prefix-colored outputs in a single terminal session:
```bash
npm run dev
```

#### 2. Test Core Compilations
Validates TypeScript compilation typechecks across frontend and backend workspaces:
```bash
npm run check
```

#### 3. Lint Code Quality
Checks frontend Javascript/TypeScript standards matching ESLint definitions:
```bash
npm run lint --prefix urent-client
```

#### 4. Run Server Maintenance Tasks
- **Check Admin Registrations**: Check user details inside database records:
  ```bash
  npm run dev:once --prefix urent-server
  ```
- **Sync Vercel Environments**: Automatically push local `.env` values up to Vercel configuration maps:
  ```bash
  npm run env:vercel
  ```

---

## 3. Production Deployment Guide

URent is built with compatibility for modern serverless and containerized deployment paths.

### 3.1 Frontend Web Deployment (Vercel)
The React SPA is optimized to deploy directly to the Vercel Edge Network:
1. **Framework Preset**: Choose `Vite`.
2. **Build Command**: `npm run build` (runs `tsc -b && vite build` within workspaces).
3. **Output Directory**: `dist`.
4. **Clean URLs & Routes fallback**: Handled by `urent-client/vercel.json` routing redirects to `index.html` to allow React Router to manage paths dynamically.

---

### 3.2 Backend Server Deployment (Vercel Serverless vs. Dedicated Host)

URent's server package includes multi-environment boot routines depending on the hosting target.

```mermaid
graph TD
    %% Source
    Req[Incoming Client Request] --> Balancer{Router / Load Balancer}

    %% Vercel Path
    Balancer -->|Vercel Hosting| VPath[Vercel Serverless Functions]
    VPath -->|Lazy DB Connection| DB1[(MongoDB Atlas)]
    VPath -.->|Bypassed| WSNo[Socket.IO WS Fails - Stateless Restrictions]

    %% Dedicated VPS Path
    Balancer -->|VPS / Docker Hosting| VPSPath[Stateful Node.js App]
    VPSPath -->|Stateful Websockets Upgrade| WSSok[Socket.IO WS Active]
    VPSPath -->|Persistent DB Connection| DB2[(MongoDB Atlas)]
```

#### Option A: Serverless Functions (Vercel)
The Express API compiles as Vercel Serverless Functions based on `urent-server/vercel.json`.
- **Performance Optimization (Lazy MongoDB Loader)**:
  Serverless systems spin down to zero. Cold starts can introduce lag if the function connects to MongoDB during the initial request block.
  URent solves this in `urent-server/src/app.ts` via a **Lazy Database Connector** middleware:
  ```typescript
  app.use(async (_req, _res, next) => {
    try {
      await connectDB(); // Establishes connections on-demand, caching active pools
      next();
    } catch {
      next(new Error("Unable to connect to the database."));
    }
  });
  ```
- **WebSocket Limitation Warning**:
  > [!WARNING]
  > **WebSockets are stateful and persistent.** Vercel Serverless functions execute within short execution timeouts and shut down. Therefore, **Socket.IO connections will fail** or repeatedly disconnect in a pure Vercel serverless environment.

#### Option B: Stateful Platform (Recommended for Real-Time Features)
To leverage the real-time chat, notifications, and location tracking features, deploy `urent-server` to a stateful VM (DigitalOcean Droplet, AWS EC2, or container host like Fly.io or Render):
1. **Docker Containerization**: Packages the Node.js runtime environment using the base `build/server.js` startup bundle.
2. **Nginx Reverse Proxy Configuration**:
   Ensure your reverse proxy upgrades HTTP headers to support WebSockets. Below is the mandatory Nginx virtual host mapping:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5003;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 4. Administrative Maintenance Scripts

URent provides CLI command scripts inside `urent-server/scripts/` to execute key maintenance operations:

### 4.1 Seed System Administrator (`npm run seed:admin`)
Queries if the user account associated with the default admin configurations exists in MongoDB, seeds the account with high-trust access scores if absent, and marks the user's role securely as `admin`.
- **Run Command**:
  ```bash
  npm run seed:admin --prefix urent-server
  ```

### 4.2 Unify Product Taxonomy (`npm run unify:categories`)
Normalizes database records to prevent categorization fragmentation. It queries all entries inside `ProductModel` and maps inconsistent strings (e.g. `tech`, `electronic`, `máy tính`) directly to standard categories.
- **Run Command**:
  ```bash
  npm run unify:categories --prefix urent-server
  ```

### 4.3 Automated API Health Checker (`api-health-check.ts`)
A service utility running automated pings against routing health definitions, validating API response times and verifying database connections.
- **Execution CLI**:
  ```bash
  npx tsx urent-server/scripts/api-health-check.ts
  ```
