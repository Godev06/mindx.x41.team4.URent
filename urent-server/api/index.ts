import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Thử nghiệm xem API có phản hồi không
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Cầu nối URent API trên Vercel hoạt động hoàn hảo!",
        timestamp: new Date().toISOString()
    });
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: "Endpoint /api hoạt động bình thường"
    });
});

// B bẫy lỗi 404 trực tiếp
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Đường dẫn [${req.method}] ${req.originalUrl} chưa được cấu hình.`
    });
});

// BẮT BUỘC: Viết dòng này bằng chữ thường hoàn toàn
export default app;