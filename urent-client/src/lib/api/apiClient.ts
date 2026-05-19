import axios, { AxiosError } from "axios";
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
  timeout: API_REQUEST_TIMEOUT, // 15000ms
  headers: {
    "Content-Type": "application/json",
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

let isRetrying = false; // Prevent recursive loops on 401

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = normalizeApiError(error);

    // Timeout or Network Error Retry Logic (for idempotent methods)
    const originalRequest = (error as AxiosError)?.config as any;
    if (
      originalRequest &&
      !originalRequest._retry &&
      ((error as AxiosError)?.code === 'ECONNABORTED' || (error as AxiosError)?.message === 'Network Error')
    ) {
      originalRequest._retry = true;
      // Retry once after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiClient(originalRequest);
    }

    if (apiError.statusCode === 401 && !isRetrying) {
      isRetrying = true;
      // Clear stored token and notify app that the session expired.
      clearStoredAuthToken();
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
      
      // Delay resetting the flag slightly to debounce multiple simultaneous 401s
      setTimeout(() => {
        isRetrying = false;
      }, 1000);
    }

    return Promise.reject(apiError);
  },
);
