import { useEffect, useState } from "react";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../../shared/context/LanguageContext";
import { validateOtp } from "../../shared/utils/validation";
import { authUi } from "../styles";
import { normalizeApiError } from "../../../lib/api/apiError";
import type { AuthSession, MutationResult, OtpPurpose } from "../types";

export interface OTPFormSuccessPayload {
  otp: string;
  result: AuthSession | MutationResult;
}

interface OTPFormProps {
  email: string;
  purpose: OtpPurpose;
  onSuccess: (payload: OTPFormSuccessPayload) => void;
  onBack: () => void;
  onResend?: () => Promise<void>;
}

const RESEND_COUNTDOWN_SECONDS = 60;

export function OTPForm({
  email,
  purpose,
  onSuccess,
  onBack,
  onResend,
}: OTPFormProps) {
  const { verifyOtp } = useAuth();
  const { t } = useI18n();
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdown]);

  const verifyFailedMessage =
    purpose === "register"
      ? t.otpRegisterVerifyFail
      : purpose === "login"
        ? t.otpLoginVerifyFail
        : t.otpResetVerifyFail;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const otpError = validateOtp(otp);
    if (otpError) {
      setErrorMessage(otpError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await verifyOtp({
        email: email.trim(),
        otp: otp.trim(),
        purpose,
      });

      onSuccess({
        otp: otp.trim(),
        result,
      });
    } catch (error: unknown) {
      const apiError = normalizeApiError(error);
      if (apiError.statusCode) {
        setErrorMessage(verifyFailedMessage);
        return;
      }

      setErrorMessage(apiError.message || verifyFailedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!onResend || countdown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setErrorMessage("");

    try {
      await onResend();
      setCountdown(RESEND_COUNTDOWN_SECONDS);
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className={authUi.form} onSubmit={handleSubmit}>
      {errorMessage ? <AlertMessage message={errorMessage} /> : null}

      <label className={authUi.label}>
        {t.emailLabel}
        <input
          className={authUi.input}
          type="email"
          value={email}
          readOnly
          disabled
          placeholder="you@example.com"
        />
      </label>

      <label className={authUi.label}>
        {t.otpLabel}
        <input
          className={authUi.input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otp}
          onChange={(event) =>
            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder={t.otpPlaceholder}
        />
      </label>

      <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
        <button type="button" onClick={onBack} className={authUi.helperAction}>
          {t.otpBackButton}
        </button>

        {onResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className={authUi.helperAction}
          >
            {isResending
              ? t.otpResendSubmitting
              : countdown > 0
                ? `${t.otpResendCountdownPrefix} ${countdown}s`
                : t.otpResendNow}
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={authUi.buttonPrimary}
      >
        {isSubmitting ? t.otpVerifySubmitting : t.otpVerifySubmit}
      </button>
    </form>
  );
}
