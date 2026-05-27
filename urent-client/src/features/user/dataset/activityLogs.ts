export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: "login" | "logout" | "profile_update" | "password_change" | "settings_change";
  ip?: string;
  userAgent?: string;
  location?: string;
  device?: string;
  riskLevel?: "safe" | "low" | "medium" | "high";
}

export const ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "1",
    action: "Đăng nhập",
    description: "Đăng nhập từ thiết bị Chrome trên Windows",
    timestamp: "2024-04-09 14:30:00",
    type: "login",
    ip: "113.161.44.20",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    location: "Hà Nội, Việt Nam",
    device: "Chrome / Windows 11",
    riskLevel: "safe",
  },
  {
    id: "2",
    action: "Cập nhật hồ sơ",
    description: "Cập nhật thông tin hồ sơ cá nhân",
    timestamp: "2024-04-08 10:15:30",
    type: "profile_update",
    ip: "113.161.44.20",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    location: "Hà Nội, Việt Nam",
    device: "Chrome / Windows 11",
    riskLevel: "safe",
  },
  {
    id: "3",
    action: "Thay đổi mật khẩu",
    description: "Mật khẩu đã được thay đổi thành công",
    timestamp: "2024-04-07 16:45:12",
    type: "password_change",
    ip: "113.161.44.20",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    location: "Hà Nội, Việt Nam",
    device: "Chrome / Windows 11",
    riskLevel: "safe",
  },
  {
    id: "4",
    action: "Cài đặt thay đổi",
    description: "Bật thông báo email",
    timestamp: "2024-04-06 09:20:00",
    type: "settings_change",
    ip: "27.67.24.120",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    location: "TP. Hồ Chí Minh, Việt Nam",
    device: "Safari / iOS Mobile",
    riskLevel: "low",
  },
  {
    id: "5",
    action: "Đăng nhập",
    description: "Đăng nhập từ thiết bị Firefox trên macOS",
    timestamp: "2024-04-05 13:00:45",
    type: "login",
    ip: "14.232.88.54",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    location: "Đà Nẵng, Việt Nam",
    device: "Firefox / macOS",
    riskLevel: "medium",
  },
];
