import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type PropsWithChildren,
} from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
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
} from "../../../../lib/api/tokenStorage";
import { AuthContext } from "./AuthContextObject";

async function hydrateUserFromSession(
  session: AuthSession | MutationResult,
): Promise<AuthSession> {
  if (!session.token) {
    throw new Error("Session token is missing");
  }

  setStoredAuthToken(session.token);

  if ("user" in session && session.user) {
    return session as AuthSession;
  }

  const currentUser = await authService.getCurrentUser();
  return {
    ...session,
    token: session.token,
    user: currentUser,
  } as AuthSession;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(
    Boolean(getStoredAuthToken()),
  );
  
  // Track if we've already tried to initialize in this mount (React StrictMode safe)
  const hasInitialized = useRef(false);
  // Track pending refresh request to prevent concurrent duplicate requests
  const refreshPromiseRef = useRef<Promise<AuthUser | null> | null>(null);

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

      if (!silent && window.location.pathname !== redirectTo) {
        navigate(redirectTo, {
          replace: true,
          state: { from: window.location.pathname },
        });
      }
    },
    [navigate],
  );

  const refreshCurrentUser = useCallback(async () => {
    const activeToken = getStoredAuthToken();

    if (!activeToken) {
      setToken(null);
      setUser(null);
      setIsInitializing(false);
      return null;
    }

    // Return the existing promise if a refresh is already in progress
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setIsInitializing(true);
    
    refreshPromiseRef.current = (async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setToken(activeToken);
        setUser(currentUser);
        return currentUser;
      } finally {
        setIsInitializing(false);
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
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
    
    // Prevent double-fetching in React StrictMode
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    void refreshCurrentUser().catch((error) => {
      console.error("AuthContext: refreshCurrentUser failed:", error);
      // Only log out if it's a 401 Unauthorized. Ignore network errors/timeouts to prevent random logouts.
      if (
        (error && typeof error === "object" && "statusCode" in error && error.statusCode === 401) ||
        (error && typeof error === "object" && "response" in error && (error as any).response?.status === 401)
      ) {
        logout({ silent: true });
      } else {
        setIsInitializing(false);
      }
    });
  }, [logout, refreshCurrentUser, token]);

  useEffect(() => {
    const handleSessionExpired = () => {
      // When session expires, clear local session silently and stay on
      // the current page (usually home). Prompting for login should
      // happen only when the user attempts a protected action.
      logout({ silent: true });
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
          authFlowStorage.clearPendingResetEmail();
          setToken(hydratedSession.token);
          setUser(hydratedSession.user);
          return hydratedSession;
        }

        if (result.requiresPasswordSetup) {
          authFlowStorage.clearPendingLoginEmail();
          authFlowStorage.setPendingResetEmail(
            result.email ?? payload.email ?? "",
          );
          return result;
        }

        authFlowStorage.setPendingLoginEmail(
          payload.email ?? payload.phone ?? "",
        );
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

        if ("token" in result && payload.purpose === "login") {
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
      loginWithGoogle: async (): Promise<AuthSession> => {
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);
        const idToken = await credential.user.getIdToken();
        const googleSession = await authService.loginWithGoogleIdToken(idToken);
        const session = await hydrateUserFromSession(googleSession);
        authFlowStorage.clearPendingResetEmail();
        setToken(session.token);
        setUser(session.user);
        return session;
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
