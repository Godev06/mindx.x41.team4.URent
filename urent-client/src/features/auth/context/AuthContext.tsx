import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES, AUTH_SESSION_EXPIRED_EVENT } from "../constants";
import { authService } from "../services/authService";
import { authFlowStorage } from "../utils/flowStorage";
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  MutationResult,
  RegisterPayload,
  ForgotPasswordPayload,
  OtpPurpose,
  ResetPasswordPayload,
  VerifyOtpPayload,
} from "../types";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from "../../../lib/api/tokenStorage";
import { AuthContext } from "./AuthContextObject";

async function hydrateUserFromSession(
  session: AuthSession,
): Promise<AuthSession> {
  setStoredAuthToken(session.token);

  if (session.user) {
    return session;
  }

  const currentUser = await authService.getCurrentUser();
  return {
    ...session,
    user: currentUser,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(
    Boolean(getStoredAuthToken()),
  );

  const logout = useCallback(
    ({
      redirectTo = APP_ROUTES.login,
      silent = false,
    }: { redirectTo?: string; silent?: boolean } = {}) => {
      clearStoredAuthToken();
      authFlowStorage.clearPendingLoginEmail();
      authFlowStorage.clearPendingRegisterEmail();
      authFlowStorage.clearPendingResetEmail();
      setToken(null);
      setUser(null);
      setIsInitializing(false);

      if (!silent && location.pathname !== redirectTo) {
        navigate(redirectTo, {
          replace: true,
          state: { from: location.pathname },
        });
      }
    },
    [location.pathname, navigate],
  );

  const refreshCurrentUser = useCallback(async () => {
    const activeToken = getStoredAuthToken();

    if (!activeToken) {
      setToken(null);
      setUser(null);
      setIsInitializing(false);
      return null;
    }

    setIsInitializing(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setToken(activeToken);
      setUser(currentUser);
      return currentUser;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const clearPendingEmailByPurpose = useCallback((purpose: OtpPurpose) => {
    if (purpose === "login") {
      authFlowStorage.clearPendingLoginEmail();
      return;
    }

    if (purpose === "register") {
      authFlowStorage.clearPendingRegisterEmail();
      return;
    }

    authFlowStorage.clearPendingResetEmail();
  }, []);

  useEffect(() => {
    if (!token) {
      setIsInitializing(false);
      return;
    }

    void refreshCurrentUser().catch(() => {
      logout({ silent: true });
    });
  }, [logout, refreshCurrentUser, token]);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout({ redirectTo: APP_ROUTES.login, silent: false });
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, [logout]);

  const value = useMemo(() => {
    return {
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isInitializing,
      login: async (
        payload: LoginPayload,
      ): Promise<AuthSession | MutationResult> => {
        const result = await authService.login(payload);

        if ("token" in result) {
          const hydratedSession = await hydrateUserFromSession(result);
          authFlowStorage.clearPendingLoginEmail();
          setToken(hydratedSession.token);
          setUser(hydratedSession.user);
          return hydratedSession;
        }

        authFlowStorage.setPendingLoginEmail(payload.email);
        return result;
      },
      verifyOtp: async (
        payload: VerifyOtpPayload,
      ): Promise<AuthSession | MutationResult> => {
        const result = await authService.verifyOtp(payload);
        clearPendingEmailByPurpose(payload.purpose);

        if (payload.purpose === "login" && !("token" in result)) {
          throw new Error("Phan hoi dang nhap khong chua token hop le.");
        }

        if ("token" in result) {
          const hydratedSession = await hydrateUserFromSession(result);
          setToken(hydratedSession.token);
          setUser(hydratedSession.user);
          return hydratedSession;
        }

        return result;
      },
      register: async (payload: RegisterPayload): Promise<MutationResult> => {
        const result = await authService.register(payload);
        authFlowStorage.setPendingRegisterEmail(payload.email);
        return result;
      },
      forgotPassword: async (
        payload: ForgotPasswordPayload,
      ): Promise<MutationResult> => {
        const result = await authService.forgotPassword(payload);
        authFlowStorage.setPendingResetEmail(payload.email);
        return result;
      },
      resetPassword: async (
        payload: ResetPasswordPayload,
      ): Promise<MutationResult> => {
        const result = await authService.resetPassword(payload);
        authFlowStorage.clearPendingResetEmail();
        return result;
      },
      refreshCurrentUser,
      replaceCurrentUser: (nextUser: AuthUser) => {
        setUser(nextUser);
      },
      logout,
    };
  }, [
    clearPendingEmailByPurpose,
    isInitializing,
    logout,
    refreshCurrentUser,
    token,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
