import { useState } from "react";
import { Lock, Activity, Sliders, User } from "lucide-react";
import { ACTIVITY_LOGS } from "../../shared/data";
import { useTheme } from "../context/ThemeContext.tsx";

export function SettingsPage() {
  const {
    theme,
    isThemeTransitioning,
    toggleTheme,
    emailNotifications,
    screenNotifications,
    language,
    setEmailNotifications,
    setScreenNotifications,
    setLanguage,
  } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "account" | "security" | "activity" | "preferences"
  >("account");

  // Account Form State
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    name: "Nguyễn Văn A",
    email: "user@example.com",
    phone: "0123456789",
  });
  const [tempData, setTempData] = useState(accountData);

  const tabs = [
    {
      id: "account" as const,
      label: "Tài khoản",
      icon: User,
    },
    {
      id: "security" as const,
      label: "Bảo mật",
      icon: Lock,
    },
    {
      id: "activity" as const,
      label: "Hoạt động",
      icon: Activity,
    },
    {
      id: "preferences" as const,
      label: "Tùy chọn",
      icon: Sliders,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm ring-1 ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:ring-white/10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Cài đặt
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Quản lý tài khoản, bảo mật, hoạt động và tùy chọn ứng dụng của bạn.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:ring-white/10">
        <div className="border-b border-slate-200/70 px-6 dark:border-slate-700">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 border-b-2 px-4 py-4 text-sm font-medium transition ${
                    isActive
                      ? "border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === "account" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Thông tin cơ bản
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Quản lý thông tin tài khoản của bạn.
                  </p>
                </div>
                {!isEditingAccount && (
                  <button
                    onClick={() => {
                      setIsEditingAccount(true);
                      setTempData(accountData);
                    }}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
                  >
                    Sửa
                  </button>
                )}
              </div>

              {isEditingAccount ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={tempData.name}
                      onChange={(e) =>
                        setTempData({ ...tempData, name: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Email
                    </label>
                    <input
                      type="email"
                      value={tempData.email}
                      onChange={(e) =>
                        setTempData({ ...tempData, email: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={tempData.phone}
                      onChange={(e) =>
                        setTempData({ ...tempData, phone: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAccount(false);
                        setTempData(accountData);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountData(tempData);
                        setIsEditingAccount(false);
                      }}
                      className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Họ và tên
                    </label>
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {accountData.name}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Email
                    </label>
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {accountData.email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Số điện thoại
                    </label>
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {accountData.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Bảo mật tài khoản
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Cải thiện bảo mật của tài khoản của bạn.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Đổi mật khẩu
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Cập nhật mật khẩu định kỳ để bảo mật tài khoản
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Đổi
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-300">
                    <span>Xác thực hai yếu tố</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-300">
                    <span>Đăng xuất khỏi các thiết bị khác</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Hoạt động gần đây
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Xem lịch sử hoạt động và đăng nhập.
                </p>
              </div>

              <div className="space-y-3">
                {ACTIVITY_LOGS.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {log.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {log.description} • {log.timestamp}
                      </p>
                    </div>
                    {log.type === "login" && (
                      <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                        {log.timestamp.includes("2024-04-09 14:30:00")
                          ? "Hiện tại"
                          : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Tùy chọn ứng dụng
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Điều chỉnh cách ứng dụng hoạt động cho bạn.
                </p>
              </div>

              <div className="space-y-3">
                <div
                  className={`rounded-2xl border p-4 ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900/40"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-slate-100" : "text-slate-800"
                        }`}
                      >
                        Chế độ giao diện
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          theme === "dark" ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Đang dùng: {theme === "dark" ? "Tối" : "Sáng"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      disabled={isThemeTransitioning}
                      aria-pressed={theme === "dark"}
                      aria-busy={isThemeTransitioning}
                      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors ${
                        theme === "dark" ? "bg-slate-900" : "bg-teal-600"
                      } ${
                        isThemeTransitioning
                          ? "cursor-wait opacity-70"
                          : "cursor-pointer"
                      }`}
                    >
                      <span className="sr-only">Chuyển đổi giao diện</span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          theme === "dark" ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-300">
                    <span>Thông báo qua email</span>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(event) =>
                        setEmailNotifications(event.target.checked)
                      }
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700 dark:text-slate-300">
                    <span>Thông báo trên màn hình</span>
                    <input
                      type="checkbox"
                      checked={screenNotifications}
                      onChange={(event) =>
                        setScreenNotifications(event.target.checked)
                      }
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <label className="text-sm text-slate-600 dark:text-slate-400">
                    Ngôn ngữ
                  </label>
                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(event.target.value as typeof language)
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400"
                  >
                    <option>Tiếng Việt</option>
                    <option>English</option>
                    <option>中文</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
