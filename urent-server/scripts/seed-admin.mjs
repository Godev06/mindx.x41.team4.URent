// seed-admin.mjs — chạy trực tiếp bằng: node --env-file=.env scripts/seed-admin.mjs
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ADMIN_ID    = "65b2be22287a930012fdf8aa";
const ADMIN_EMAIL = "admin@urent.com";
const ADMIN_PASS  = "Admin@URent2024!";
const ADMIN_NAME  = "Quản trị viên URent";

const uri = process.env.MONGO_URI || process.env.MONGO_URI_FALLBACK;
if (!uri) { console.error("❌ MONGO_URI chưa được set"); process.exit(1); }

await mongoose.connect(uri);
console.log("✅ Kết nối MongoDB thành công");

// Định nghĩa schema tối giản (chỉ dùng trong script này)
const userSchema = new mongoose.Schema({
  email:           { type: String, required: true, unique: true, lowercase: true },
  password:        String,
  displayName:     String,
  role:            { type: String, enum: ["admin","user"], default: "user" },
  isEmailVerified: { type: Boolean, default: false },
  authProviders:   [String],
  trustScore:      { type: Number, default: 100 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Kiểm tra đã tồn tại chưa
const existing = await User.findById(ADMIN_ID).lean();
if (existing) {
  console.log("ℹ️  Admin đã tồn tại:", { id: existing._id, email: existing.email, role: existing.role });
  await mongoose.disconnect();
  process.exit(0);
}

// Kiểm tra email đã dùng bởi doc khác
const byEmail = await User.findOne({ email: ADMIN_EMAIL }).lean();
if (byEmail) {
  await User.findByIdAndUpdate(byEmail._id, { $set: { role: "admin", displayName: ADMIN_NAME, isEmailVerified: true } });
  console.log("✅ Đã cập nhật role→admin cho email", ADMIN_EMAIL, "| ID:", byEmail._id);
  await mongoose.disconnect();
  process.exit(0);
}

const hash = await bcrypt.hash(ADMIN_PASS, 12);
const admin = await User.create({
  _id: new mongoose.Types.ObjectId(ADMIN_ID),
  email: ADMIN_EMAIL,
  password: hash,
  displayName: ADMIN_NAME,
  role: "admin",
  isEmailVerified: true,
  authProviders: ["local"],
  trustScore: 100,
});

console.log("🎉 Tạo System Admin thành công!");
console.log("   ID      :", String(admin._id));
console.log("   Email   :", admin.email);
console.log("   Password:", ADMIN_PASS, " ← đổi sau khi đăng nhập!");
console.log("   Role    :", admin.role);

await mongoose.disconnect();
console.log("🔌 Đã ngắt kết nối.");
