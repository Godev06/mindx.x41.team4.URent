# 🛠 Quy định Phát triển (Development Guidelines)

Tài liệu này định nghĩa các tiêu chuẩn về code, quy trình làm việc và các công cụ bổ trợ để đảm bảo chất lượng dự án URent.

## 1. Tiêu chuẩn viết Code (Coding Standards)

### TypeScript & React
- Luôn định nghĩa kiểu dữ liệu (Interface/Type) cho Props và dữ liệu API.
- Ưu tiên sử dụng **Functional Components** và **Hooks**.
- Tránh sử dụng kiểu `any`. Sử dụng `unknown` hoặc định nghĩa chi tiết nếu có thể.

### Naming Conventions
- **Folder**: `kebab-case` (ví dụ: `auth-flow`).
- **File Component**: `PascalCase` (ví dụ: `UserCard.tsx`).
- **File Logic/Hook**: `camelCase` (ví dụ: `useAuth.ts`).
- **Biến/Hàm**: `camelCase`.
- **Hằng số**: `UPPER_SNAKE_CASE`.

### CSS & Styling
- Chỉ sử dụng TailwindCSS class. Hạn chế viết CSS thuần trừ khi thực sự cần thiết (lưu vào `App.css` hoặc `index.css`).
- Tận dụng các biến CSS được định nghĩa trong `index.css`.

## 2. Quy trình làm việc với Git

### Branching Strategy
Chúng ta sử dụng mô hình Git Flow đơn giản hóa:
- `main`: Chứa code ổn định nhất, sẵn sàng để deploy production.
- `develop`: Nhánh tích hợp chính cho quá trình phát triển.
- `feature/*`: Các nhánh phát triển tính năng mới.
- `fix/*`: Các nhánh sửa lỗi.

### Commit Message Format
Chúng ta tuân theo tiêu chuẩn **Conventional Commits**:
- `feat: <nội dung>` - Thêm tính năng mới.
- `fix: <nội dung>` - Sửa lỗi.
- `docs: <nội dung>` - Cập nhật tài liệu.
- `refactor: <nội dung>` - Cải thiện cấu trúc code nhưng không đổi tính năng.
- `chore: <nội dung>` - Cập nhật dependencies, cấu hình build...

## 3. Quy trình Pull Request (PR)

1. Đảm bảo code đã chạy `npm run typecheck` và không có lỗi TypeScript.
2. Code đã được format đúng theo ESLint (`npm run lint`).
3. PR cần có mô tả rõ ràng về:
    - Những thay đổi chính.
    - Video hoặc ảnh chụp màn hình (nếu là UI).
    - Các lưu ý đặc biệt khi review.
4. Cần ít nhất **1 sự đồng ý (Approve)** từ Leader hoặc đồng nghiệp trước khi merge vào `develop`.

## 4. Công cụ hỗ trợ

- **VS Code Extensions**:
    - ESLint
    - Prettier - Code formatter
    - Tailwind CSS IntelliSense
    - Error Lens (để nhìn lỗi nhanh)

---
*Tuân thủ các quy định trên giúp đội ngũ làm việc ăn ý và giảm thiểu các lỗi kỹ thuật không đáng có.*
