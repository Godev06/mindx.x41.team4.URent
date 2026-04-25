# Firebase Authentication with Node.js Backend (URent)

This project now supports both:

- Existing backend JWT tokens (email/password + OTP flow)
- Firebase ID tokens (verified on backend with Firebase Admin SDK)

## 1. Authentication Flow

1. Frontend signs in user with Firebase Auth SDK.
2. Frontend sends Firebase ID token in `Authorization: Bearer <token>`.
3. Backend verifies token:

- First tries local JWT verification.
- If JWT verification fails, tries Firebase Admin `verifyIdToken`.

4. For Firebase users, backend resolves/creates a local `User` record by email and maps request identity to local Mongo `_id`.
5. Protected APIs continue to work with existing `req.user.sub` logic.

## 2. Files Added/Updated

### Backend

- `src/config/firebase.ts`: Firebase Admin initialization via env.
- `src/utils/auth-token.ts`: unified token verification (JWT + Firebase).
- `src/services/auth-identity.service.ts`: map Firebase identity to local app user.
- `src/middlewares/auth.middleware.ts`: async guard using unified verifier.
- `src/realtime/socket.ts`: socket auth uses same verifier + identity mapping.
- `src/server.ts`: calls `initializeFirebase()` on startup.
- `src/controllers/auth.controller.ts`: `getMe` has Firebase-safe fallback.
- `.env.example`: includes Firebase Admin env options.

### Frontend

- `src/lib/api/apiClient.ts`: request interceptor now refreshes Firebase token from `auth.currentUser` when present.
- `.env.example`: includes Firebase web SDK variables.

## 3. Frontend Setup

### 3.1 Configure env

In `urent-client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5003
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3.2 Firebase init (already available)

`src/lib/firebase.ts` already initializes Firebase app and exports `auth`.

### 3.3 Example Google Sign-In component

```tsx
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { apiClient } from "../../lib/api/apiClient";

export function FirebaseLoginDemo() {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    // Optional: immediate test against protected backend route
    const me = await apiClient.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    console.log("Signed in user:", me.data);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div>
      <button onClick={handleSignIn}>Sign in with Google</button>
      <button onClick={handleSignOut}>Sign out</button>
    </div>
  );
}
```

Note:

- You normally do not need to manually set the `Authorization` header because `apiClient` now auto-attaches token.
- The explicit header above is only for quick testing.

## 4. Backend Setup

### 4.1 Configure env

In `urent-server/.env`, choose one option:

Option A: Service account file path

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

Option B: Inline credentials

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Important:

- Keep service account secrets out of git.
- Add `serviceAccountKey.json` to `.gitignore`.

### 4.2 Start backend

```bash
cd urent-server
npm run dev
```

## 5. Security Notes

- Use HTTPS in production.
- Restrict CORS to trusted frontend domains.
- Handle expired token errors (`auth/id-token-expired`) on client by re-authenticating user.
- Verification is authentication only; implement authorization checks (roles/claims/resource ownership) per route.

## 6. Validation Checklist

- Firebase login succeeds on frontend.
- Request to `/api/auth/me` returns 200 with user data.
- Protected routes under `/api/v1/*` accept Firebase bearer token.
- Existing JWT login flow still works unchanged.
