import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import {
  validateEmail,
  validateOtp,
  validatePassword,
} from "../../shared/utils/validation";
import { authFlowStorage } from "../utils/flowStorage";
import { normalizeApiError } from "../../../lib/api/apiError";
import { authUi } from "../styles";
import { useI18n } from "../../shared/context/LanguageContext";

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const initialEmail = useMemo(() => {
    const state = location.state as { email?: string } | null;
    return state?.email ?? authFlowStorage.getPendingResetEmail();
  }, [location.state]);
  const [form, setForm] = useState({
    email: initialEmail,
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(form.email);
    const otpError = validateOtp(form.otp);
    const passwordError = validatePassword(form.newPassword);

    if (emailError || otpError || passwordError) {
      setErrorMessage(emailError || otpError || passwordError);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage(t.resetErrConfirmPwd);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await resetPassword({
        email: form.email.trim(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
      });

      showToast({
        title: t.resetSuccessToast,
        description: result.message,
        variant: "success",
      });
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
      title={t.resetTitle}
      description={t.resetDesc}
      footer={
        <p>
          {t.resetBack}{" "}
          <Link to={APP_ROUTES.login} className={authUi.link}>
            {t.resetBackLogin}
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
        <label className={authUi.label}>
          {t.resetNewPwdLabel}
          <input
            className={authUi.input}
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                newPassword: event.target.value,
              }))
            }
            placeholder={t.resetNewPwdPlaceholder}
          />
        </label>
        <label className={authUi.label}>
          {t.resetConfirmPwdLabel}
          <input
            className={authUi.input}
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
            placeholder={t.resetConfirmPwdPlaceholder}
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className={authUi.buttonPrimary}
        >
          {isSubmitting ? t.resetSubmitting : t.resetSubmit}
        </button>
      </form>
    </AuthLayout>
  );
}
