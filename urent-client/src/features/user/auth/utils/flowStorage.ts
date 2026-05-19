import {
  AUTH_PENDING_LOGIN_EMAIL_KEY,
  AUTH_PENDING_REGISTER_EMAIL_KEY,
  AUTH_PENDING_RESET_EMAIL_KEY,
} from "../constants";

const read = (key: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  return sessionStorage.getItem(key) ?? "";
};

const write = (key: string, value: string) => {
  if (typeof window === "undefined") {
    return;
  }

  if (value.trim()) {
    sessionStorage.setItem(key, value.trim());
    return;
  }

  sessionStorage.removeItem(key);
};

export const authFlowStorage = {
  getPendingRegisterEmail: () => read(AUTH_PENDING_REGISTER_EMAIL_KEY),
  setPendingRegisterEmail: (value: string) => write(AUTH_PENDING_REGISTER_EMAIL_KEY, value),
  clearPendingRegisterEmail: () => write(AUTH_PENDING_REGISTER_EMAIL_KEY, ""),
  getPendingLoginEmail: () => read(AUTH_PENDING_LOGIN_EMAIL_KEY),
  setPendingLoginEmail: (value: string) => write(AUTH_PENDING_LOGIN_EMAIL_KEY, value),
  clearPendingLoginEmail: () => write(AUTH_PENDING_LOGIN_EMAIL_KEY, ""),
  getPendingResetEmail: () => read(AUTH_PENDING_RESET_EMAIL_KEY),
  setPendingResetEmail: (value: string) => write(AUTH_PENDING_RESET_EMAIL_KEY, value),
  clearPendingResetEmail: () => write(AUTH_PENDING_RESET_EMAIL_KEY, ""),
};
