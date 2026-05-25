import { connectDb } from "./db";
import { env } from "./env";

let dbConnectionPromise: Promise<void> | null = null;

const safeUri = (uri: string) => {
  if (!uri) return "";
  const trimmed = uri.trim();
  // Keep only scheme+host part roughly; hide credentials and long parts.
  return trimmed.replace(/:\/\/.+?@/, "://***@").slice(0, 80);
};

/**
 * Shared lazy MongoDB connection promise.
 * Ensures HTTP and WebSocket handlers reuse the same mongoose connection lifecycle.
 */
export const connectDB = async (): Promise<void> => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDb().catch((error) => {
      dbConnectionPromise = null;

      console.error("❌ MongoDB connection failed (lazy singleton):", {
        name: error instanceof Error ? error.name : undefined,
        message: error instanceof Error ? error.message : error,
        code: (error as any)?.code,
        syscall: (error as any)?.syscall,
        mongoUri: safeUri(env.mongoUri),
        mongoUriFallback: safeUri(env.mongoUriFallback),
      });

      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      throw error;
    });
  }

  return dbConnectionPromise;
};
