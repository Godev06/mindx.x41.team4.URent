# URent Client

Frontend React + Vite + TypeScript da duoc ket noi voi backend URent cho cac flow auth/profile sau:

- GET /health
- POST /api/auth/register
- POST /api/auth/register/verify-otp
- POST /api/auth/login
- POST /api/auth/login/verify-otp
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me
- PATCH /api/profile
- POST /api/profile/avatar

## Cau truc de xuat

```text
src/
  lib/api/
    apiClient.ts
    apiError.ts
    tokenStorage.ts
  features/
    auth/
      components/
      context/
      hooks/
      pages/
      services/
      utils/
      constants.ts
      types.ts
    profile/
      pages/
      services/
    shared/
      components/
      utils/
```

## Bien moi truong

1. Tao file `.env` tu `.env.example`.
2. Neu khong khai bao, frontend se dung mac dinh `http://localhost:5003`.

```env
VITE_API_BASE_URL=http://localhost:5003
```

## Chay du an

```bash
npm install
npm run dev
```

### Chay on dinh mot lenh (khuyen nghi)

Dung mot terminal duy nhat cho frontend, sau do chay:

```bash
npm run dev:strict
```

Lenh nay khoa cung port `5173`, tranh tinh trang nhay port lien tuc khi co nhieu Vite process cu.

Neu gap loi port dang duoc su dung, dung PowerShell de don process cu roi chay lai:

```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
npm run dev:strict
```

## Auth architecture

- Axios client chung co timeout, request interceptor gan `Authorization: Bearer <token>` tu `localStorage` key `auth_token`.
- Response interceptor chuan hoa loi sang message de doc va xu ly `401` bang cach xoa token, logout session va dua ve trang login.
- `AuthProvider` quan ly `user`, `token`, bootstrap session, `login/logout`, `refreshCurrentUser`.
- Cac route private di qua `ProtectedRoute`, route auth di qua `PublicOnlyRoute`.
- Toan bo form auth/profile co validation frontend cho email, password, otp, profile fields va avatar file.

## Test end-to-end

1. Health check: vao `/login`, xac nhan the `Backend status` hien `Healthy` khi backend dang chay.
2. Register: vao `/register`, nhap email hop le + password >= 6, submit de backend gui OTP, sau do vao `/register/verify-otp` va nhap OTP 6 ky tu.
3. Login OTP: vao `/login`, nhap email/password, submit, sau do nhap OTP o `/login/verify-otp`; verify thanh cong phai vao duoc dashboard va token xuat hien trong localStorage key `auth_token`.
4. Me/profile bootstrap: refresh browser khi da dang nhap, frontend phai goi `/api/auth/me` va giu session.
5. Forgot/reset password: vao `/forgot-password`, gui email, sang `/reset-password`, nhap email + OTP + mat khau moi.
6. Update profile: vao `/profile`, sua `displayName`, `bio`, `phone`, submit va kiem tra du lieu moi hien ngay sau khi PATCH thanh cong.
7. Upload avatar: tren `/profile`, chon anh <= 5MB, backend tra du lieu moi va avatar phai cap nhat tren UI.
8. Session expiry: chu dong lam token het han hoac dung token sai, request tiep theo phai bi logout va quay lai `/login`.
