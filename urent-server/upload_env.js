const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');

console.log('Bắt đầu tải các biến môi trường từ .env lên Cloudflare Workers...');

for (const line of lines) {
  const trimmed = line.trim();
  // Bỏ qua dòng trống và comment
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex === -1) continue;

  const key = trimmed.substring(0, separatorIndex).trim();
  let value = trimmed.substring(separatorIndex + 1).trim();
  
  // Loại bỏ nháy kép nếu có
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  // Khôi phục lại các ký tự xuống dòng (đặc biệt cho FIREBASE_PRIVATE_KEY)
  value = value.replace(/\\n/g, '\n');

  if (key) {
    console.log(`Đang tải biến: ${key} ...`);
    try {
      // Dùng input để tự động "gõ" giá trị vào khi wrangler hỏi "Enter a secret value"
      execSync(`npx wrangler secret put ${key}`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      console.log(`✅ Thành công: ${key}`);
    } catch (e) {
      console.error(`❌ Thất bại: ${key} (Có thể do lỗi mạng hoặc chưa login)`);
    }
  }
}

console.log('\\n🎉 HOÀN TẤT! Tất cả các biến môi trường đã được tải lên bảo mật!');
