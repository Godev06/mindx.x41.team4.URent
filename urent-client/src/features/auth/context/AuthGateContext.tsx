import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogIn, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { APP_ROUTES } from "../constants";
import { useI18n } from "../../shared/context/LanguageContext";

interface AuthGateContextValue {
  guardedNavigate: (path: string) => void;
}

const AuthGateContext = createContext<AuthGateContextValue>({
  guardedNavigate: () => {},
});

export function useAuthGate() {
  return useContext(AuthGateContext);
}

const PUBLIC_PREFIXES = ["/product/", "/auth/"];
const PUBLIC_EXACT = new Set([
  "/",
  "/products",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function isPublicPath(path: string): boolean {
  return (
    PUBLIC_EXACT.has(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPath, setPendingPath] = useState<string>("/");

  const guardedNavigate = (path: string) => {
    if (isAuthenticated || isPublicPath(path)) {
      navigate(path);
      return;
    }
    setPendingPath(path);
    setShowModal(true);
  };

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowModal(false);
      setIsLoading(false);
      navigate(APP_ROUTES.login, { state: { from: pendingPath } });
    }, 800);
  };

  const handleClose = () => {
    if (isLoading) return;
    setShowModal(false);
  };

  return (
    <AuthGateContext.Provider value={{ guardedNavigate }}>
      {children}

      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-gate-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Card */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_80px_-20px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0f1929]">
            <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />
            <div className="p-6">
              {/* Close */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Đóng"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/30">
                <LogIn size={24} strokeWidth={2} className="text-white" />
              </div>

              <h2
                id="auth-gate-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {t.authGateModalTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t.authGateModalDesc}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-600 hover:to-cyan-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        size={16}
                        strokeWidth={2.5}
                        className="animate-spin"
                      />
                      <span>Đang chuyển hướng...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={16} strokeWidth={2.5} />
                      {t.authGateModalConfirm}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/8"
                >
                  {t.authGateModalCancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}
