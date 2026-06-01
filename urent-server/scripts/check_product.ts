import mongoose from "mongoose";
import dotenv from "dotenv";
import { ProductModel } from "../src/models/product.model";
import { ReviewModel } from "../src/models/review.model";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to DB");

  // Search for the product
  const product = await ProductModel.findOne({ name: /Bàn xếp nhóm/i }).lean();
  console.log("=== PRODUCT IN DB ===");
  console.log(JSON.stringify(product, null, 2));

  if (product) {
    const reviews = await ReviewModel.find({ productId: product._id }).lean();
    console.log("=== REVIEWS IN DB ===");
    console.log(JSON.stringify(reviews, null, 2));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
