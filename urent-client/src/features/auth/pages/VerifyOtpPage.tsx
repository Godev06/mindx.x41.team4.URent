import { useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { OTPForm } from "../components/OTPForm";
import { APP_ROUTES } from "../constants";
import { authFlowStorage } from "../utils/flowStorage";
import { useToast } from "../../shared/hooks/useToast";
import { useI18n } from "../../shared/context/LanguageContext";
import type { OtpPurpose } from "../types";

interface VerifyOtpRouteState {
  email?: string;
  purpose?: OtpPurpose;
  from?: string;
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
        : t.verifyResetTitle;

  const description =
    purpose === "register"
      ? t.verifyRegDesc
      : purpose === "login"
        ? t.verifyLoginDesc
        : t.verifyResetDesc;

  const backLabel =
    purpose === "register"
      ? t.verifyRegBack
      : purpose === "login"
        ? t.verifyLoginBackLink
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

    navigate(APP_ROUTES.forgotPassword, { replace: true });
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
      <OTPForm
        email={email}
        purpose={purpose}
        onBack={onBack}
        onSuccess={({ otp, result }) => {
          if (purpose === "register") {
            showToast({
              title: t.otpRegisterSuccessToast,
              description: t.otpRegisterSuccessToast,
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

          navigate(APP_ROUTES.resetPassword, {
            replace: true,
            state: {
              email,
              otp,
            },
          });
        }}
      />
    </AuthLayout>
  );
}
