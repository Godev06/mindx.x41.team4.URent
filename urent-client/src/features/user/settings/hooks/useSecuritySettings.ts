import { useState, useEffect, useCallback } from "react";
import { settingsService } from "../services/settingsService";
import { useToast } from "../../shared/hooks/useToast";
import { useI18n } from "../../shared/context/LanguageContext";
import { normalizeApiError } from "../../../../lib/api/apiError";

interface SecuritySettingsState {
  twoFactorEnabled: boolean;
  isPasswordSet: boolean;
  isLoading: boolean;
  isSaving2FA: boolean;
  isPasswordModalOpen: boolean;
  is2faModalOpen: boolean;
  pending2FAState: boolean;
}

export function useSecuritySettings() {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [state, setState] = useState<SecuritySettingsState>({
    twoFactorEnabled: false,
    isPasswordSet: true,
    isLoading: true,
    isSaving2FA: false,
    isPasswordModalOpen: false,
    is2faModalOpen: false,
    pending2FAState: false,
  });

  const loadSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const settings = await settingsService.getSettings();
      setState((prev) => ({
        ...prev,
        twoFactorEnabled: settings.twoFactorEnabled,
        isPasswordSet: settings.isPasswordSet ?? true,
      }));
    } catch (error: unknown) {
      showToast({
        title: t.settingsTwoFactor ?? "Two-Factor Authentication",
        description: normalizeApiError(error).message || (t.settingsTwoFactorLoadError ?? "Failed to load security settings"),
        variant: "error",
      });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [showToast, t]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleTwoFactorChange = useCallback(async (enabled: boolean) => {
    setState((prev) => ({ ...prev, isSaving2FA: true }));
    try {
      await settingsService.requestTwoFactorOtp();
      setState((prev) => ({
        ...prev,
        pending2FAState: enabled,
        is2faModalOpen: true,
      }));
    } catch (error: unknown) {
      showToast({
        title: t.settingsTwoFactor ?? "Two-Factor Authentication",
        description: normalizeApiError(error).message || "Không thể gửi mã xác nhận. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setState((prev) => ({ ...prev, isSaving2FA: false }));
    }
  }, [showToast, t]);

  const confirmTwoFactorChange = useCallback(async (otp: string) => {
    setState((prev) => ({ ...prev, isSaving2FA: true }));
    try {
      const settings = await settingsService.updateTwoFactorEnabled(state.pending2FAState, otp);
      setState((prev) => ({
        ...prev,
        twoFactorEnabled: settings.twoFactorEnabled,
        is2faModalOpen: false,
      }));
    } catch (error: unknown) {
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isSaving2FA: false }));
    }
  }, [state.pending2FAState]);

  const close2faModal = useCallback(() => {
    setState((prev) => ({ ...prev, is2faModalOpen: false }));
  }, []);

  const openPasswordModal = useCallback(() => {
    setState((prev) => ({ ...prev, isPasswordModalOpen: true }));
  }, []);

  const closePasswordModal = useCallback(() => {
    setState((prev) => ({ ...prev, isPasswordModalOpen: false }));
  }, []);

  const handlePasswordSuccess = useCallback(() => {
    setState((prev) => ({ ...prev, isPasswordSet: true }));
    showToast({
      title: t.settingsChangePassword ?? "Change Password",
      description: "Password updated successfully!",
      variant: "success",
    });
  }, [showToast, t]);

  return {
    ...state,
    handleTwoFactorChange,
    confirmTwoFactorChange,
    close2faModal,
    openPasswordModal,
    closePasswordModal,
    handlePasswordSuccess,
    refresh: loadSettings,
  };
}
