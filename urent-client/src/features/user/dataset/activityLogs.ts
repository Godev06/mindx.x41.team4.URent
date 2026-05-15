export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: "login" | "logout" | "profile_update" | "password_change" | "settings_change";
}

export const ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "1",
    action: "Đăng nhập",
    description: "Đăng nhập từ thiết bị Chrome trên Windows",
    timestamp: "2024-04-09 14:30:00",
    type: "login",
  },
  {
    id: "2",
    action: "Cập nhật hồ sơ",
    description: "Cập nhật thông tin hồ sơ cá nhân",
    timestamp: "2024-04-08 10:15:30",
    type: "profile_update",
  },
  {
    id: "3",
    action: "Thay đổi mật khẩu",
    description: "Mật khẩu đã được thay đổi thành công",
    timestamp: "2024-04-07 16:45:12",
    type: "password_change",
  },
  {
    id: "4",
    action: "Cài đặt thay đổi",
    description: "Bật thông báo email",
    timestamp: "2024-04-06 09:20:00",
    type: "settings_change",
  },
  {
    id: "5",
    action: "Đăng nhập",
    description: "Đăng nhập từ thiết bị Firefox trên macOS",
    timestamp: "2024-04-05 13:00:45",
    type: "login",
  },
];
