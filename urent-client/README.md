# 🚀 URent - Nền tảng Cho thuê Đa năng

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.2-38B2AC.svg)](https://tailwindcss.com/)

**URent Client** là giao diện người dùng hiện đại, hiệu năng cao cho hệ sinh thái cho thuê URent. Dự án được xây dựng với mục tiêu mang lại trải nghiệm thuê đồ mượt mà, tin cậy và chuyên nghiệp.

---

## 📌 Tổng quan dự án (Dành cho Leader & Stakeholders)

Dự án URent tập trung vào việc giải quyết nhu cầu thuê và cho thuê đồ dùng (điện tử, máy ảnh, thiết bị sự kiện...) một cách an toàn và nhanh chóng.

### Tầm nhìn kỹ thuật:
- **Scalability**: Kiến trúc dựa trên tính năng (Feature-based Architecture) giúp dễ dàng mở rộng và bảo trì.
- **Security**: Hệ thống xác thực OTP 2 lớp (Auth OTP) đảm bảo an toàn tài khoản.
- **Performance**: Sử dụng Vite 6 và React 19 để tối ưu thời gian phản hồi và render.
- **Experience**: UI/UX được chau chuốt với TailwindCSS 4, hỗ trợ responsive hoàn hảo trên mọi thiết bị.

---

## 📚 Tài liệu chi tiết

Để hiểu rõ hơn về dự án, vui lòng tham khảo các tài liệu sau:

- [📖 Kiến trúc Hệ thống (Architecture)](./docs/ARCHITECTURE.md)
- [💻 Hướng dẫn Phát triển Frontend](./docs/FRONTEND_DOCUMENTATION.md)
- [🛠 Quy định & Tiêu chuẩn Code](./docs/DEVELOPMENT_GUIDELINE.md)
- [💬 Tích hợp API Message](./docs/message-api-integration.md)

---


| Công nghệ | Vai trò |
| :--- | :--- |
| **React 19** | Thư viện UI cốt lõi |
| **TypeScript 5** | Đảm bảo an toàn kiểu dữ liệu (Type-safety) |
| **Vite 6** | Build tool & Dev server siêu tốc |
| **TailwindCSS 4** | Styling hệ thống với kiến trúc utility-first |
| **React Router 7** | Quản lý điều hướng và routing mạnh mẽ |
| **Axios** | Xử lý HTTP requests với interceptors chuyên nghiệp |
| **Socket.io** | Hỗ trợ tính năng Chat & Thông báo thời gian thực |
| **Google Maps API** | Định vị và tìm kiếm sản phẩm theo bản đồ |

---

## 📂 Cấu trúc dự án (Dành cho Developer)

Dự án áp dụng mô hình **Feature-based Folders** để tránh việc folder `components` hay `hooks` bị phình to quá mức.

```text
src/
├── features/           # Chứa các module nghiệp vụ chính
│   ├── auth/           # Login, Register, OTP, Reset Password
│   ├── product/        # Danh sách, chi tiết, tạo sản phẩm
│   ├── messages/       # Hệ thống chat realtime
│   ├── orders/         # Quản lý đơn hàng (Booking/Rental)
│   ├── inventory/      # Quản lý kho đồ cá nhân
│   └── profile/        # Thông tin cá nhân & Avatar
├── lib/                # Cấu hình các thư viện bên thứ 3 (Axios, Socket)
├── shared/             # Các UI Components và Utils dùng chung
└── layout/             # Các thành phần giao diện chính (Sidebar, Header, Shell)
```

---

## 🚀 Bắt đầu phát triển

### 1. Cấu hình môi trường
Sao chép file `.env.example` thành `.env` và cập nhật các tham số cần thiết:
```env
VITE_API_BASE_URL=http://localhost:5003
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### 2. Cài đặt và Chạy
```bash
# Cài đặt dependencies
npm install

# Chạy ở chế độ Development (Port 5173)
npm run dev:strict
```

### 3. Kiểm tra mã nguồn
```bash
# Kiểm tra lỗi TypeScript
npm run typecheck

# Linting code
npm run lint
```

---

## 💎 Các tính năng nổi bật

1.  **Hệ thống Auth Bảo mật**: Đăng ký/Đăng nhập đi kèm xác thực OTP qua Email.
2.  **Quản lý Kho đồ**: Người dùng có thể đăng tải sản phẩm cho thuê với đầy đủ thông số kỹ thuật.
3.  **Real-time Messaging**: Trao đổi trực tiếp giữa người thuê và người cho thuê qua Socket.io.
4.  **Lịch sử Đơn hàng**: Theo dõi trạng thái đơn hàng từ lúc đặt đến khi hoàn tất.
5.  **Tích hợp Bản đồ**: Tìm kiếm thiết bị cho thuê xung quanh khu vực người dùng.

---

## 🤝 Đóng góp phát triển

Mọi đóng góp cần tuân thủ quy trình sau:
1. Tạo branch mới từ `develop` (ví dụ: `feature/chat-system` hoặc `fix/login-bug`).
2. Viết code sạch, có comment đầy đủ cho các hàm phức tạp.
3. Chạy `npm run typecheck` trước khi tạo Pull Request.
4. Yêu cầu Review từ Leader trước khi Merge.

---
*Phát triển bởi Đội ngũ URent - 2026*
