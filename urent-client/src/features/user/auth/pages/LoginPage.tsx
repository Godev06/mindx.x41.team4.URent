import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { PageLoader } from "../../shared/components/PageLoader";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { useToast } from "../../shared/hooks/useToast";
import {
  validateEmail,
  validatePassword,
  validatePhone,
} from "../../shared/utils/validation";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { authUi } from "../styles";
import { useI18n } from "../../shared/context/LanguageContext";

type IdentifierMethod = "email" | "phone";
type LoginStep = "identify" | "password";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    email?: string;
    from?: string;
  } | null;
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState<LoginStep>("identify");
  const [resolvedMethod, setResolvedMethod] = useState<IdentifierMethod | null>(
    null,
  );
  const [resolvedIdentifier, setResolvedIdentifier] = useState("");
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [form, setForm] = useState({
    identifier: locationState?.email ?? "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTarget = useMemo(
    () => locationState?.from ?? APP_ROUTES.home,
    [locationState],
  );

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const resetToIdentifierStep = () => {
    setStep("identify");
    setResolvedMethod(null);
    setResolvedIdentifier("");
    setResolvedEmail("");
    setErrorMessage("");
    setForm((current) => ({ ...current, password: "" }));
  };

  const navigateToPasswordSetupOtp = (setupEmail: string) => {
    showToast({
      title: t.verifySetupPasswordTitle,
      description: t.setupPasswordToastDescription,
      variant: "info",
    });
    navigate(APP_ROUTES.authOtp, {
      replace: true,
      state: {
        email: setupEmail,
        purpose: "reset password",
        flowVariant: "setup-password",
      },
    });
  };

  const handleStartPasswordSetup = async () => {
    const setupEmail =
      resolvedEmail || (resolvedMethod === "email" ? resolvedIdentifier : "");

    if (!setupEmail) {
      setErrorMessage(t.loginErrorFallback);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await authService.forgotPassword({ email: setupEmail });
      navigateToPasswordSetupOtp(setupEmail);
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      showToast({
        title: t.loginSuccessToast,
        description: t.loginWithGoogle,
        variant: "success",
      });
      navigate(redirectTarget, { replace: true });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === "identify") {
      const trimmedIdentifier = form.identifier.trim();
      const emailError = validateEmail(trimmedIdentifier);
      const phoneError = validatePhone(trimmedIdentifier);

      if (emailError && phoneError) {
        setErrorMessage(t.loginIdentifierInvalid);
        return;
      }

      setErrorMessage("");
      setIsSubmitting(true);

      try {
        const identity = await authService.checkLoginIdentity({
          identifier: trimmedIdentifier,
        });

        if (identity.requiresPasswordSetup) {
          const setupEmail =
            identity.email ??
            (identity.method === "email" ? identity.identifier : "");

          if (!setupEmail) {
            setErrorMessage(t.loginErrorFallback);
            return;
          }

          navigateToPasswordSetupOtp(setupEmail);
          return;
        }

        setResolvedMethod(identity.method);
        setResolvedIdentifier(identity.identifier);
        setResolvedEmail(identity.email ?? "");
        setForm((current) => ({
          ...current,
          identifier: identity.identifier,
        }));
        setStep("password");
      } catch (error: unknown) {
        setErrorMessage(normalizeApiError(error).message);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const passwordError = validatePassword(form.password);

    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (!resolvedMethod || !resolvedIdentifier) {
      resetToIdentifierStep();
      setErrorMessage(t.loginIdentifierInvalid);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload =
        resolvedMethod === "email"
          ? { email: resolvedIdentifier, password: form.password }
          : { phone: resolvedIdentifier, password: form.password };

      const result = await login(payload);

      if ("token" in result) {
        showToast({
          title: t.loginSuccessToast,
          description: result.message,
          variant: "success",
        });
        navigate(redirectTarget, { replace: true });
        return;
      }

      if (result.requiresTwoFactor) {
        showToast({
          title: t.loginTwoFactorToastTitle,
          description: result.message,
          variant: "info",
        });
        navigate(APP_ROUTES.authOtp, {
          replace: true,
          state: {
            email: resolvedMethod === "email" ? resolvedIdentifier : undefined,
            phone: resolvedMethod === "phone" ? resolvedIdentifier : undefined,
            purpose: "login",
            from: redirectTarget,
          },
        });
        return;
      }

      if (result.requiresPasswordSetup) {
        const setupEmail =
          result.email ??
          (resolvedMethod === "email" ? resolvedIdentifier : "");

        if (!setupEmail) {
          setErrorMessage(result.message || t.loginErrorFallback);
          return;
        }

        navigateToPasswordSetupOtp(setupEmail);
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

        <fieldset
          disabled={isSubmitting || isGoogleSubmitting}
          className="space-y-4 disabled:opacity-60"
        >
          <label className={authUi.label}>
            {t.loginIdentifierLabel}
            <div className={authUi.inputIconWrapper}>
              <Mail className={authUi.inputIconClass} size={18} />
              <input
                className={authUi.inputIcon}
                type="text"
                autoComplete="username"
                value={form.identifier}
                readOnly={step === "password"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    identifier: event.target.value,
                  }))
                }
                placeholder={t.loginIdentifierPlaceholder}
              />
            </div>
            {step === "password" ? (
              <button
                type="button"
                onClick={resetToIdentifierStep}
                className="mt-2 text-sm font-medium text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
              >
                {t.loginIdentifierChange}
              </button>
            ) : null}
          </label>

          {step === "password" ? (
            <>
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
                type="button"
                onClick={handleStartPasswordSetup}
                className="text-left text-sm font-medium text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
              >
                {t.loginNoPasswordCta}
              </button>
            </>
          ) : null}
        </fieldset>
        <button
          type="submit"
          disabled={isSubmitting || isGoogleSubmitting}
          className={authUi.buttonPrimary}
        >
          {isSubmitting ? (
            <PageLoader
              inline
              label={
                step === "identify"
                  ? t.loginCheckingIdentity
                  : t.loginSubmitting
              }
            />
          ) : (
            <>
              {step === "identify" ? t.loginContinue : t.loginSubmit}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {step === "identify" ? (
          <>
            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-medium text-slate-400">
                {t.authOrDivider}
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-[#161b22] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isGoogleSubmitting ? (
                <PageLoader inline label={t.loginWithGoogle} />
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  {t.loginWithGoogle}
                </>
              )}
            </button>
          </>
        ) : null}
      </form>
    </AuthLayout>
  );
}
