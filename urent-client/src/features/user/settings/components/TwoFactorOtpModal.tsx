import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, X, ShieldAlert } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { settingsService } from "../services/settingsService";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { OtpInput } from "../../shared/components/OtpInput";

interface TwoFactorOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (otp: string) => Promise<void>;
  isSaving: boolean;
}

export function TwoFactorOtpModal({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
}: TwoFactorOtpModalProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement>(null);
  const triggerCloseButtonRef = useRef<HTMLButtonElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError(null);
      setIsSubmitting(false);
      setIsResending(false);
    }
  }, [isOpen]);

  // Accessibility: focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalContainerRef.current) {
        const focusables = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleResendOtp = async () => {
    if (isResending) return;
    setIsResending(true);
    setError(null);
    try {
      await settingsService.requestTwoFactorOtp();
    } catch (err: unknown) {
      setError(normalizeApiError(err).message || "Không thể gửi lại mã OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError(t.otpRegisterVerifyFail || "OTP phải gồm 6 chữ số");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(otp);
    } catch (err: unknown) {
      setError(normalizeApiError(err).message || "Mã xác nhận không chính xác.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-2fa-otp"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop Panel */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        ref={modalContainerRef}
        className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
      >
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 id="modal-title-2fa-otp" className="text-lg font-bold text-slate-900 dark:text-white">
                {t.settingsTwoFactorOtpModalTitle ?? "Xác thực OTP 2FA"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã xác nhận đã gửi đến {user?.email}
              </p>
            </div>
          </div>
          <button
            ref={triggerCloseButtonRef}
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6">
              <AlertMessage variant="error" message={error} />
            </div>
          )}

          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 text-sm text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 mb-6">
            <p className="font-semibold">Bảo mật cấp cao</p>
            <p className="mt-1 text-xs">
              {t.settingsTwoFactorOtpModalDesc ?? "Vui lòng nhập mã OTP 6 chữ số được gửi tới email của bạn để xác nhận thay đổi cài đặt xác thực 2 lớp (2FA)."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Mã OTP (6 chữ số)
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={isSubmitting || isSaving}
                isError={!!error}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm"
            >
              {isResending ? "Đang gửi..." : "Gửi lại mã"}
            </button>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
            >
              {t.commonCancel || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSaving || otp.length !== 6}
              className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-70"
            >
              {isSubmitting || isSaving ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t.commonProcessing || "Processing..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>{t.settingsTwoFactorOtpModalConfirm ?? "Xác nhận"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
