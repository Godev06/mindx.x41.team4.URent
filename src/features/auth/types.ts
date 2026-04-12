export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface VerifyRegisterOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyLoginOtpPayload {
  email: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ProfileUpdatePayload {
  displayName: string;
  bio: string;
  phone: string;
}

export interface MutationResult {
  message: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser | null;
  message: string;
}

export interface HealthStatus {
  ok: boolean;
  message: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession | MutationResult>;
  verifyLoginOtp: (payload: VerifyLoginOtpPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<MutationResult>;
  verifyRegisterOtp: (
    payload: VerifyRegisterOtpPayload,
  ) => Promise<AuthSession | MutationResult>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<MutationResult>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<MutationResult>;
  refreshCurrentUser: () => Promise<AuthUser | null>;
  replaceCurrentUser: (user: AuthUser) => void;
  logout: (options?: { redirectTo?: string; silent?: boolean }) => void;
}
