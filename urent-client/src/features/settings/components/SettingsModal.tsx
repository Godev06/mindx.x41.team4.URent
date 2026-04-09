import { X } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10"
        role="dialog"
        aria-modal="true"
        aria-label="Cài đặt"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Cài đặt</h2>
            <p className="mt-1 text-sm text-slate-500">
              Điều chỉnh tùy chọn hiển thị và thông báo.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
              <span>Chế độ tối</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-4 text-sm text-slate-700">
              <span>Thông báo</span>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="button"
              className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
              onClick={onClose}
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
