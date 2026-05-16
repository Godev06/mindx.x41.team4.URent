import { useState, useEffect, useRef } from "react";
import { Lock, X, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { normalizeApiError } from "../../../../lib/api/apiError";

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
  const [step, setStep] = useState<"sending_otp" | "otp" | "password">(
    "sending_otp",
  );
  const [verifiedToken, setVerifiedToken] = useState("");

  // For custom OTP form inside modal
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const hasSentOtp = useRef(false);

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

      // Send OTP automatically when modal opens
      forgotPassword({ email: user.email })
        .then(() => setStep("otp"))
        .catch((err) => {
          setOtpError(normalizeApiError(err).message || "Không thể gửi OTP");
          setStep("otp");
        });
    }
  }, [isOpen, user?.email, forgotPassword]);

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

      // Extract the new verified UUID token from result
      const token = ("token" in result && result.token) ? result.token : otp.trim();
      setVerifiedToken(token);
      setStep("password");
      setOtp("");
      setOtpError(null);
    } catch (err: unknown) {
      setOtpError(
        normalizeApiError(err).message ||
          t.otpRegisterVerifyFail ||
          "OTP verification failed",
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
        t.authPasswordTooShort || "Password must be at least 6 characters",
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

  const purposeTitle = isPasswordSet
    ? t.settingsChangePassword
    : "Tạo mật khẩu";
  const stepTitle = step === "password" ? purposeTitle : "Xác minh OTP";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
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
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {step === "sending_otp" ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-teal-500" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Đang gửi mã OTP đến email của bạn...
            </p>
          </div>
        ) : step === "otp" ? (
          <form onSubmit={handleOtpSubmit} className="p-6">
            {otpError && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                {otpError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mã OTP (6 chữ số)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 disabled:opacity-50"
              >
                {isResending ? "Đang gửi..." : "Gửi lại mã"}
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.commonCancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isVerifyingOtp || otp.length !== 6}
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/50 disabled:opacity-70"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t.commonProcessing || "Processing..."}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Xác minh
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="p-6">
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400">
              <p className="font-semibold">Mã xác minh hợp lệ!</p>
              <p className="mt-1">Vui lòng thiết lập mật khẩu mới bên dưới.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t.authNewPassword || "New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-teal-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-teal-400"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t.authConfirmPassword || "Confirm Password"}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-teal-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-teal-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.commonCancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/50 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t.commonProcessing || "Processing..."}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    {t.settingsChange || "Change"}
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
