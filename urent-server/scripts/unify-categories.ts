/**
 * Script: unify-categories.ts
 * Mục đích: Thống nhất danh mục cho toàn bộ sản phẩm trong Database về 4 danh mục chuẩn:
 * 1. 'Điện tử & Công nghệ'
 * 2. 'Du lịch & Dã ngoại'
 * 3. 'Đồ dùng học tập'
 * 4. 'Thời trang & Đời sống'
 * 
 * Chạy: npm run unify:categories
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { ProductModel } from "../src/models/product.model";

dotenv.config();

const VALID_CATEGORIES = [
  "Điện tử & Công nghệ",
  "Du lịch & Dã ngoại",
  "Đồ dùng học tập",
  "Thời trang & Đời sống",
];

function normalizeCategory(rawCategory?: string): string {
  if (!rawCategory) return "Điện tử & Công nghệ";
  const normalized = rawCategory.toLowerCase().trim();

  if (
    normalized.includes("học tập") ||
    normalized.includes("sách") ||
    normalized.includes("giáo trình") ||
    normalized.includes("school") ||
    normalized.includes("book") ||
    normalized.includes("vở") ||
    normalized.includes("notebook")
  ) {
    return "Đồ dùng học tập";
  }
  if (
    normalized.includes("du lịch") ||
    normalized.includes("dã ngoại") ||
    normalized.includes("lều") ||
    normalized.includes("camping") ||
    normalized.includes("travel") ||
    normalized.includes("outdoor") ||
    normalized.includes("xe đạp") ||
    normalized.includes("bicycle")
  ) {
    return "Du lịch & Dã ngoại";
  }
  if (
    normalized.includes("thời trang") ||
    normalized.includes("đời sống") ||
    normalized.includes("quần áo") ||
    normalized.includes("đồng hồ") ||
    normalized.includes("fashion") ||
    normalized.includes("dress") ||
    normalized.includes("lifestyle") ||
    normalized.includes("clothes")
  ) {
    return "Thời trang & Đời sống";
  }
  if (
    normalized.includes("điện tử") ||
    normalized.includes("công nghệ") ||
    normalized.includes("laptop") ||
    normalized.includes("phone") ||
    normalized.includes("tech") ||
    normalized.includes("electronics") ||
    normalized.includes("máy tính") ||
    normalized.includes("máy ảnh") ||
    normalized.includes("camera") ||
    normalized.includes("loa") ||
    normalized.includes("speaker") ||
    normalized.includes("headphone") ||
    normalized.includes("tai nghe")
  ) {
    return "Điện tử & Công nghệ";
  }

  return "Điện tử & Công nghệ"; // Safe default
}

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
  if (!uri) {
    console.error("❌  MONGO_URI not set in .env");
    process.exit(1);
  }

  console.log("🔌  Đang kết nối MongoDB...");
  await mongoose.connect(uri);
  console.log("✅  Kết nối thành công!\n");

  console.log("🔍  Đang quét các sản phẩm trong cơ sở dữ liệu...");
  const products = await ProductModel.find({});
  console.log(`📊  Tìm thấy tổng cộng ${products.length} sản phẩm.`);

  let updatedCount = 0;
  let alreadyStandardCount = 0;

  for (const product of products) {
    const rawCategory = product.category || "";
    const isAlreadyValid = VALID_CATEGORIES.includes(rawCategory);

    if (isAlreadyValid) {
      alreadyStandardCount++;
      continue;
    }

    const standardized = normalizeCategory(rawCategory);
    console.log(
      `🔄  Chuẩn hóa sản phẩm "${product.name}":` +
      `\n    - Cũ: "${rawCategory}"` +
      `\n    - Mới: "${standardized}"`
    );

    product.category = standardized;
    await product.save();
    updatedCount++;
  }

  console.log("\n=== KẾT QUẢ THỐNG NHẤT DANH MỤC ===");
  console.log(`✅  Đã kiểm tra xong toàn bộ sản phẩm.`);
  console.log(`✨  Số sản phẩm đã chuẩn danh mục từ trước: ${alreadyStandardCount}`);
  console.log(`⚡  Số sản phẩm được cập nhật thành công: ${updatedCount}`);
  console.log("===================================\n");

  await mongoose.disconnect();
  console.log("🔌  Đã ngắt kết nối MongoDB.");
}

run().catch((err) => {
  console.error("❌  Lỗi khi chạy script thống nhất danh mục:", err);
  process.exit(1);
});
