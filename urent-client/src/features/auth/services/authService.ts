import { apiClient } from "../../../lib/api/apiClient";
import {
  ApiError,
  normalizeApiError,
} from "../../../lib/api/apiError";
import {
  mapAuthSession,
  mapAuthUser,
  mapMutationResult,
  unwrapApiData,
} from "../utils/authResponse";
import type {
  ForgotPasswordPayload,
  HealthStatus,
  LoginPayload,
  MutationResult,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
  AuthSession,
  AuthUser,
} from "../types";

const shouldFallbackToLegacyOtpEndpoint = (error: unknown) => {
  const apiError = normalizeApiError(error);
  return apiError.statusCode === 404 || apiError.statusCode === 405;
};

export const authService = {
  async checkHealth(): Promise<HealthStatus> {
    const response = await apiClient.get<unknown>("/health");
    return {
      ok: true,
      message:
        typeof unwrapApiData(response.data) === "string"
          ? String(unwrapApiData(response.data))
          : "Backend san sang.",
    };
  },

  async register(payload: RegisterPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>("/api/auth/register", payload);
    return mapMutationResult(response.data, "Da gui OTP dang ky den email cua ban.");
  },

  async login(payload: LoginPayload): Promise<AuthSession | MutationResult> {
    const response = await apiClient.post<unknown>("/api/auth/login", payload);
    return (
      mapAuthSession(response.data, "Dang nhap thanh cong.") ??
      mapMutationResult(
        response.data,
        "Dang nhap da duoc xu ly, vui long kiem tra phan hoi backend.",
      )
    );
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthSession | MutationResult> {
    try {
      const response = await apiClient.post<unknown>("/api/auth/verify-otp", payload);
      return (
        mapAuthSession(response.data, "Dang nhap thanh cong.") ??
        mapMutationResult(response.data, "Xac minh OTP thanh cong.")
      );
    } catch (error: unknown) {
      if (
        shouldFallbackToLegacyOtpEndpoint(error) &&
        (payload.purpose === "register" || payload.purpose === "login")
      ) {
        const legacyPath =
          payload.purpose === "register"
            ? "/api/auth/register/verify-otp"
            : "/api/auth/login/verify-otp";
        const legacyResponse = await apiClient.post<unknown>(legacyPath, {
          email: payload.email,
          otp: payload.otp,
        });

        return (
          mapAuthSession(legacyResponse.data, "Dang nhap thanh cong.") ??
          mapMutationResult(legacyResponse.data, "Xac minh OTP thanh cong.")
        );
      }

      throw error instanceof ApiError ? error : normalizeApiError(error);
    }
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>(
      "/api/auth/forgot-password",
      payload,
    );
    return mapMutationResult(response.data, "OTP dat lai mat khau da duoc gui.");
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>(
      "/api/auth/reset-password",
      {
        email: payload.email,
        otp: payload.otp,
        newPassword: payload.newPassword,
      },
    );
    return mapMutationResult(response.data, "Dat lai mat khau thanh cong.");
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<unknown>("/api/auth/me");
    const user = mapAuthUser(response.data);

    if (!user) {
      throw new Error("Khong the doc thong tin nguoi dung hien tai.");
    }

    return user;
  },
};
