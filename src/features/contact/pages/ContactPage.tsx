import { Mail, MapPin, MessageSquare, Phone, Send } from "lucide-react";
import { useState } from "react";

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "support@urent.vn",
    href: "mailto:support@urent.vn",
  },
  {
    icon: Phone,
    label: "Điện thoại",
    value: "1800 1234",
    href: "tel:18001234",
  },
  {
    icon: MapPin,
    label: "Địa chỉ",
    value: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    href: null,
  },
  {
    icon: MessageSquare,
    label: "Live chat",
    value: "Hỗ trợ 8h – 22h hàng ngày",
    href: null,
  },
];

export function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputBase =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10";

  return (
    <div className="space-y-10 py-6">
      {/* Page header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          <Mail size={12} strokeWidth={2.5} />
          Liên hệ
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Chúng tôi có thể giúp gì cho bạn?
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Hãy gửi câu hỏi hoặc phản hồi — đội ngũ hỗ trợ U-Rent sẽ phản hồi
          trong vòng 24 giờ làm việc.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Contact info */}
        <div className="space-y-4 lg:col-span-1">
          {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
            <div
              key={label}
              className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/60 dark:bg-slate-800/40 dark:ring-white/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="mt-0.5 text-sm font-medium text-slate-800 transition hover:text-teal-600 dark:text-slate-200 dark:hover:text-teal-300"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8 dark:border-slate-700/60 dark:bg-slate-800/40 dark:ring-white/5">
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Send size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Đã gửi thành công!
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Chúng tôi sẽ phản hồi bạn sớm nhất có thể.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  }}
                  className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-300"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Chủ đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vấn đề tôi gặp phải là..."
                    value={form.subject}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subject: e.target.value }))
                    }
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    className={`${inputBase} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-900/20 transition hover:bg-teal-700 active:scale-[0.98] dark:bg-teal-500 dark:hover:bg-teal-400"
                >
                  <Send size={15} strokeWidth={2} />
                  Gửi tin nhắn
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
