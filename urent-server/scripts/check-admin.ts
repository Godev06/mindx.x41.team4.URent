import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "../src/models/user.model";

dotenv.config();

async function check() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
  if (!uri) {
    console.error("MONGO_URI or MONGO_URI_FALLBACK not set in environment!");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected successfully!");

  const ADMIN_ID = process.env.ADMIN_ID || "65b2be22287a930012fdf8aa";
  console.log(`Checking user with ID: ${ADMIN_ID}...`);
  const adminUser = await UserModel.findById(ADMIN_ID);
  if (adminUser) {
    console.log("Found default Admin User:", {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      displayName: adminUser.displayName,
    });
  } else {
    console.log(`NO user found with ID: ${ADMIN_ID}`);
  }

  console.log("Finding all users with role 'admin'...");
  const admins = await UserModel.find({ role: "admin" });
  console.log(`Found ${admins.length} admins:`);
  admins.forEach(u => {
    console.log(` - ID: ${u._id}, Email: ${u.email}, Name: ${u.displayName}`);
  });

  await mongoose.disconnect();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
