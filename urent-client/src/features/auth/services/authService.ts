import { apiClient } from "../../../lib/api/apiClient";
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
  VerifyLoginOtpPayload,
  VerifyRegisterOtpPayload,
  AuthSession,
  AuthUser,
} from "../types";

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

  async verifyRegisterOtp(
    payload: VerifyRegisterOtpPayload,
  ): Promise<AuthSession | MutationResult> {
    const response = await apiClient.post<unknown>(
      "/api/auth/register/verify-otp",
      payload,
    );

    return (
      mapAuthSession(response.data, "Dang ky thanh cong.") ??
      mapMutationResult(response.data, "Dang ky thanh cong. Vui long dang nhap.")
    );
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

  async verifyLoginOtp(payload: VerifyLoginOtpPayload): Promise<AuthSession> {
    const response = await apiClient.post<unknown>(
      "/api/auth/login/verify-otp",
      payload,
    );

    const session = mapAuthSession(response.data, "Dang nhap thanh cong.");
    if (!session) {
      throw new Error("Phan hoi dang nhap khong chua token hop le.");
    }

    return session;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>(
      "/api/auth/forgot-password",
      payload,
    );
    return mapMutationResult(response.data, "OTP dat lai mat khau da duoc gui.");
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MutationResult> {
    const { otp, ...rest } = payload;
    const response = await apiClient.post<unknown>(
      "/api/auth/reset-password",
      {
        ...rest,
        token: otp,
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
