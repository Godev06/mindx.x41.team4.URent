import { useState } from "react";
import { Bell } from "lucide-react";
import { useTheme } from "../../settings/hooks/useTheme";
import { useI18n } from "../../shared/context/LanguageContext";

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
  const { theme } = useTheme();
  const { lang } = useI18n();
  const t =
    lang === "vi"
      ? {
          title: "Trung tâm thông báo",
          desc: "Xem tất cả thông báo và chi tiết thông tin mới nhất của bạn.",
          count: "thông báo",
          listTitle: "Danh sách thông báo",
          listDesc: "Chọn một mục để xem chi tiết nội dung.",
          detailTitle: "Chi tiết thông báo",
          detailDesc:
            "Xem nội dung và hướng dẫn hành động cho thông báo đã chọn.",
          notifItems: notifications,
        }
      : {
          title: "Notification Center",
          desc: "View all notifications and your latest updates.",
          count: "notifications",
          listTitle: "Notification list",
          listDesc: "Select an item to view full details.",
          detailTitle: "Notification details",
          detailDesc:
            "View content and suggested actions for the selected notification.",
          notifItems: [
            {
              id: 1,
              title: "Order #A102 shipped",
              time: "2 minutes ago",
              description:
                "Your order has been shipped successfully. Open details to view delivery status and schedule.",
            },
            {
              id: 2,
              title: "New message from Lan",
              time: "10 minutes ago",
              description:
                "Lan sent you a new message about pickup time. Open messages to reply now.",
            },
            {
              id: 3,
              title: "20% promotion for cameras",
              time: "1 hour ago",
              description:
                "A 20% discount campaign for cameras is live. Check eligible products and reserve early.",
            },
          ],
        };
  const [selectedNotificationId, setSelectedNotificationId] = useState(
    t.notifItems[0]?.id ?? 1,
  );
  const selectedNotification =
    t.notifItems.find((item) => item.id === selectedNotificationId) ??
    t.notifItems[0];

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border px-5 py-4 shadow-sm ring-1 ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 ring-white/10"
            : "border-slate-200/90 bg-white ring-slate-900/4"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-xl font-semibold tracking-tight ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {t.title}
            </h1>
            <p
              className={`mt-1 text-sm ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {t.desc}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${
              theme === "dark"
                ? "bg-teal-500/15 text-teal-300"
                : "bg-teal-50 text-teal-700"
            }`}
          >
            <Bell size={16} strokeWidth={2} />
            {t.notifItems.length} {t.count}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className={`min-w-full overflow-hidden rounded-3xl border shadow-sm ring-1 lg:min-w-88 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <div
            className={`px-5 py-4 ${
              theme === "dark"
                ? "border-b border-slate-700"
                : "border-b border-slate-200/90"
            }`}
          >
            <h2
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {t.listTitle}
            </h2>
            <p
              className={`mt-1 text-xs ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {t.listDesc}
            </p>
          </div>
          <div
            className={`divide-y ${theme === "dark" ? "divide-slate-800" : "divide-slate-100"}`}
          >
            {t.notifItems.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => setSelectedNotificationId(notification.id)}
                className={`w-full px-5 py-4 text-left transition ${
                  selectedNotificationId === notification.id
                    ? theme === "dark"
                      ? "bg-slate-800/80"
                      : "bg-slate-50"
                    : theme === "dark"
                      ? "hover:bg-slate-800/50"
                      : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {notification.title}
                  </div>
                  <div
                    className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {notification.time}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`flex-1 rounded-3xl border p-6 shadow-sm ring-1 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 ring-white/10"
              : "border-slate-200/90 bg-white ring-slate-900/4"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-slate-100" : "text-slate-900"
                }`}
              >
                {t.detailTitle}
              </p>
              <p
                className={`mt-1 text-xs ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {t.detailDesc}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                theme === "dark"
                  ? "bg-teal-500/15 text-teal-300"
                  : "bg-teal-100 text-teal-700"
              }`}
            >
              {selectedNotification.time}
            </span>
          </div>

          <div className="mt-6">
            <h2
              className={`text-lg font-semibold ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {selectedNotification.title}
            </h2>
            <p
              className={`mt-4 text-sm leading-7 ${
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {selectedNotification.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
