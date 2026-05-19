export const AUTH_TOKEN_STORAGE_KEY = "auth_token";
export const AUTH_PENDING_REGISTER_EMAIL_KEY = "auth_pending_register_email";
export const AUTH_PENDING_LOGIN_EMAIL_KEY = "auth_pending_login_email";
export const AUTH_PENDING_RESET_EMAIL_KEY = "auth_pending_reset_email";
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";
export const API_REQUEST_TIMEOUT = 15000;

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  authOtp: "/auth/verify-otp",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  profile: "/profile",
} as const;
