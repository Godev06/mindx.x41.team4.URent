import { env } from "../config/env";

export type Role = "admin" | "user";
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

function getSecret(): string {
  return env.jwtSecret || process.env.JWT_SECRET || "fallback-dev-secret";
}

function base64urlEncode(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 86400;
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return parseInt(match[1], 10) * multipliers[match[2]];
}

export const signToken = async (payload: JwtPayload): Promise<string> => {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpiry(env.jwtExpiresIn || "1d");

  const header = { alg: "HS256", typ: "JWT" };
  const claims = { ...payload, iat: now, exp: now + expiresIn };

  const enc = new TextEncoder();
  const encodedHeader = base64urlEncode(enc.encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(enc.encode(JSON.stringify(claims)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(signingInput),
  );

  return `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`;
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const secret = getSecret();

  const key = await getHmacKey(secret);
  const signatureBytes = new Uint8Array(base64urlDecode(encodedSignature));
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(signingInput),
  );

  if (!isValid) throw new Error("Invalid JWT signature");

  const claims = JSON.parse(
    new TextDecoder().decode(base64urlDecode(encodedPayload)),
  );
  const now = Math.floor(Date.now() / 1000);

  if (claims.exp && claims.exp < now) throw new Error("JWT expired");
  if (
    typeof claims.sub !== "string" ||
    typeof claims.email !== "string" ||
    typeof claims.role !== "string"
  ) {
    throw new Error("Invalid JWT payload");
  }

  return {
    sub: claims.sub,
    email: claims.email,
    role: claims.role,
  };
};
