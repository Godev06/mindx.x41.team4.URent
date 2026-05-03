import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCustomToken,
  signInWithPhoneNumber,
  linkWithCredential,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { useAuth } from "../../auth/hooks/useAuth";
import { authService } from "../../auth/services/authService";
import { useI18n } from "../../shared/context/LanguageContext";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (idToken: string) => Promise<void>;
}

type Step = "input" | "verify" | "done";

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.startsWith("00")) {
    return `+${digitsOnly.slice(2)}`;
  }

  if (digitsOnly.startsWith("84")) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.startsWith("0")) {
    return `+84${digitsOnly.slice(1)}`;
  }

  return `+${digitsOnly}`;
}

function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

function getFirebaseErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

function getFirebaseTokenResponseMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("customData" in error)) {
    return null;
  }

  const customData = (error as { customData?: unknown }).customData;
  if (
    typeof customData !== "object" ||
    customData === null ||
    !("_tokenResponse" in customData)
  ) {
    return null;
  }

  const tokenResponse = (customData as { _tokenResponse?: unknown })
    ._tokenResponse;
  if (typeof tokenResponse !== "object" || tokenResponse === null) {
    return null;
  }

  const candidateKeys = ["errorMessage", "message", "error"] as const;
  for (const key of candidateKeys) {
    const value = (tokenResponse as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getFirebaseErrorReason(error: unknown): string | null {
  const messageParts: string[] = [];

  if (error instanceof Error && error.message) {
    messageParts.push(error.message);
  }

  const tokenResponseMessage = getFirebaseTokenResponseMessage(error);
  if (tokenResponseMessage) {
    messageParts.push(tokenResponseMessage);
  }

  if (messageParts.length === 0) {
    return null;
  }

  const message = messageParts.join(" | ").toUpperCase();
  const reasonPatterns = [
    "INVALID_APP_CREDENTIAL",
    "CAPTCHA_CHECK_FAILED",
    "OPERATION_NOT_ALLOWED",
    "BILLING_NOT_ENABLED",
    "QUOTA_EXCEEDED",
    "TOO_MANY_ATTEMPTS_TRY_LATER",
    "INVALID_PHONE_NUMBER",
    "APP_NOT_AUTHORIZED",
    "API_KEY_HTTP_REFERRER_BLOCKED",
  ] as const;

  for (const pattern of reasonPatterns) {
    if (message.includes(pattern)) {
      return pattern;
    }
  }

  return null;
}

function mapPhoneAuthError(error: unknown, fallback: string): string {
  const code = getFirebaseErrorCode(error);
  const reason = getFirebaseErrorReason(error);
  const tokenResponseMessage = getFirebaseTokenResponseMessage(error);
  const message = error instanceof Error ? error.message : String(error);

  switch (reason) {
    case "INVALID_APP_CREDENTIAL":
      return "Firebase App Credential khong hop le. Kiem tra API key, authorized domains va tai lai trang.";
    case "CAPTCHA_CHECK_FAILED":
      return "Xac minh reCAPTCHA that bai. Thu lai hoac doi trinh duyet/mang khac.";
    case "OPERATION_NOT_ALLOWED":
      return "Phone Authentication chua duoc bat trong Firebase Console.";
    case "BILLING_NOT_ENABLED":
      return "Du an Firebase/Google Cloud chua bat billing nen khong gui duoc OTP that.";
    case "QUOTA_EXCEEDED":
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Vuot gioi han OTP. Vui long doi mot luc roi thu lai.";
    case "INVALID_PHONE_NUMBER":
      return "So dien thoai khong hop le theo chuan E.164.";
    case "APP_NOT_AUTHORIZED":
    case "API_KEY_HTTP_REFERRER_BLOCKED":
      return "Domain hien tai chua duoc phep su dung Firebase Auth voi API key nay.";
    default:
      break;
  }

  switch (code) {
    case "auth/invalid-phone-number":
      return "Số điện thoại chưa đúng định dạng quốc tế. Vui lòng kiểm tra lại.";
    case "auth/captcha-check-failed":
      return "Xác minh reCAPTCHA thất bại. Vui lòng thử gửi lại mã.";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.";
    case "auth/quota-exceeded":
      return "Đã vượt giới hạn gửi OTP của Firebase. Vui lòng thử lại sau.";
    case "auth/operation-not-allowed":
      return "Phone Authentication chưa được bật trong Firebase Console.";
    case "auth/app-not-authorized":
      return "Domain hiện tại chưa được cho phép trong Firebase Authentication.";
    case "auth/invalid-app-credential":
      return "Xác thực ứng dụng không hợp lệ. Vui lòng tải lại trang và thử lại.";
    case "auth/missing-phone-number":
      return "Thiếu số điện thoại để gửi mã OTP.";
    case "auth/invalid-verification-code":
      return "Mã OTP không đúng. Vui lòng kiểm tra lại.";
    case "auth/code-expired":
      return "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.";
    case "auth/credential-already-in-use":
    case "auth/phone-number-already-exists":
      return "Số điện thoại này đã được liên kết với tài khoản khác.";
    case "auth/provider-already-linked":
      return "Tài khoản này đã liên kết số điện thoại rồi.";
    default:
      if (reason) {
        return `${fallback} (${reason})`;
      }

      if (tokenResponseMessage) {
        return `${fallback} (${tokenResponseMessage})`;
      }

      if (code) {
        return `${fallback} (${code})`;
      }

      return message || fallback;
  }
}

function buildPhoneAuthDiagnostic(error: unknown): string {
  const code = getFirebaseErrorCode(error);
  const reason = getFirebaseErrorReason(error);
  const tokenResponseMessage = getFirebaseTokenResponseMessage(error);
  const message = error instanceof Error ? error.message : String(error);

  const parts = [
    code ? `code=${code}` : null,
    reason ? `reason=${reason}` : null,
    tokenResponseMessage ? `token=${tokenResponseMessage}` : null,
    message ? `msg=${message}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  onSuccess,
}: PhoneVerificationModalProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaMountRef = useRef<HTMLDivElement | null>(null);

  // Cleanup reCAPTCHA on unmount / close
  useEffect(() => {
    if (!isOpen) {
      setStep("input");
      setPhone("");
      setCode("");
      setError(null);
      setCountdown(0);
      confirmationRef.current = null;
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      recaptchaMountRef.current = null;

      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = "";
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      recaptchaMountRef.current = null;

      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setInterval(() => setCountdown((n) => n - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const initRecaptcha = () => {
    const hostContainer = recaptchaContainerRef.current;
    if (!hostContainer) return;

    // Clear previous instance
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }

    hostContainer.innerHTML = "";
    const mountElement = document.createElement("div");
    hostContainer.appendChild(mountElement);
    recaptchaMountRef.current = mountElement;

    recaptchaRef.current = new RecaptchaVerifier(auth, mountElement, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        setError("reCAPTCHA expired, please try again.");
        recaptchaRef.current?.clear();
        recaptchaRef.current = null;
        recaptchaMountRef.current = null;

        if (recaptchaContainerRef.current) {
          recaptchaContainerRef.current.innerHTML = "";
        }
      },
    });
  };

  const ensureFirebaseSession = async () => {
    const currentUserEmail = auth.currentUser?.email?.trim().toLowerCase();
    const appUserEmail = user?.email?.trim().toLowerCase();

    if (auth.currentUser && appUserEmail && currentUserEmail === appUserEmail) {
      return auth.currentUser;
    }

    const customToken = await authService.getFirebaseCustomToken();
    const credential = await signInWithCustomToken(auth, customToken);
    return credential.user;
  };

  const handleSendCode = async () => {
    setError(null);
    const normalized = normalizePhone(phone);

    if (!isValidPhone(normalized)) {
      setError(t.settingsPhoneVerifyInvalidPhone);
      return;
    }

    setIsSending(true);
    try {
      await ensureFirebaseSession();
      initRecaptcha();
      const appVerifier = recaptchaRef.current!;
      const confirmation = await signInWithPhoneNumber(
        auth,
        normalized,
        appVerifier,
      );
      confirmationRef.current = confirmation;
      setStep("verify");
      setCountdown(60);
    } catch (err: unknown) {
      const friendlyMessage = mapPhoneAuthError(
        err,
        "Khong the gui ma OTP luc nay.",
      );
      if (import.meta.env.DEV) {
        const diagnostic = buildPhoneAuthDiagnostic(err);
        setError(
          diagnostic ? `${friendlyMessage} (${diagnostic})` : friendlyMessage,
        );
      } else {
        setError(friendlyMessage);
      }
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      recaptchaMountRef.current = null;
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = "";
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Vui lòng nhập đúng 6 chữ số.");
      return;
    }

    if (!confirmationRef.current) {
      setError("Phiên xác minh hết hạn, vui lòng gửi lại mã.");
      return;
    }

    setIsVerifying(true);
    try {
      const currentUser = await ensureFirebaseSession();
      const credential = PhoneAuthProvider.credential(
        confirmationRef.current.verificationId,
        code,
      );
      await linkWithCredential(currentUser, credential);
      const idToken = await currentUser.getIdToken(true);
      await onSuccess(idToken);
      setStep("done");
    } catch (err: unknown) {
      const friendlyMessage = mapPhoneAuthError(
        err,
        "Khong the xac minh ma OTP luc nay.",
      );
      if (import.meta.env.DEV) {
        const diagnostic = buildPhoneAuthDiagnostic(err);
        setError(
          diagnostic ? `${friendlyMessage} (${diagnostic})` : friendlyMessage,
        );
      } else {
        setError(friendlyMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setCode("");
    setError(null);
    await handleSendCode();
  };

  if (!isOpen) return null;

  const stepDot = (n: 1 | 2, active: Step, doneStep: Step) => {
    const isDone = active === "done" || active === doneStep;
    const isCurrent = active === (n === 1 ? "input" : "verify");
    return (
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          isDone
            ? "bg-teal-500 text-white"
            : isCurrent
              ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        }`}
      >
        {isDone && n === 1 && active === "verify" ? (
          <CheckCircle2 size={13} strokeWidth={2.5} />
        ) : (
          n
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={!isSending && !isVerifying ? onClose : undefined}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10">
        {/* Decorative blobs */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-500/8 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
              <Phone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.settingsPhoneVerifyModalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Firebase Phone Auth
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying || isSending}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          {step !== "done" && (
            <div className="mb-6 flex items-center gap-2">
              {stepDot(1, step, "verify")}
              <span
                className={`text-xs font-semibold ${step === "input" ? "text-teal-700 dark:text-teal-300" : "text-slate-400"}`}
              >
                {t.settingsPhoneVerifyStep1}
              </span>
              <ChevronRight
                size={14}
                className="text-slate-300 dark:text-slate-600"
              />
              {stepDot(2, step, "done")}
              <span
                className={`text-xs font-semibold ${step === "verify" ? "text-teal-700 dark:text-teal-300" : "text-slate-400"}`}
              >
                {t.settingsPhoneVerifyStep2}
              </span>
            </div>
          )}

          {/* Step 1 — Enter phone */}
          {step === "input" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isSending && handleSendCode()
                  }
                  placeholder={t.settingsPhoneVerifyPhonePlaceholder}
                  disabled={isSending}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400/50"
                />
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Ví dụ: 0912345678 hoặc +84912345678
                </p>
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || !phone.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                {isSending ? (
                  <>
                    <Loader2
                      size={16}
                      strokeWidth={2.5}
                      className="animate-spin"
                    />
                    {t.settingsPhoneVerifySending}
                  </>
                ) : (
                  t.settingsPhoneVerifySendCode
                )}
              </button>
            </div>
          )}

          {/* Step 2 — Enter OTP */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-teal-200/70 bg-teal-50/70 px-4 py-3 text-sm text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                {t.settingsPhoneVerifySmsSent}{" "}
                <span className="font-bold">{normalizePhone(phone)}</span>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t.settingsPhoneVerifyCodeLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    setError(null);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isVerifying && handleVerify()
                  }
                  placeholder={t.settingsPhoneVerifyCodePlaceholder}
                  disabled={isVerifying}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
                />
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                {isVerifying ? (
                  <>
                    <Loader2
                      size={16}
                      strokeWidth={2.5}
                      className="animate-spin"
                    />
                    {t.settingsPhoneVerifyConfirming}
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} strokeWidth={2.5} />
                    {t.settingsPhoneVerifyConfirm}
                  </>
                )}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setCode("");
                    setError(null);
                  }}
                  disabled={isVerifying}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ← Đổi số điện thoại
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isVerifying || countdown > 0}
                  className="text-xs font-semibold text-teal-600 transition hover:text-teal-700 disabled:opacity-40 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  {countdown > 0
                    ? `${t.settingsPhoneVerifyResend} (${countdown}s)`
                    : t.settingsPhoneVerifyResend}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300">
                <CheckCircle2 size={36} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.settingsPhoneVerifySuccessTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t.settingsPhoneVerifySuccess}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-300"
              >
                Đóng
              </button>
            </div>
          )}
        </div>

        {/* Invisible reCAPTCHA container */}
        <div
          ref={recaptchaContainerRef}
          className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
        />
      </div>
    </div>
  );
}
