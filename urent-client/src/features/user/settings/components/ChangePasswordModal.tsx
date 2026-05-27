import React, { useState, useEffect, useRef } from "react";
import { Lock, X, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { OtpInput } from "../../shared/components/OtpInput";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isPasswordSet?: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
  isPasswordSet = true,
}: ChangePasswordModalProps) {
  const { t } = useI18n();
  const { user, verifyOtp, forgotPassword, resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step state: "sending_otp" | "otp" | "password"
  const [step, setStep] = useState<"sending_otp" | "otp" | "password">("sending_otp");
  const [verifiedToken, setVerifiedToken] = useState("");

  // OTP Form
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const hasSentOtp = useRef(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const triggerCloseButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-send OTP on modal open
  useEffect(() => {
    if (!isOpen) {
      hasSentOtp.current = false;
      return;
    }

    if (isOpen && user?.email && !hasSentOtp.current) {
      hasSentOtp.current = true;
      setStep("sending_otp");
      setVerifiedToken("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setOtpError(null);

      forgotPassword({ email: user.email })
        .then(() => setStep("otp"))
        .catch((err) => {
          setOtpError(normalizeApiError(err).message || "Không thể gửi OTP");
          setStep("otp");
        });
    }
  }, [isOpen, user?.email, forgotPassword]);

  // A11y Keyboard Event Handler: Focus trap & Escape closing
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
    if (!user?.email || isResending) return;
    setIsResending(true);
    setOtpError(null);
    try {
      await forgotPassword({ email: user.email });
    } catch (err: unknown) {
      setOtpError(normalizeApiError(err).message);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otp.trim() || otp.length !== 6) {
      setOtpError(t.otpRegisterVerifyFail || "OTP phải là 6 chữ số");
      return;
    }

    if (!user?.email) {
      setOtpError("User email not found");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await verifyOtp({
        email: user.email,
        otp: otp.trim(),
        purpose: isPasswordSet ? "reset password" : "create password",
      });

      const token = ("token" in result && result.token) ? String(result.token) : otp.trim();
      setVerifiedToken(token);
      setStep("password");
      setOtp("");
      setOtpError(null);
    } catch (err: unknown) {
      setOtpError(
        normalizeApiError(err).message ||
          t.otpRegisterVerifyFail ||
          "OTP verification failed"
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t.authPasswordsNotMatch || "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        t.authPasswordTooShort || "Password must be at least 6 characters"
      );
      return;
    }

    if (!user?.email || !verifiedToken) {
      setError("Token xác minh không hợp lệ. Vui lòng thử lại.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email: user.email,
        otp: verifiedToken,
        newPassword,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(normalizeApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeTitle = isPasswordSet ? t.settingsChangePassword : "Tạo mật khẩu";
  const stepTitle = step === "password" ? purposeTitle : "Xác minh OTP";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-change-password"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop panel */}
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
              <Lock size={20} />
            </div>
            <div>
              <h2 id="modal-title-change-password" className="text-lg font-bold text-slate-900 dark:text-white">
                {stepTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === "password"
                  ? "Update your security credentials"
                  : `Mã OTP đã được gửi đến ${user?.email}`}
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

        {step === "sending_otp" ? (
          <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
            {/* Centralized unified spinner instead of custom loader */}
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent mb-4" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Đang gửi mã OTP đến email của bạn...
            </p>
          </div>
        ) : step === "otp" ? (
          <form onSubmit={handleOtpSubmit} className="p-6">
            {otpError && (
              <div className="mb-6">
                <AlertMessage variant="error" message={otpError} />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2 flex flex-col">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mã OTP (6 chữ số)
                </label>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={isVerifyingOtp}
                  isError={!!otpError}
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
                disabled={isVerifyingOtp || otp.length !== 6}
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-70"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{t.commonProcessing || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Xác minh</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="p-6">
            {error && (
              <div className="mb-6">
                <AlertMessage variant="error" message={error} />
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400">
              <p className="font-semibold">Mã xác minh hợp lệ!</p>
              <p className="mt-1">Vui lòng thiết lập mật khẩu mới bên dưới.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 flex flex-col">
                <label htmlFor="modal-new-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t.authNewPassword || "New Password"}
                </label>
                <div className="relative">
                  <input
                    id="modal-new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus-visible:ring-2 focus-visible:ring-teal-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-teal-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <label htmlFor="modal-confirm-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t.authConfirmPassword || "Confirm Password"}
                </label>
                <div className="relative">
                  <input
                    id="modal-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus-visible:ring-2 focus-visible:ring-teal-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-teal-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
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
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{t.commonProcessing || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>{t.settingsChange || "Change"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
