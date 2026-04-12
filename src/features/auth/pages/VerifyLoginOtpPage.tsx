import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import { validateEmail, validateOtp } from "../../shared/utils/validation";
import { authFlowStorage } from "../utils/flowStorage";
import { normalizeApiError } from "../../../lib/api/apiError";
import { authUi } from "../styles";
import { useI18n } from "../../shared/context/LanguageContext";

export function VerifyLoginOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyLoginOtp } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const routeState = location.state as { email?: string; from?: string } | null;
  const initialEmail = useMemo(() => {
    return routeState?.email ?? authFlowStorage.getPendingLoginEmail();
  }, [routeState]);
  const [form, setForm] = useState({ email: initialEmail, otp: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(form.email);
    const otpError = validateOtp(form.otp);

    if (emailError || otpError) {
      setErrorMessage(emailError || otpError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await verifyLoginOtp({
        email: form.email.trim(),
        otp: form.otp.trim(),
      });

      showToast({
        title: t.verifyLoginSuccessToast,
        description: result.message,
        variant: "success",
      });

      navigate(routeState?.from ?? APP_ROUTES.home, { replace: true });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t.verifyLoginTitle}
      description={t.verifyLoginDesc}
      footer={
        <p>
          {t.verifyLoginBack}{" "}
          <Link to={APP_ROUTES.login} className={authUi.link}>
            {t.verifyLoginBackLink}
          </Link>
        </p>
      }
    >
      <form className={authUi.form} onSubmit={handleSubmit}>
        {errorMessage ? <AlertMessage message={errorMessage} /> : null}
        <label className={authUi.label}>
          {t.emailLabel}
          <input
            className={authUi.input}
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="you@example.com"
          />
        </label>
        <label className={authUi.label}>
          {t.otpLabel}
          <input
            className={authUi.input}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={form.otp}
            onChange={(event) =>
              setForm((current) => ({ ...current, otp: event.target.value }))
            }
            placeholder={t.otpPlaceholder}
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className={authUi.buttonPrimary}
        >
          {isSubmitting ? t.verifyLoginSubmitting : t.verifyLoginSubmit}
        </button>
      </form>
    </AuthLayout>
  );
}
