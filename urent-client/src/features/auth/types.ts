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

export type OtpPurpose = "register" | "login" | "reset password";

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface LoginPayload {
  email: string;
  password: string;
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
  requiresTwoFactor?: boolean;
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
  verifyOtp: (payload: VerifyOtpPayload) => Promise<AuthSession | MutationResult>;
  register: (payload: RegisterPayload) => Promise<MutationResult>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<MutationResult>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<MutationResult>;
  refreshCurrentUser: () => Promise<AuthUser | null>;
  replaceCurrentUser: (user: AuthUser) => void;
  logout: (options?: { redirectTo?: string; silent?: boolean }) => void;
}
