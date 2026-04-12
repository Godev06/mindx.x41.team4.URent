import axios from "axios";
import {
  API_REQUEST_TIMEOUT,
  APP_ROUTES,
  AUTH_SESSION_EXPIRED_EVENT,
} from "../../features/auth/constants";
import { clearStoredAuthToken, getStoredAuthToken } from "./tokenStorage";
import { normalizeApiError } from "./apiError";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5003";

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
      clearStoredAuthToken();
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));

      const currentPath = window.location.pathname;
      if (currentPath !== APP_ROUTES.login) {
        window.history.replaceState(null, "", APP_ROUTES.login);
      }
    }

    return Promise.reject(apiError);
  },
);
