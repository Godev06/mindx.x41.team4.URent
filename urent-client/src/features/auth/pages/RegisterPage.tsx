import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import { validateEmail, validatePassword } from "../../shared/utils/validation";
import { normalizeApiError } from "../../../lib/api/apiError";
import { authUi } from "../styles";
import { useI18n } from "../../shared/context/LanguageContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState({
    username: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = form.username.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (!username) {
      setErrorMessage(t.registerErrUsername);
      return;
    }

    if (!phone) {
      setErrorMessage(t.registerErrPhone);
      return;
    }

    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      setErrorMessage(t.registerErrPhoneInvalid);
      return;
    }

    if (!address) {
      setErrorMessage(t.registerErrAddress);
      return;
    }

    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage(t.registerErrConfirmPwd);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await register({
        email: form.email.trim(),
        password: form.password,
      });
      showToast({
        title: t.registerSuccessToast,
        description: result.message,
        variant: "success",
      });
      navigate(APP_ROUTES.registerVerifyOtp, {
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
      title={t.registerTitle}
      description={t.registerDesc}
      footer={
        <p>
          {t.registerHasAccount}{" "}
          <Link to={APP_ROUTES.login} className={authUi.link}>
            {t.registerLoginLink}
          </Link>
        </p>
      }
    >
      <form className={authUi.form} onSubmit={handleSubmit}>
        {errorMessage ? <AlertMessage message={errorMessage} /> : null}

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={authUi.label}>
              {t.registerUsernameLabel}
              <input
                className={authUi.input}
                type="text"
                autoComplete="name"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder={t.registerUsernamePlaceholder}
              />
            </label>

            <label className={authUi.label}>
              {t.registerPhoneLabel}
              <input
                className={authUi.input}
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="0901234567"
              />
            </label>

            <label className={`md:col-span-2 ${authUi.label}`}>
              {t.registerAddressLabel}
              <input
                className={authUi.input}
                type="text"
                autoComplete="street-address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                placeholder={t.registerAddressPlaceholder}
              />
            </label>
          </div>

          <div className="h-px bg-slate-200/80 dark:bg-slate-800" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={`md:col-span-2 ${authUi.label}`}>
              {t.emailLabel}
              <input
                className={authUi.input}
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
            </label>

            <label className={authUi.label}>
              {t.registerPwdLabel}
              <input
                className={authUi.input}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder={t.registerPwdPlaceholder}
              />
            </label>

            <label className={authUi.label}>
              {t.registerConfirmPwdLabel}
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
                placeholder={t.registerConfirmPwdPlaceholder}
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={authUi.buttonPrimary}
        >
          {isSubmitting ? t.registerSubmitting : t.registerSubmit}
        </button>

        <p className="text-center text-xs text-slate-500">{t.registerTerms}</p>
      </form>
    </AuthLayout>
  );
}
