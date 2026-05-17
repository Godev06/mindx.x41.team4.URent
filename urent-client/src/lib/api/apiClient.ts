import axios from "axios";
import { API_REQUEST_TIMEOUT, AUTH_SESSION_EXPIRED_EVENT } from "../../features/user/auth/constants";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
} from "./tokenStorage";
import { normalizeApiError } from "./apiError";

const baseURL =
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)?.trim() || "http://localhost:5003";

export const apiClient = axios.create({
  baseURL,
  timeout: API_REQUEST_TIMEOUT,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error);

    if (apiError.statusCode === 401) {
      // Clear stored token and notify app that the session expired.
      // Do NOT force a navigation to the login page here — let
      // the app decide when to prompt the user to re-authenticate
      // (e.g., when they try to access a protected route).
      clearStoredAuthToken();
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(apiError);
  },
);
