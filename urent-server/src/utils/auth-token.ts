import { verifyToken } from "./jwt";
import { env } from "../config/env";
import { admin, isFirebaseAdminInitialized } from "../config/firebase";

export type Role = "admin" | "user";

export interface AuthenticatedUser {
  sub: string;
  email: string;

  authProvider: "jwt" | "firebase";

  firebaseUid?: string;

  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;

  rawClaims?: any;

  role: Role;
}

const verifyFirebaseTokenAdmin = async (
  idToken: string,
): Promise<AuthenticatedUser> => {
  if (!isFirebaseAdminInitialized()) {
    throw new Error("FIREBASE_NOT_CONFIGURED");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    return {
      sub: decodedToken.uid,

      email:
        typeof decodedToken.email === "string"
          ? decodedToken.email.trim().toLowerCase()
          : "",

      authProvider: "firebase",

      firebaseUid: decodedToken.uid,

      displayName: decodedToken.name,

      avatarUrl: decodedToken.picture,

      phoneNumber: decodedToken.phone_number,

      rawClaims: decodedToken,

      role: "user",
    };
  } catch (error) {
    console.error("[Firebase] Token verification failed:", error);

    throw error;
  }
};

const decodeJwtHeader = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const verifyAccessToken = async (
  token: string,
): Promise<AuthenticatedUser> => {
  const header = decodeJwtHeader(token);

  if (header && header.alg === "HS256") {
    const payload = await verifyToken(token);

    return {
      sub: payload.sub,

      email: payload.email,

      authProvider: "jwt",

      role: payload.role ?? "user",
    };
  }

  return verifyFirebaseTokenAdmin(token);
};
