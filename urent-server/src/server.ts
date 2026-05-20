import 'dotenv/config';
import dns from 'node:dns';
import { app } from './app';
import { connectDb } from './config/db';
import { initializeFirebase } from './config/firebase';

// 1. Khởi chạy cấu hình đồng bộ ngay lập tức ở tầng Top-level toàn cục
dns.setDefaultResultOrder('ipv4first');
initializeFirebase();

// 2. Sử dụng Promise để lưu trữ trạng thái kết nối Database (Connection Pooling)
let dbConnectionPromise: Promise<void> | null = null;

const getDatabaseConnection = (): Promise<void> => {
  // Nếu đã có Promise kết nối đang chạy hoặc đã chạy xong, dùng lại nó luôn
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDb().catch((error) => {
      // Nếu lỗi, xóa Promise cũ để request tiếp theo có thể thử kết nối lại
      dbConnectionPromise = null;
      console.error('❌ Lỗi kết nối Database trên Serverless:', error);
      throw error;
    });
  }
  return dbConnectionPromise;
};

// 3. Middleware tối ưu hóa: Chỉ await khi thực sự cần tương tác với Database
app.use(async (req, res, next) => {
  try {
    await getDatabaseConnection();
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Không thể kết nối đến cơ sở dữ liệu.' 
    });
  }
});

export default app;