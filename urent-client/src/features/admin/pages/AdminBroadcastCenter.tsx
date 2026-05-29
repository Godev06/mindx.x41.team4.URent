import { useState } from "react";
import { Megaphone, Send, Eye, ShieldAlert, BadgeInfo } from "lucide-react";
import { AdminLayout } from "../layout/AdminLayout";
import { notificationService } from "../../user/notifications/services/notificationService";
import { useToast } from "../../user/shared/hooks/useToast";

export function AdminBroadcastCenter() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "system" as "promotion" | "system",
    actionUrl: "",
    target: "all" as "all",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await notificationService.broadcastNotification({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        actionUrl: formData.actionUrl || undefined,
        target: formData.target,
      });

      showToast({
        title: "Gửi thông báo thành công",
        description: `Thông báo đang được phát sóng tới ${res.data?.targetCount ?? "các"} người dùng.`,
        variant: "success",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "system",
        actionUrl: "",
        target: "all",
      });
    } catch (err: any) {
      console.error("Failed to broadcast:", err);
      showToast({
        title: "Gửi thất bại",
        description: err.message || "Đã xảy ra lỗi khi gửi thông báo diện rộng.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPreview = () => {
    if (!formData.title.trim()) {
      showToast({
        title: "Nhập tiêu đề trước",
        description: "Vui lòng nhập tiêu đề để chạy bản xem trước Toast.",
        variant: "error",
      });
      return;
    }

    showToast({
      title: `[Xem trước] ${formData.title}`,
      description: formData.description || "Nội dung thông báo của bạn sẽ xuất hiện ở đây.",
      variant: formData.type === "promotion" ? "success" : "info",
      actionUrl: formData.actionUrl || undefined,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Banner Header */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                <Megaphone size={14} />
                Broadcast Center
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Phát sóng Thông báo diện rộng
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400 max-w-xl">
                Soạn thảo thông điệp hệ thống hoặc khuyến mãi để gửi thời gian thực (WebSocket), tin đẩy (FCM Push) và Email tới hàng loạt người dùng.
              </p>
            </div>
          </div>
        </section>

        {/* Form & Preview Panel */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form Composing */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Send size={18} className="text-teal-400" />
              Soạn thảo thông điệp
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Loại thông báo
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-teal-500"
                  >
                    <option value="system">Thông tin hệ thống (System)</option>
                    <option value="promotion">Chương trình khuyến mãi (Promotion)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Đối tượng mục tiêu
                  </label>
                  <select
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white shadow-sm outline-none transition focus:border-teal-500"
                  >
                    <option value="all">Tất cả người dùng (All Users)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tiêu đề thông báo
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề ngắn gọn"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-sm outline-none transition focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nội dung thông báo chi tiết
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Nhập nội dung thông điệp gửi tới người dùng..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-sm outline-none transition focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Đường dẫn liên kết (Action URL - Tùy chọn)
                </label>
                <input
                  type="text"
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleChange}
                  placeholder="Ví dụ: /products hoặc /orders (Người dùng click vào sẽ chuyển trang)"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-sm outline-none transition focus:border-teal-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestPreview}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-transparent px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <Eye size={16} />
                  Xem thử Toast
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-700 disabled:bg-slate-800 transition cursor-pointer"
                >
                  <Megaphone size={16} />
                  {loading ? "Đang gửi..." : "Phát sóng ngay lập tức"}
                </button>
              </div>
            </form>
          </div>

          {/* Visual Live Preview */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Eye size={18} className="text-teal-400" />
                Bản xem trước trực quan
              </h2>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Giao diện thông báo In-App</p>

                <div className="relative border border-slate-800 bg-[#0f172a] rounded-2xl p-4 overflow-hidden shadow-inner flex items-start gap-3">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-cyan-500" />

                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20`}>
                    {formData.type === "promotion" ? <BadgeInfo size={16} /> : <ShieldAlert size={16} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-100 truncate">{formData.title || "Tiêu đề thông báo..."}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
                      {formData.description || "Nội dung chi tiết thông báo..."}
                    </p>
                    {formData.actionUrl && (
                      <span className="mt-2 inline-flex items-center text-[10px] font-bold text-teal-400 cursor-pointer">
                        Xem chi tiết →
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Giao diện Email khách hàng</p>
                <div className="border border-slate-800 bg-white text-slate-800 rounded-xl p-4 text-xs font-sans">
                  <div className="text-[10px] text-teal-700 font-bold uppercase tracking-wider mb-2">U-Rent Notification</div>
                  <div className="text-sm font-bold text-slate-900 mb-1">{formData.title || "Tiêu đề..."}</div>
                  <div className="text-slate-600 leading-normal mb-3">{formData.description || "Mô tả nội dung..."}</div>
                  {formData.actionUrl && (
                    <div className="inline-block px-3 py-1.5 bg-teal-700 text-white rounded text-[10px] font-semibold">
                      View Details in U-Rent
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 text-xs text-teal-400/90 leading-relaxed">
              💡 <strong>Mẹo:</strong> Sử dụng đường dẫn Action URL dạng <code>/orders/&lt;id&gt;</code> để dẫn dắt trực tiếp người dùng tới một trang giao dịch cụ thể khi họ click vào thông báo.
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
export default AdminBroadcastCenter;
