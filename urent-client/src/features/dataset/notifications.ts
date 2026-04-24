import type { Notification } from "../shared/types";

// NOTIFICATIONS mockdata
export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Đơn hàng #A102 đã gửi",
    description: "Đơn hàng của bạn đã được gửi thành công. Kiểm tra trạng thái giao hàng.",
    type: "order",
    time: "2 phút trước",
    read: false,
  },
  {
    id: 2,
    title: "Tin nhắn mới từ Lan",
    description: "Lan đã gửi cho bạn một tin nhắn mới về thời gian nhận thiết bị.",
    type: "message",
    time: "10 phút trước",
    read: false,
  },
  {
    id: 3,
    title: "Khuyến mãi 20% cho camera",
    description: "Chương trình giảm giá 20% cho mảng camera đang diễn ra.",
    type: "promotion",
    time: "1 giờ trước",
    read: true,
  },
  {
    id: 4,
    title: "Hoàn tiền thành công",
    description: "Hoàn tiền cho đơn hàng #A101 đã được xử lý.",
    type: "order",
    time: "3 giờ trước",
    read: true,
  },
  {
    id: 5,
    title: "Cập nhật hệ thống",
    description: "Ứng dụng đã được cập nhật lên phiên bản mới.",
    type: "system",
    time: "1 ngày trước",
    read: true,
  },
];
