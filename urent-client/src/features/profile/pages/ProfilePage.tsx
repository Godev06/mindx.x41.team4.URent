import { useNavigate } from "react-router-dom";
import { USER_PROFILE } from "../../shared/data";
import { getAvatarStyle } from "../../shared/utils/avatar";

export function ProfilePage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm ring-1 ring-slate-900/10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Thông tin cá nhân
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem và quản lý thông tin hồ sơ của bạn.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {(() => {
              const { initials, colorClass } = getAvatarStyle(
                USER_PROFILE.name,
              );
              return (
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white ring-1 ring-white/30 ${colorClass}`}
                >
                  {initials}
                </div>
              );
            })()}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {USER_PROFILE.name}
              </h2>
              <p className="text-sm text-slate-500">{USER_PROFILE.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm text-slate-600">Họ và tên</label>
              <p className="mt-2 font-medium text-slate-900">
                {USER_PROFILE.name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm text-slate-600">Email</label>
              <p className="mt-2 font-medium text-slate-900">
                {USER_PROFILE.email}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm text-slate-600">Số điện thoại</label>
              <p className="mt-2 font-medium text-slate-900">
                {USER_PROFILE.phone}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm text-slate-600">Ngày tham gia</label>
              <p className="mt-2 font-medium text-slate-900">
                {USER_PROFILE.joinDate}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="text-sm text-slate-600">Địa chỉ</label>
            <p className="mt-2 font-medium text-slate-900">
              {USER_PROFILE.address}
            </p>
          </div>

          <button
            type="button"
            className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
            onClick={() => navigate("/settings")}
          >
            Cập nhật hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}
