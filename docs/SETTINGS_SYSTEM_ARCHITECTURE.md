# ⚙️ Sơ Đồ Toàn Diện & Kiến Trúc - Phân Hệ Settings & Security (URent Ecosystem)

Tài liệu này trình bày sơ đồ tư duy (Mindmap), các biểu đồ luồng nghiệp vụ bảo mật (Sequence & Flowcharts) cùng thiết kế cơ sở dữ liệu chi tiết của phân hệ **Settings (Thiết lập tài khoản)**, **Xác thực 2 yếu tố (2FA Email OTP)** và **Hệ thống Nhật ký Hoạt động (Activity Logs & Risk Assessment)** trong hệ sinh thái URent.

---

## 🧠 1. Sơ Đồ Tư Duy Tổng Quan Phân Hệ Settings (Mermaid Mindmap)

Dưới đây là sơ đồ tư duy phân tách các khía cạnh: **Tùy chọn hiển thị (Preferences)**, **Tiêu chuẩn bảo mật (Security & 2FA)**, **Nhật ký hoạt động (Activity Logs)** và **Kiến trúc phân phối dữ liệu**.

```mermaid
mindmap
  root((URent Settings Hub))
    Preferences["1. Tùy chọn & Giao diện"]
      ThemeConfig["Giao diện (Theme)"]
        LightTheme["light: Giao diện Sáng (Mặc định)"]
        DarkTheme["dark: Giao diện Tối chuyên nghiệp"]
        LocalStorage["Đồng bộ LocalStorage phía Client"]
      LanguageConfig["Ngôn ngữ (Language)"]
        ViLang["vi: Tiếng Việt hiển thị"]
        EnLang["en: Tiếng Anh quốc tế"]
        LanguageContext["Đồng bộ qua LanguageContext"]
      NotifMasterSwitches["Master Switches (Bật/Tắt chính)"]
        EmailMaster["emailNotifications (Email Alerts)"]
        ScreenMaster["screenNotifications (In-app WS Popups)"]
        PushMaster["pushNotifications (FCM Web Push)"]
        SoundMaster["soundNotifications (Âm thanh cảnh báo)"]
    Security2FA["2. Bảo mật & Xác thực 2 lớp"]
      PasswordChange["Thay đổi Mật khẩu"]
        ChangePasswordModal["ChangePasswordModal (React)"]
        BcryptHash["Mã hóa Bcrypt kiểm tra backend"]
      TwoFactorAuth["Email OTP 2FA"]
        TwoFactorOtpModal["TwoFactorOtpModal (Nhập mã 2FA)"]
        OtpLifecycle["Sinh OTP 6 số ngẫu nhiên (Hạn 15 phút)"]
        verifyOtp["Hàm verifyOtp & updateSettings (Transaction)"]
    ActivityLogs["3. Nhật ký & Đánh giá Rủi ro"]
      MetadataExtractor["Trích xuất Siêu dữ liệu"]
        ClientIp["getClientIp: Nhận dạng địa chỉ IP Client"]
        BrowserDevice["parseUserAgent: Phân tích Browser & OS"]
        GeoIpLocation["estimateLocation: Ước lượng Tỉnh/Thành"]
      RiskEngine["Động cơ đánh giá rủi ro"]
        RiskLevel["riskLevel: safe | low | medium | high"]
        SecurityTrigger["Cảnh báo khi đổi IP / Thiết bị lạ"]
      DatabaseLogging["Lưu trữ ActivityLog"]
        IndexUserIdTimestamp["Index: { userId: 1, timestamp: -1 }"]
    BackendAPI["4. Kiến trúc API Endpoints"]
      RESTRouter["settingsRouter (Express API)"]
        GetSettings["GET /settings: Lấy & Tự tạo mặc định (upsert)"]
        Request2FAOtp["POST /settings/2fa/otp: Phát email OTP 2FA"]
        PatchSettings["PATCH /settings: Cập nhật settings & 2FA"]
      ZodSchema["Kiểm duyệt Dữ liệu đầu vào"]
        updateSettingsSchema["updateSettingsSchema (Zod Validation)"]
```

---

## 🔒 2. Luồng Kích Hoạt Xác Thực 2 Lớp (2FA State Sequence Diagram)

Quá trình kích hoạt hoặc hủy kích hoạt **Xác thực 2 lớp (2FA)** được bảo vệ tuyệt đối để tránh việc tài khoản bị chiếm đoạt. Hệ thống yêu cầu một quy trình xác minh 2 bước qua mã OTP gửi tới Email đã đăng ký của người dùng:

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (User)
    participant Client as React Client (SPA)
    participant BE as Express API Server
    participant SMTP as SMTP Mail Server (Nodemailer)
    participant MDB as MongoDB Database

    %% BƯỚC 1: YÊU CẦU OTP
    User->>Client: 1. Click bật/tắt Toggle "Xác thực 2 yếu tố"
    Client->>BE: 2. POST /api/v1/settings/2fa/otp
    BE->>MDB: 3. Truy vấn tìm thông tin User (Lấy email)
    BE->>BE: 4. Gọi issueOtp(user, 'toggle 2fa') -> Sinh mã 6 chữ số
    BE->>SMTP: 5. Gửi thư chứa mã OTP đến Email của User (Hạn 15 phút)
    SMTP-->>User: 6. Nhận thư điện tử lấy mã OTP
    BE-->>Client: 7. Trả về HTTP 200 OK {"message": "OTP has been sent"}
    Client->>Client: 8. Hiển thị TwoFactorOtpModal yêu cầu nhập OTP

    %% BƯỚC 2: XÁC MINH & CẬP NHẬT
    User->>Client: 9. Nhập mã OTP 6 chữ số & Click "Xác nhận"
    Client->>BE: 10. PATCH /api/v1/settings { twoFactorEnabled: true, otp: "123456" }
    BE->>BE: 11. Gọi verifyOtp(email, otp, 'toggle 2fa')
    alt OTP sai hoặc hết hạn
        BE-->>Client: Trả về HTTP 400 Bad Request ("Mã OTP không hợp lệ")
        Client-->>User: Hiển thị cảnh báo lỗi nhập sai
    else OTP khớp & Hợp lệ
        BE->>MDB: 12. Cập nhật Settings { twoFactorEnabled: true } (upsert)
        BE->>BE: 13. Phân tích request IP, UserAgent, ước lượng vị trí, đánh giá rủi ro
        BE->>MDB: 14. Ghi ActivityLog & Gửi thông báo hệ thống ("Bật 2FA thành công")
        MDB-->>BE: Xác nhận cập nhật thành công
        BE-->>Client: 15. Trả về HTTP 200 OK kèm Settings mới và isPasswordSet
        Client->>Client: 16. Đóng modal, hiển thị trạng thái "Được bảo vệ (Protected)"
    end
```

---

## 🛡️ 3. Luồng Ghi Nhận Lịch Sử Hoạt Động & Đánh Giá Rủi Ro (Activity Logger)

Mỗi khi người dùng đăng nhập, đổi mật khẩu hoặc sửa đổi các thiết lập bảo mật quan trọng, hệ thống tự động ghi lại nhật ký hoạt động chi tiết để hỗ trợ đối soát bảo mật.

```mermaid
flowchart TD
    A[Bắt đầu Request: Thay đổi cài đặt/Đăng nhập] --> B[Ghi nhận HTTP Request object]
    
    subgraph MetadataExtractor [Bộ trích xuất Siêu dữ liệu]
        B --> C1[Trích xuất Client IP địa chỉ mạng]
        B --> C2[Đọc User-Agent header thiết bị]
        
        C1 --> D1[estimateLocation: Phân tích địa chỉ Tỉnh/Thành từ IP]
        C2 --> D2["parseUserAgent:
        Bóc tách Browser (Chrome/Safari...) 
        và Device/OS (Windows/Mac/iOS...)"]
    end

    MetadataExtractor --> E[evaluateRiskLevel: Bộ lọc phân loại rủi ro]
    E --> F{Có phát hiện bất thường?\ne.g., IP từ nước ngoài / Trình duyệt lạ}
    
    F -->|Có| G[Gán riskLevel = 'medium' hoặc 'high']
    F -->|Không| H[Gán riskLevel = 'safe' hoặc 'low']

    G & H --> I["Khởi tạo ActivityLogModel ghi MongoDB:
    {
      userId,
      type: 'settings_change' | 'password_change' | 'login',
      action,
      description,
      ip,
      userAgent,
      location,
      device,
      riskLevel
    }"]

    I --> J[Tạo thông báo bảo mật gửi về thiết bị qua WebSocket]
    J --> K[Hoàn tất ghi nhận nhật ký]
```

---

## 🗃️ 4. Chi Tiết Thiết Kế MongoDB Collection Schemas

Phân hệ Settings và Nhật ký bảo mật được lưu trữ tại 2 Collections độc lập liên kết thông qua trường `userId`:

### 4.1 Collection `settings` (Thiết lập cấu hình)
```json
{
  "_id": "ObjectId",
  "userId": { "type": "ObjectId", "ref": "User", "required": true, "unique": true, "index": true },
  "theme": { "type": "String", "enum": ["light", "dark"], "default": "light" },
  "language": { "type": "String", "enum": ["vi", "en"], "default": "vi" },
  "emailNotifications": { "type": "Boolean", "default": true }, // Master Switch Email
  "screenNotifications": { "type": "Boolean", "default": true }, // Master Switch In-App (WS)
  "pushNotifications": { "type": "Boolean", "default": true },  // Master Switch Web Push (FCM)
  "soundNotifications": { "type": "Boolean", "default": true },
  "twoFactorEnabled": { "type": "Boolean", "default": false },   // Trạng thái bật/tắt 2FA
  "preferences": {
    // Chi tiết kênh gửi cho từng nhóm thông báo:
    "orderUpdates": { "email": true, "push": true, "inApp": true },
    "chatMessages": { "email": true, "push": true, "inApp": true },
    "promotions": { "email": true, "push": true, "inApp": true },
    "systemAlerts": { "email": true, "push": true, "inApp": true }
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 4.2 Collection `activitylogs` (Nhật ký lịch sử hoạt động)
```json
{
  "_id": "ObjectId",
  "userId": { "type": "ObjectId", "ref": "User", "index": true },
  "action": { "type": "String", "required": true }, // Tiêu đề hành động ngắn gọn
  "description": { "type": "String", "required": true }, // Chi tiết hoạt động
  "timestamp": { "type": "Date", "default": "Date.now" },
  "type": { 
    "type": "String", 
    "enum": ["auth", "update", "message", "login", "logout", "profile_update", "password_change", "settings_change"], 
    "required": true 
  },
  "notificationId": { "type": "ObjectId", "ref": "Notification" }, // Liên kết nếu hành động này kích hoạt thông báo
  "eventKey": { "type": "String" },
  "ip": { "type": "String" }, // Địa chỉ IP thực tế của request
  "userAgent": { "type": "String" }, // Toàn bộ chuỗi User-Agent header
  "location": { "type": "String" }, // Vị trí ước lượng (Ví dụ: "Hanoi, Vietnam")
  "device": { "type": "String" }, // Thiết bị phân tích được (Ví dụ: "Chrome / Windows 10")
  "riskLevel": { "type": "String", "enum": ["safe", "low", "medium", "high"], "default": "safe" },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🔒 5. Kiểm Định & Flatten Dữ Liệu Phía Backend

Khi người dùng thực hiện cập nhật các trường cấu hình lồng nhau (Nested Fields như `preferences.orderUpdates.email`), Backend áp dụng kỹ thuật **Flatten Object** để tối ưu hóa truy vấn cập nhật và tránh ghi đè các cấu hình tùy chọn khác:

### 5.1 Thuật toán Flatten Object (Phẳng hóa dữ liệu)
Thay vì gửi toàn bộ Object `preferences` lên MongoDB gây mất mát các tùy chọn con chưa cập nhật, hàm `flattenObject` chuyển đổi:
```javascript
// Dữ liệu đầu vào:
{
  preferences: {
    orderUpdates: {
      email: false
    }
  }
}

// Dữ liệu sau khi Phẳng hóa (Flattened):
{
  "preferences.orderUpdates.email": false
}
```
*   **Lợi ích**: Khi chạy lệnh cập nhật `$set` của MongoDB, nó chỉ thay đổi chính xác thuộc tính `preferences.orderUpdates.email` của User mà không làm ảnh hưởng hay ghi đè các cài đặt khác như `preferences.chatMessages` hay `preferences.systemAlerts`.

### 5.2 Ràng buộc Cập nhật từ Zod Validator
Dữ liệu gửi từ Client lên được đi qua middleware kiểm định `validateBody` sử dụng Zod schema `updateSettingsSchema`:
```typescript
export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.enum(['vi', 'en']).optional(),
  emailNotifications: z.boolean().optional(),
  screenNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  soundNotifications: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  otp: z.string().length(6, 'Mã OTP phải dài đúng 6 số').optional(),
  preferences: z.object({
    orderUpdates: z.object({ email: z.boolean().optional(), push: z.boolean().optional(), inApp: z.boolean().optional() }).optional(),
    chatMessages: z.object({ email: z.boolean().optional(), push: z.boolean().optional(), inApp: z.boolean().optional() }).optional(),
    promotions: z.object({ email: z.boolean().optional(), push: z.boolean().optional(), inApp: z.boolean().optional() }).optional(),
    systemAlerts: z.object({ email: z.boolean().optional(), push: z.boolean().optional(), inApp: z.boolean().optional() }).optional(),
  }).optional()
});
```

> [!NOTE]
> **Upsert-Safe**: Trong hàm `updateSettings`, Backend loại bỏ trường `twoFactorEnabled` khỏi giá trị mặc định `$setOnInsert` khi nó đã có mặt trong `$set` để tránh lỗi xung đột đường dẫn dữ liệu (path-conflict) của MongoDB, đảm bảo hệ thống tự tạo thiết lập mặc định (Upsert) an toàn kể cả đối với các tài khoản mới đăng ký chưa từng truy cập mục Cài đặt.
