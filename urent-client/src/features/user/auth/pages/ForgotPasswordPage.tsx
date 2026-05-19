import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants";
import { AuthLayout } from "../components/AuthLayout";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import { validateEmail } from "../../shared/utils/validation";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { authUi } from "../styles";
import { useI18n } from "../../shared/context/LanguageContext";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(email);

    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await forgotPassword({ email: email.trim() });
      const isCreatePassword = result.message.toLowerCase().includes("create") || result.message.toLowerCase().includes("tạo");

      showToast({
        title: result.message,
        description: result.message,
        variant: "success",
      });
      navigate(APP_ROUTES.authOtp, {
        state: {
          email: email.trim(),
          purpose: isCreatePassword ? "create password" : "reset password",
          flowVariant: isCreatePassword ? "setup-password" : "default",
        },
      });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t.forgotTitle}
      description={t.forgotDesc}
      footer={
        <p>
          {t.forgotRemember}{" "}
          <Link to={APP_ROUTES.login} className={authUi.link}>
            {t.forgotBackLogin}
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
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className={authUi.buttonPrimary}
        >
          {isSubmitting ? t.forgotSubmitting : t.forgotSubmit}
        </button>
      </form>
    </AuthLayout>
  );
}
