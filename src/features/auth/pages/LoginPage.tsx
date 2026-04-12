import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import { validateEmail, validatePassword } from "../../shared/utils/validation";
import { normalizeApiError } from "../../../lib/api/apiError";
import { authUi } from "../styles";
import { useI18n } from "../../shared/context/LanguageContext";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    email?: string;
    from?: string;
  } | null;
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState({
    email: locationState?.email ?? "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTarget = useMemo(
    () => locationState?.from ?? APP_ROUTES.home,
    [locationState],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (emailError || passwordError) {
      setErrorMessage(emailError || passwordError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await login({
        email: form.email.trim(),
        password: form.password,
      });

      if ("token" in result) {
        showToast({
          title: t.loginSuccessToast,
          description: result.message,
          variant: "success",
        });
        navigate(redirectTarget, { replace: true });
        return;
      }

      setErrorMessage(result.message || t.loginErrorFallback);
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t.loginTitle}
      description={t.loginDesc}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-400">
            {t.loginNoAccount}{" "}
            <Link to={APP_ROUTES.register} className={authUi.link}>
              {t.loginRegisterLink}
            </Link>
          </span>
          <Link to={APP_ROUTES.forgotPassword} className={authUi.link}>
            {t.loginForgot}
          </Link>
        </div>
      }
    >
      <form className={authUi.form} onSubmit={handleSubmit}>
        {errorMessage ? <AlertMessage message={errorMessage} /> : null}
        <label className={authUi.label}>
          {t.loginEmailLabel}
          <div className={authUi.inputIconWrapper}>
            <Mail className={authUi.inputIconClass} size={18} />
            <input
              className={authUi.inputIcon}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="you@example.com"
            />
          </div>
        </label>
        <label className={authUi.label}>
          <span>{t.loginPwdLabel}</span>
          <div className={authUi.inputIconWrapper}>
            <Lock className={authUi.inputIconClass} size={18} />
            <input
              className={authUi.inputIcon}
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder={t.loginPwdPlaceholder}
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className={authUi.buttonPrimary}
        >
          {isSubmitting ? t.loginSubmitting : t.loginSubmit}
          <ArrowRight size={18} />
        </button>
      </form>
    </AuthLayout>
  );
}
