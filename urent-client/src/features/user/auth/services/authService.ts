import { apiClient } from "../../../../lib/api/apiClient";
import {
  mapAuthSession,
  mapAuthUser,
  mapMutationResult,
  unwrapApiData,
} from "../utils/authResponse";
import type {
  CheckLoginIdentityPayload,
  CheckLoginIdentityResult,
  ForgotPasswordPayload,
  HealthStatus,
  LoginPayload,
  MutationResult,
  RegisterPayload,
  ResetPasswordPayload,
  ResendOtpPayload,
  VerifyOtpPayload,
  AuthSession,
  AuthUser,
} from "../types";

export const authService = {
  async checkLoginIdentity(
    payload: CheckLoginIdentityPayload,
  ): Promise<CheckLoginIdentityResult> {
    const response = await apiClient.post<unknown>(
      "/api/v1/auth/check-login-identity",
      {
        identifier: payload.identifier,
      },
    );

    const data = unwrapApiData(response.data) as Partial<CheckLoginIdentityResult>;

    if (
      !data ||
      data.exists !== true ||
      (data.method !== "email" && data.method !== "phone") ||
      typeof data.identifier !== "string"
    ) {
      throw new Error("Khong the xac dinh tai khoan dang nhap.");
    }

    return {
      exists: true,
      method: data.method,
      identifier: data.identifier,
      email: typeof data.email === "string" ? data.email : undefined,
      requiresPasswordSetup:
        typeof data.requiresPasswordSetup === "boolean"
          ? data.requiresPasswordSetup
          : undefined,
    };
  },

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
    const response = await apiClient.post<unknown>("/api/v1/auth/register", {
      username: payload.username,
      ...(payload.displayName ? { displayName: payload.displayName } : {}),
      email: payload.email,
      password: payload.password,
    });
    return mapMutationResult(response.data, "Da gui OTP dang ky den email cua ban.");
  },

  async login(payload: LoginPayload): Promise<AuthSession | MutationResult> {
    const response = await apiClient.post<unknown>("/api/v1/auth/login", payload);
    return (
      mapAuthSession(response.data, "Dang nhap thanh cong.") ??
      mapMutationResult(
        response.data,
        "Dang nhap da duoc xu ly, vui long kiem tra phan hoi backend.",
      )
    );
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthSession | MutationResult> {
    const response = await apiClient.post<unknown>("/api/v1/auth/verify-otp", payload);
    return (
      mapAuthSession(response.data, "Dang nhap thanh cong.") ??
      mapMutationResult(response.data, "Xac minh OTP thanh cong.")
    );
  },

  async resendOtp(payload: ResendOtpPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>("/api/v1/auth/resend-otp", payload);
    return mapMutationResult(response.data, "OTP da duoc gui lai.");
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>(
      "/api/v1/auth/forgot-password",
      payload,
    );
    return mapMutationResult(response.data, "OTP dat lai mat khau da duoc gui.");
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MutationResult> {
    const response = await apiClient.post<unknown>(
      "/api/v1/auth/reset-password",
      {
        email: payload.email,
        otp: payload.otp,
        newPassword: payload.newPassword,
      },
    );
    return mapMutationResult(response.data, "Dat lai mat khau thanh cong.");
  },

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<unknown>("/api/v1/auth/me");
    const user = mapAuthUser(response.data);

    if (!user) {
      throw new Error("Khong the doc thong tin nguoi dung hien tai.");
    }

    return user;
  },

  async loginWithGoogleIdToken(idToken: string): Promise<AuthSession> {
    const response = await apiClient.post<unknown>("/api/v1/auth/login", {
      idToken,
    });
    const session = mapAuthSession(response.data, "Dang nhap Google thanh cong.");

    if (!session) {
      throw new Error("Phan hoi Google login khong chua token hop le.");
    }

    return session;
  },

  async getFirebaseCustomToken(): Promise<string> {
    const response = await apiClient.get<{ token?: string }>(
      "/api/v1/auth/firebase/custom-token",
    );
    const token = response.data?.token;

    if (typeof token !== "string" || !token.trim()) {
      throw new Error("Khong nhan duoc Firebase custom token hop le.");
    }

    return token;
  },
};
