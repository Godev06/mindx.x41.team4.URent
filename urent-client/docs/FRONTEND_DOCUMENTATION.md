# 💻 Tài liệu Phát triển Frontend - URent

Tài liệu này cung cấp hướng dẫn chi tiết về cách phát triển, mở rộng và bảo trì giao diện người dùng (Frontend) cho dự án URent.

---

## 1. Stack Công nghệ & Thư viện Chính

| Thư viện | Phiên bản | Công dụng |
| :--- | :--- | :--- |
| **React** | 19.x | Thư viện UI (Sử dụng Concurrent Mode, Server Components ready) |
| **Vite** | 6.x | Công cụ build và tối ưu hóa tài nguyên |
| **TailwindCSS** | 4.x | Styling dựa trên Utility-first và CSS-first configuration |
| **React Router** | 7.x | Quản lý định tuyến và Navigation |
| **Axios** | 1.x | Client xử lý HTTP Requests |
| **Lucide React** | 1.x | Hệ thống icon SVG đồng nhất |
| **Socket.io Client**| 4.x | Kết nối realtime cho chat và thông báo |

---

## 2. Kiến trúc Thư mục (Frontend Pattern)

Dự án áp dụng mô hình **Feature-Based Architecture**. Mỗi module nghiệp vụ nằm trong một thư mục riêng tại `src/features/`.

### Cấu trúc một Feature mẫu (`src/features/example/`):
- `components/`: Các UI components nội bộ của feature.
- `hooks/`: Các custom hooks xử lý logic riêng (ví dụ: `useFetchProducts.ts`).
- `pages/`: Các component đại diện cho một trang hoàn chỉnh.
- `services/`: Chứa các file gọi API (ví dụ: `productService.ts`).
- `types.ts`: Định nghĩa Interface/Type cho dữ liệu của feature.
- `constants.ts`: Các hằng số cấu hình.

### Các thư mục hệ thống:
- `src/lib/`: Cấu hình global cho Axios, Socket, Auth Provider.
- `src/features/shared/`: Các component dùng chung cho toàn bộ app (Alert, Loader, Toast...).

---

## 3. Hệ thống Giao diện (Design System)

### Màu sắc & Typography (Cấu hình tại `src/index.css`)
Sử dụng Tailwind 4 Theme:
- **Brand Primary**: `--color-brand-primary` (#0f766e - Teal 700)
- **Brand Accent**: `--color-brand-accent` (#f97316 - Orange 500)
- **Fonts**: Ưu tiên `Outfit` và `Be Vietnam Pro` để hỗ trợ tiếng Việt tốt nhất.

### Dark Mode
Hệ thống hỗ trợ Dark mode thông qua class `.dark`.
- Sử dụng các variant `dark:` trong Tailwind class.
- Biến màu sắc tự động thay đổi theo context của thẻ `html`.

---

## 4. Quản lý Trạng thái (State Management)

### Global State (Context API)
Sử dụng React Context cho các dữ liệu cần truy cập ở nhiều nơi:
1.  **AuthContext**: Lưu thông tin `user`, `token`, trạng thái `isAuthenticated`.
2.  **Notification/ToastContext**: Quản lý hiển thị các thông báo nhanh trên màn hình.

### Local State
- Sử dụng `useState` và `useReducer` cho các logic phức tạp trong component.
- Khuyến khích sử dụng **Custom Hooks** để tách biệt logic xử lý dữ liệu và UI.

---

## 5. Giao tiếp API & Xử lý Dữ liệu

### apiClient (Axios Instance)
Nằm tại `src/lib/api/apiClient.ts`. Các tính năng:
- Tự động đính kèm `Bearer Token`.
- Xử lý lỗi tập trung (Global Error Handler).
- Chuẩn hóa format response về dạng `{ success, data, error }`.

### Quy trình gọi API trong Component:
1. Định nghĩa service trong `services/`.
2. Sử dụng hook để gọi service.
3. Quản lý trạng thái `loading`, `error` và hiển thị UI tương ứng (PageLoader, AlertMessage).

---

## 6. Quy chuẩn Viết Component

- **Functional Components**: Luôn sử dụng Arrow functions.
- **Prop Types**: Định nghĩa rõ ràng interface cho props.
- **Destructuring**: Giải nén props ngay tại tham số của hàm.
- **Clean JSX**: Tránh viết logic quá phức tạp bên trong phần return của component.

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const CustomButton = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded ${variant === 'primary' ? 'bg-teal-600' : 'bg-orange-500'}`}
    >
      {label}
    </button>
  );
};  
```

---

## 7. Responsive & Mobile Optimization

- Sử dụng các prefix `sm:`, `md:`, `lg:`, `xl:` của Tailwind.
- **Mobile-first**: Viết style cho mobile trước, sau đó mới dùng breakpoint cho desktop.
- Kiểm tra hiển thị trên các màn hình phổ biến (iPhone, iPad, Desktop) thông qua DevTools.

---

## 8. Hướng dẫn Mở rộng (How-to)

### Thêm một trang mới:
1. Tạo thư mục feature mới (nếu cần) trong `src/features/`.
2. Tạo Page component trong `pages/`.
3. Khai báo Route trong `src/App.tsx`.
4. Cập nhật Sidebar/Header để trỏ link tới trang mới.

### Thêm một API mới:
1. Định nghĩa kiểu dữ liệu trong `types.ts`.
2. Viết hàm gọi API trong `services/`.
3. Sử dụng hàm đó trong Page hoặc Hook.

---
*Tài liệu này là "kim chỉ nam" cho mọi lập trình viên Frontend tham gia vào dự án URent.*
