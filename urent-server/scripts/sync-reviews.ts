/**
 * Script: sync-reviews.ts
 * Mục đích: Quét toàn bộ sản phẩm trong DB, đếm số đánh giá thực tế trong collection 'reviews'
 * và cập nhật chính xác 'reviewsCount' và 'rating' cho từng sản phẩm.
 * 
 * Chạy: npm run db:sync-reviews (ở thư mục urent-server)
 * hoặc: npx tsx scripts/sync-reviews.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { ProductModel } from "../src/models/product.model";
import { ReviewModel } from "../src/models/review.model";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
  if (!uri) {
    console.error("❌  MONGO_URI not set in .env");
    process.exit(1);
  }

  console.log("🔌  Đang kết nối MongoDB...");
  await mongoose.connect(uri);
  console.log("✅  Kết nối thành công!\n");

  const products = await ProductModel.find({});
  console.log(`🔍  Tìm thấy ${products.length} sản phẩm. Đang bắt đầu đồng bộ đánh giá...`);

  let updatedCount = 0;

  for (const product of products) {
    // Lấy tất cả đánh giá thực tế của sản phẩm từ collection 'reviews'
    const reviews = await ReviewModel.find({ productId: product._id });
    const actualReviewsCount = reviews.length;
    
    let actualAverageRating = 0;
    if (actualReviewsCount > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      actualAverageRating = Number((sum / actualReviewsCount).toFixed(1));
    }

    // Kiểm tra xem có sự lệch dữ liệu không
    const isMismatch = 
      product.reviewsCount !== actualReviewsCount || 
      product.rating !== actualAverageRating;

    if (isMismatch) {
      console.log(
        `🔄  Phát hiện lệch dữ liệu cho sản phẩm "${product.name}":` +
        `\n    - Cũ: Rating = ${product.rating}, Reviews = ${product.reviewsCount}` +
        `\n    - Thực tế: Rating = ${actualAverageRating}, Reviews = ${actualReviewsCount}`
      );

      product.reviewsCount = actualReviewsCount;
      product.rating = actualAverageRating;
      await product.save();
      updatedCount++;
    }
  }

  console.log("\n=== KẾT QUẢ ĐỒNG BỘ ĐÁNH GIÁ ===");
  console.log(`✅  Đã rà soát xong toàn bộ ${products.length} sản phẩm.`);
  console.log(`✨  Số sản phẩm đã chuẩn dữ liệu từ trước: ${products.length - updatedCount}`);
  console.log(`⚡  Số sản phẩm lệch dữ liệu được cập nhật thành công: ${updatedCount}`);
  console.log("================================\n");

  await mongoose.disconnect();
  console.log("🔌  Đã ngắt kết nối MongoDB.");
}

run().catch((err) => {
  console.error("❌  Lỗi khi chạy script đồng bộ đánh giá:", err);
  process.exit(1);
});
