import type { ActivityLog } from "../shared/types";

// ACTIVITY_LOGS mockdata
export const ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 1,
    action: "Đăng nhập",
    description: "Đăng nhập từ chrome (192.168.1.1)",
    timestamp: "2024-04-09 14:30:00",
    type: "login",
  },
  {
    id: 2,
    action: "Tạo đơn hàng",
    description: "Tạo đơn hàng #A102 (Sony Alpha a7 IV)",
    timestamp: "2024-04-09 13:15:00",
    type: "order",
  },
  {
    id: 3,
    action: "Gửi tin nhắn",
    description: "Gửi tin nhắn cho Lan",
    timestamp: "2024-04-09 12:45:00",
    type: "message",
  },
  {
    id: 4,
    action: "Cập nhật cài đặt",
    description: "Bật thông báo email",
    timestamp: "2024-04-09 11:20:00",
    type: "settings",
  },
  {
    id: 5,
    action: "Đăng nhập",
    description: "Đăng nhập từ Safari (192.168.1.2)",
    timestamp: "2024-04-08 09:15:00",
    type: "login",
  },
];
