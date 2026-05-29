import mongoose from "mongoose";
import { UserModel } from "../models/user.model";

/** Tên hiển thị mặc định của tài khoản System Admin */
export const SYSTEM_ADMIN_DISPLAY_NAME = "Quản trị viên URent";
export const SYSTEM_ADMIN_AVATAR_URL: string | null = null;
export const SYSTEM_ADMIN_ID_CONSTANT = "000000000000000000000001";
export const SYSTEM_ADMIN_EMAIL = "contact.urent.vn@gmail.com";

/**
 * Trả về ID của admin đầu tiên tìm thấy trong DB.
 * Nếu không có admin nào → trả về null.
 */
export async function getSystemAdminId(): Promise<string | null> {
  const admin = await getSystemAdmin();
  return admin ? admin.id : null;
}

/**
 * Trả về thông tin của admin đầu tiên tìm thấy trong DB.
 * Không phụ thuộc vào ID cứng — bất kỳ user có role "admin" đều là System Admin.
 * Nếu không tìm thấy admin nào → tự động tạo một tài khoản System Admin chuyên dụng để tránh lỗi thiếu dữ liệu.
 */
export async function getSystemAdmin(): Promise<{
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
} | null> {
  let admin = await UserModel.findOne({ role: "admin" })
    .select("_id displayName avatarUrl email")
    .lean();

  if (!admin) {
    try {
      console.log("[SystemAdmin] Không tìm thấy tài khoản Admin nào. Tự động khởi tạo tài khoản System Admin chuyên dụng...");
      const newAdmin = await UserModel.findOneAndUpdate(
        { email: SYSTEM_ADMIN_EMAIL },
        {
          $setOnInsert: {
            _id: new mongoose.Types.ObjectId(SYSTEM_ADMIN_ID_CONSTANT),
            username: "AdminSystem",
            displayName: SYSTEM_ADMIN_DISPLAY_NAME,
            role: "admin",
            isEmailVerified: true,
            trustScore: 100,
          }
        },
        { upsert: true, new: true, lean: true }
      );
      admin = newAdmin;
    } catch (error) {
      console.error("[SystemAdmin] Lỗi tự động khởi tạo tài khoản System Admin:", error);
    }
  }

  if (!admin) return null;

  return {
    id: String(admin._id),
    displayName: admin.displayName ?? SYSTEM_ADMIN_DISPLAY_NAME,
    avatarUrl: admin.avatarUrl ?? SYSTEM_ADMIN_AVATAR_URL,
    email: admin.email || SYSTEM_ADMIN_EMAIL,
  };
}
