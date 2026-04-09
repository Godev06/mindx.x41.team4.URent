import { useState } from "react";
import { Lock, Activity, Sliders, User } from "lucide-react";
import { ACTIVITY_LOGS } from "../../shared/data";

export function SettingsPage() {
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
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm ring-1 ring-slate-900/10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Cài đặt
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý tài khoản, bảo mật, hoạt động và tùy chọn ứng dụng của bạn.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/10">
        <div className="border-b border-slate-200/70 px-6">
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
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"
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
                  <h3 className="font-semibold text-slate-900">
                    Thông tin cơ bản
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Quản lý thông tin tài khoản của bạn.
                  </p>
                </div>
                {!isEditingAccount && (
                  <button
                    onClick={() => {
                      setIsEditingAccount(true);
                      setTempData(accountData);
                    }}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                  >
                    Sửa
                  </button>
                )}
              </div>

              {isEditingAccount ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="text-sm text-slate-600">Họ và tên</label>
                    <input
                      type="text"
                      value={tempData.name}
                      onChange={(e) =>
                        setTempData({ ...tempData, name: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="text-sm text-slate-600">Email</label>
                    <input
                      type="email"
                      value={tempData.email}
                      onChange={(e) =>
                        setTempData({ ...tempData, email: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="text-sm text-slate-600">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={tempData.phone}
                      onChange={(e) =>
                        setTempData({ ...tempData, phone: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAccount(false);
                        setTempData(accountData);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountData(tempData);
                        setIsEditingAccount(false);
                      }}
                      className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="text-sm text-slate-600">Họ và tên</label>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {accountData.name}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="text-sm text-slate-600">Email</label>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {accountData.email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="text-sm text-slate-600">
                      Số điện thoại
                    </label>
                    <p className="mt-2 text-sm font-medium text-slate-900">
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
                <h3 className="font-semibold text-slate-900">
                  Bảo mật tài khoản
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Cải thiện bảo mật của tài khoản của bạn.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Đổi mật khẩu</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Cập nhật mật khẩu định kỳ để bảo mật tài khoản
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Đổi
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Xác thực hai yếu tố</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
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
                <h3 className="font-semibold text-slate-900">
                  Hoạt động gần đây
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Xem lịch sử hoạt động và đăng nhập.
                </p>
              </div>

              <div className="space-y-3">
                {ACTIVITY_LOGS.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{log.action}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.description} • {log.timestamp}
                      </p>
                    </div>
                    {log.type === "login" && (
                      <span className="text-xs font-medium text-teal-600">
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
                <h3 className="font-semibold text-slate-900">
                  Tùy chọn ứng dụng
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Điều chỉnh cách ứng dụng hoạt động cho bạn.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Chế độ tối</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Thông báo qua email</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
                    <span>Thông báo trên màn hình</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded border-slate-300 text-teal-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm text-slate-600">Ngôn ngữ</label>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600">
                    <option>Tiếng Việt</option>
                    <option>English</option>
                    <option>中文</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                >
                  Lưu tùy chọn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
