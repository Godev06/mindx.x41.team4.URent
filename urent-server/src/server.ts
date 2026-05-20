import 'dotenv/config';
import dns from 'node:dns';
import { app } from './app';
import { connectDb } from './config/db';
import { initializeFirebase } from './config/firebase';

// Định hướng IPv4 để tránh treo Firebase trên Node 20+
dns.setDefaultResultOrder('ipv4first');

// Biến cờ hiệu để kiểm tra trạng thái khởi tạo kết nối
let isInitialized = false;

const initializeServerless = async () => {
  if (!isInitialized) {
    try {
      // Khởi tạo các dịch vụ bên thứ ba ngắn hạn
      initializeFirebase();
      
      // Kết nối Database (Hãy đảm bảo hàm connectDb của bạn có cơ chế check 
      // mongoose.connection.readyState để tránh kết nối trùng lặp)
      await connectDb();
      
      isInitialized = true;
    } catch (error) {
      console.error('Lỗi khi khởi tạo Services trên Vercel:', error);
    }
  }
};

// Middleware chặn mọi request để đảm bảo DB và Firebase đã được kết nối trước khi chạy API
app.use(async (req, res, next) => {
  await initializeServerless();
  next();
});

// Xuất bản app để Vercel tự động map routing thành Serverless Function
export default app;