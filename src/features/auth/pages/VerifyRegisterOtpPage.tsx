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

export function VerifyRegisterOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyRegisterOtp } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const initialEmail = useMemo(() => {
    const value = location.state as { email?: string } | null;
    return value?.email ?? authFlowStorage.getPendingRegisterEmail();
  }, [location.state]);
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
      const result = await verifyRegisterOtp({
        email: form.email.trim(),
        otp: form.otp.trim(),
      });

      showToast({
        title: t.verifyRegSuccessToast,
        description: result.message,
        variant: "success",
      });

      if ("token" in result) {
        navigate(APP_ROUTES.home, { replace: true });
        return;
      }

      navigate(APP_ROUTES.login, {
        replace: true,
        state: { email: form.email.trim() },
      });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t.verifyRegTitle}
      description={t.verifyRegDesc}
      footer={
        <p>
          {t.verifyRegReregister}{" "}
          <Link to={APP_ROUTES.register} className={authUi.link}>
            {t.verifyRegBack}
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
          {isSubmitting ? t.verifyRegSubmitting : t.verifyRegSubmit}
        </button>
      </form>
    </AuthLayout>
  );
}
