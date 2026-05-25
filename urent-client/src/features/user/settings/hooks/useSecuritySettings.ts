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
      const settings = await settingsService.updateTwoFactorEnabled(enabled);
      setState((prev) => ({ ...prev, twoFactorEnabled: settings.twoFactorEnabled }));
      showToast({
        title: t.settingsTwoFactorUpdated ?? "2FA Updated",
        description: settings.twoFactorEnabled
          ? t.settingsTwoFactorEnabled ?? "Two-Factor Authentication has been enabled."
          : t.settingsTwoFactorDisabled ?? "Two-Factor Authentication has been disabled.",
        variant: "success",
      });
    } catch (error: unknown) {
      showToast({
        title: t.settingsTwoFactor ?? "Two-Factor Authentication",
        description: normalizeApiError(error).message,
        variant: "error",
      });
    } finally {
      setState((prev) => ({ ...prev, isSaving2FA: false }));
    }
  }, [showToast, t]);

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
    openPasswordModal,
    closePasswordModal,
    handlePasswordSuccess,
    refresh: loadSettings,
  };
}
