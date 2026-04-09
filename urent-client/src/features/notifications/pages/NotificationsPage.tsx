import { useState } from "react";
import { Bell } from "lucide-react";

const notifications = [
  {
    id: 1,
    title: "Đơn hàng #A102 đã gửi",
    time: "2 phút trước",
    description:
      "Đơn hàng của bạn đã được gửi thành công. Nhấn vào chi tiết để xem trạng thái giao hàng và lịch trình nhận hàng.",
  },
  {
    id: 2,
    title: "Tin nhắn mới từ Lan",
    time: "10 phút trước",
    description:
      "Lan đã gửi cho bạn một tin nhắn mới về thời gian nhận thiết bị. Mở tin nhắn để trả lời ngay.",
  },
  {
    id: 3,
    title: "Khuyến mãi 20% cho camera",
    time: "1 giờ trước",
    description:
      "Chương trình giảm giá 20% cho mảng camera đang diễn ra. Kiểm tra các sản phẩm phù hợp và đặt trước để nhận ưu đãi.",
  },
];

export function NotificationsPage() {
  const [selectedNotificationId, setSelectedNotificationId] = useState(
    notifications[0]?.id ?? 1,
  );
  const selectedNotification =
    notifications.find((item) => item.id === selectedNotificationId) ??
    notifications[0];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm ring-1 ring-slate-900/4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Trung tâm thông báo
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Xem tất cả thông báo và chi tiết thông tin mới nhất của bạn.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
            <Bell size={16} strokeWidth={2} />
            {notifications.length} thông báo
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4 lg:min-w-88">
          <div className="border-b border-slate-200/90 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Danh sách thông báo
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Chọn một mục để xem chi tiết nội dung.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => setSelectedNotificationId(notification.id)}
                className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${
                  selectedNotificationId === notification.id
                    ? "bg-slate-50"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-slate-900">
                    {notification.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {notification.time}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Chi tiết thông báo
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Xem nội dung và hướng dẫn hành động cho thông báo đã chọn.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              {selectedNotification.time}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedNotification.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {selectedNotification.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
