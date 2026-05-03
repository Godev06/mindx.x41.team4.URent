import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import { validateEmail, validatePassword } from "../../shared/utils/validation";
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
  const routeState = location.state as
    | { email?: string; otp?: string; flowVariant?: "default" | "setup-password" }
    | null;
  const isPasswordSetupFlow = routeState?.flowVariant === "setup-password";
  const initialEmail = useMemo(() => {
    return routeState?.email ?? authFlowStorage.getPendingResetEmail();
  }, [routeState]);
  const verifiedOtp = useMemo(() => {
    return routeState?.otp?.trim() ?? "";
  }, [routeState]);
  const [form, setForm] = useState({
    email: initialEmail,
    newPassword: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.newPassword);

    if (emailError || passwordError) {
      setErrorMessage(emailError || passwordError);
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
        otp: verifiedOtp,
        newPassword: form.newPassword,
      });

      showToast({
        title: isPasswordSetupFlow
          ? t.setupPasswordSuccessToast
          : t.resetSuccessToast,
        description: isPasswordSetupFlow
          ? t.setupPasswordSuccessToast
          : result.message,
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

  if (!verifiedOtp) {
    return <Navigate to={APP_ROUTES.forgotPassword} replace />;
  }

  return (
    <AuthLayout
      title={isPasswordSetupFlow ? t.setupPasswordTitle : t.resetTitle}
      description={isPasswordSetupFlow ? t.setupPasswordDesc : t.resetDesc}
      footer={
        <p>
          {isPasswordSetupFlow ? t.setupPasswordBack : t.resetBack}{" "}
          <Link to={APP_ROUTES.login} className={authUi.link}>
            {isPasswordSetupFlow ? t.setupPasswordBackLogin : t.resetBackLogin}
          </Link>
        </p>
      }
    >
      <form className={authUi.form} onSubmit={handleSubmit}>
        {errorMessage ? <AlertMessage message={errorMessage} /> : null}
        {isPasswordSetupFlow ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
            <p className="font-semibold">{t.setupPasswordNoticeTitle}</p>
            <p>{t.setupPasswordNoticeBody}</p>
          </div>
        ) : null}
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
          {isSubmitting
            ? isPasswordSetupFlow
              ? t.setupPasswordSubmitting
              : t.resetSubmitting
            : isPasswordSetupFlow
              ? t.setupPasswordSubmit
              : t.resetSubmit}
        </button>
      </form>
    </AuthLayout>
  );
}
