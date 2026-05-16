import { useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { OTPForm } from "../components/OTPForm";
import { APP_ROUTES } from "../constants";
import { authFlowStorage } from "../utils/flowStorage";
import { authService } from "../services/authService";
import { useToast } from "../../shared/hooks/useToast";
import { useI18n } from "../../shared/context/LanguageContext";
import type { OtpPurpose } from "../types";

interface VerifyOtpRouteState {
  email?: string;
  purpose?: OtpPurpose;
  from?: string;
  flowVariant?: "default" | "setup-password";
}

const resolvePendingEmail = (purpose: OtpPurpose) => {
  if (purpose === "register") {
    return authFlowStorage.getPendingRegisterEmail();
  }

  if (purpose === "login") {
    return authFlowStorage.getPendingLoginEmail();
  }

  return authFlowStorage.getPendingResetEmail();
};

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();

  const routeState = (location.state as VerifyOtpRouteState | null) ?? null;
  const purpose = routeState?.purpose;
  const isPasswordSetupFlow =
    purpose === "create password" ||
    (purpose === "reset password" &&
      routeState?.flowVariant === "setup-password");
  const email = useMemo(() => {
    if (!purpose) {
      return "";
    }

    return (routeState?.email ?? resolvePendingEmail(purpose)).trim();
  }, [purpose, routeState?.email]);

  if (!purpose || !email) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }

  const title =
    purpose === "register"
      ? t.verifyRegTitle
      : purpose === "login"
        ? t.verifyLoginTitle
        : isPasswordSetupFlow
          ? t.verifySetupPasswordTitle
          : t.verifyResetTitle;

  const description =
    purpose === "register"
      ? t.verifyRegDesc
      : purpose === "login"
        ? t.verifyLoginDesc
        : isPasswordSetupFlow
          ? t.verifySetupPasswordDesc
          : t.verifyResetDesc;

  const backLabel =
    purpose === "register"
      ? t.verifyRegBack
      : purpose === "login"
        ? t.verifyLoginBackLink
        : isPasswordSetupFlow
          ? t.verifySetupPasswordBack
          : t.verifyResetBack;

  const onBack = () => {
    if (purpose === "register") {
      navigate(APP_ROUTES.register, { replace: true });
      return;
    }

    if (purpose === "login") {
      navigate(APP_ROUTES.login, { replace: true });
      return;
    }

    navigate(
      isPasswordSetupFlow ? APP_ROUTES.login : APP_ROUTES.forgotPassword,
      { replace: true },
    );
  };

  return (
    <AuthLayout
      title={title}
      description={description}
      footer={
        <p>
          <button
            type="button"
            onClick={onBack}
            className="font-bold text-[#00bfa5] transition hover:text-[#00d4ff] hover:underline"
          >
            {backLabel}
          </button>
        </p>
      }
    >
      {purpose === "register" ? (
        <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
          <p className="font-semibold">{t.verifyRegNoticeTitle}</p>
          <p>
            {t.verifyRegNoticeBody}{" "}
            <span className="font-medium break-all">{email}</span>
          </p>
        </div>
      ) : isPasswordSetupFlow ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">{t.verifySetupPasswordNoticeTitle}</p>
          <p>{t.verifySetupPasswordNoticeBody}</p>
        </div>
      ) : null}
      <OTPForm
        email={email}
        purpose={purpose}
        onBack={onBack}
        onResend={async () => {
          await authService.resendOtp({ email, purpose });
        }}
        onSuccess={({ otp, result }) => {
          if (purpose === "register") {
            showToast({
              title: t.otpRegisterSuccessToast,
              description: t.otpRegisterSuccessToastDesc,
              variant: "success",
            });
            navigate(APP_ROUTES.login, {
              replace: true,
              state: { email },
            });
            return;
          }

          if (purpose === "login") {
            showToast({
              title: t.verifyLoginSuccessToast,
              description: result.message,
              variant: "success",
            });
            navigate(routeState?.from ?? APP_ROUTES.home, { replace: true });
            return;
          }

          const verifiedToken = "token" in result ? result.token : otp;

          navigate(APP_ROUTES.resetPassword, {
            replace: true,
            state: {
              email,
              otp: verifiedToken,
              flowVariant: routeState?.flowVariant,
            },
          });
        }}
      />
    </AuthLayout>
  );
}
