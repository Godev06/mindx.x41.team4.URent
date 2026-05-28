import mongoose from "mongoose";
import { UserModel } from "../models/user.model";

/**
 * Retrieves the unified system administrator user ID.
 * Respects env.ADMIN_ID and env.SYSTEM_ADMIN_ID, and falls back to:
 * 1. The first administrator found in the database.
 * 2. A fallback default safe ID.
 */
export async function getSystemAdminId(): Promise<string> {
  const envAdminId = process.env.ADMIN_ID || process.env.SYSTEM_ADMIN_ID || "65b2be22287a930012fdf8aa";
  
  if (mongoose.Types.ObjectId.isValid(envAdminId)) {
    const exists = await UserModel.exists({ _id: envAdminId });
    if (exists) {
      return envAdminId;
    }
  }

  // Fallback: search for any user with the admin role in database
  const activeAdmin = await UserModel.findOne({ role: "admin" }).select("_id").lean();
  if (activeAdmin) {
    return String(activeAdmin._id);
  }

  // Final fallback constant
  return "65b2be22287a930012fdf8aa";
}
