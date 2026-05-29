/**
 * Script: seed-admin.ts
 * Mục đích: Tạo lại tài khoản System Admin nếu chưa tồn tại trong DB.
 * Chạy: npx tsx scripts/seed-admin.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { UserModel } from "../src/models/user.model";

dotenv.config();

// ── Thông tin Admin ──────────────────────────────────────────────────────────
const ADMIN_ID   = "65b2be22287a930012fdf8aa"; // ID cứng trong admin.ts
const ADMIN_EMAIL = "admin@urent.com";
const ADMIN_PASSWORD = "Admin@URent2024!";      // Đổi sau khi seed xong
const ADMIN_NAME  = "Quản trị viên URent";

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
  if (!uri) {
    console.error("❌  MONGO_URI not set in .env");
    process.exit(1);
  }

  console.log("🔌  Đang kết nối MongoDB...");
  await mongoose.connect(uri);
  console.log("✅  Kết nối thành công!\n");

  // Kiểm tra đã tồn tại chưa
  const exists = await UserModel.findById(ADMIN_ID).lean();
  if (exists) {
    console.log("ℹ️   Tài khoản Admin đã tồn tại:");
    console.log(`    ID    : ${exists._id}`);
    console.log(`    Email : ${exists.email}`);
    console.log(`    Role  : ${exists.role}`);
    await mongoose.disconnect();
    return;
  }

  // Kiểm tra email đã dùng chưa
  const emailTaken = await UserModel.findOne({ email: ADMIN_EMAIL }).lean();
  if (emailTaken) {
    console.log(`⚠️   Email "${ADMIN_EMAIL}" đã được dùng bởi ID: ${emailTaken._id}`);
    console.log("    Đang cập nhật role thành admin và đổi ID...");
    await UserModel.findByIdAndUpdate(emailTaken._id, {
      $set: {
        role: "admin",
        displayName: ADMIN_NAME,
        isEmailVerified: true,
      },
    });
    console.log("✅  Đã cập nhật thành công (ID không đổi, role → admin).");
    await mongoose.disconnect();
    return;
  }

  // Hash mật khẩu
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Tạo admin với _id cố định
  const admin = await UserModel.create({
    _id: new mongoose.Types.ObjectId(ADMIN_ID),
    email: ADMIN_EMAIL,
    password: hashedPassword,
    displayName: ADMIN_NAME,
    role: "admin",
    isEmailVerified: true,
    authProviders: ["local"],
    trustScore: 100,
  });

  console.log("🎉  Tạo System Admin thành công!");
  console.log(`    ID       : ${admin._id}`);
  console.log(`    Email    : ${admin.email}`);
  console.log(`    Password : ${ADMIN_PASSWORD}  ← Đổi ngay sau khi đăng nhập!`);
  console.log(`    Role     : ${admin.role}`);

  await mongoose.disconnect();
  console.log("\n🔌  Đã ngắt kết nối MongoDB.");
}

seed().catch((err) => {
  console.error("❌  Lỗi khi seed admin:", err);
  process.exit(1);
});
