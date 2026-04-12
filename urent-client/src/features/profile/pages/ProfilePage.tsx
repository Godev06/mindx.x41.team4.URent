import { useEffect, useMemo, useState } from "react";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { useAuth } from "../../auth/hooks/useAuth";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { PageLoader } from "../../shared/components/PageLoader";
import { useToast } from "../../shared/hooks/useToast";
import { profileService } from "../services/profileService";
import { normalizeApiError } from "../../../lib/api/apiError";
import {
  validateAvatarFile,
  validateProfileInput,
} from "../../shared/utils/validation";
import { useI18n } from "../../shared/context/LanguageContext";

export function ProfilePage() {
  const { user, refreshCurrentUser, replaceCurrentUser } = useAuth();
  const { showToast } = useToast();
  const { lang } = useI18n();
  const t =
    lang === "vi"
      ? {
          loading: "Đang tải hồ sơ của bạn...",
          profileTitle: "Thông tin cá nhân",
          profileDesc: "Xem và quản lý thông tin hồ sơ của bạn.",
          uploadAvatar: "Tải avatar mới",
          uploadingAvatar: "Đang tải avatar...",
          displayName: "Tên hiển thị",
          email: "Email",
          phone: "Số điện thoại",
          joinedDate: "Ngày tham gia",
          noData: "Chưa có dữ liệu",
          save: "Cập nhật hồ sơ",
          saving: "Đang lưu thay đổi...",
          profileUpdatedTitle: "Cập nhật hồ sơ thành công",
          profileUpdatedDesc: "Thông tin hồ sơ đã được đồng bộ với backend.",
          avatarUpdatedTitle: "Tải avatar thành công",
          avatarUpdatedDesc: "Ảnh đại diện mới đã được cập nhật.",
          userFallback: "U-Rent User",
        }
      : {
          loading: "Loading your profile...",
          profileTitle: "Profile",
          profileDesc: "View and manage your profile information.",
          uploadAvatar: "Upload new avatar",
          uploadingAvatar: "Uploading avatar...",
          displayName: "Display name",
          email: "Email",
          phone: "Phone number",
          joinedDate: "Joined date",
          noData: "No data available",
          save: "Update profile",
          saving: "Saving changes...",
          profileUpdatedTitle: "Profile updated successfully",
          profileUpdatedDesc: "Your profile was synced with the backend.",
          avatarUpdatedTitle: "Avatar uploaded successfully",
          avatarUpdatedDesc: "Your new avatar has been updated.",
          userFallback: "U-Rent User",
        };
  const [form, setForm] = useState({ displayName: "", bio: "", phone: "" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof form, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      phone: user.phone ?? "",
    });
  }, [user]);

  const avatarMeta = useMemo(() => {
    const displayName = user?.displayName ?? user?.email ?? t.userFallback;
    return getAvatarStyle(displayName);
  }, [t.userFallback, user?.displayName, user?.email]);

  if (!user) {
    return <PageLoader label={t.loading} />;
  }

  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const validationErrors = validateProfileInput(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const nextUser = await profileService.updateProfile({
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        phone: form.phone.trim(),
      });
      replaceCurrentUser(nextUser);
      showToast({
        title: t.profileUpdatedTitle,
        description: t.profileUpdatedDesc,
        variant: "success",
      });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
      await refreshCurrentUser();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileError = validateAvatarFile(file);
    if (fileError) {
      setErrorMessage(fileError);
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setIsUploadingAvatar(true);

    try {
      const nextUser = await profileService.uploadAvatar(file);
      replaceCurrentUser(nextUser);
      showToast({
        title: t.avatarUpdatedTitle,
        description: t.avatarUpdatedDesc,
        variant: "success",
      });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const inputClass =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/10";
  const fieldClass =
    "block rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700/60 dark:bg-slate-800/30 dark:text-slate-500";

  return (
    <div className="space-y-6 py-6">
      {/* Page header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          {t.profileTitle}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          {t.profileTitle}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t.profileDesc}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8 dark:border-slate-700/60 dark:bg-slate-800/40 dark:ring-white/5">
        <div className="space-y-8">
          {errorMessage ? <AlertMessage message={errorMessage} /> : null}

          {/* Avatar + identity */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-500/30"
                />
              ) : (
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ring-2 ring-teal-500/30 ${avatarMeta.colorClass}`}
                >
                  {avatarMeta.initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-teal-500 dark:border-slate-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.displayName}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:text-teal-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
                {isUploadingAvatar ? t.uploadingAvatar : t.uploadAvatar}
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-200/80 dark:bg-white/8" />

          {/* Form */}
          <form className="space-y-5" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={fieldClass}>
                {t.displayName}
                <input
                  type="text"
                  maxLength={100}
                  className={inputClass}
                  value={form.displayName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                />
                {errors.displayName ? (
                  <p className="mt-2 text-xs font-normal text-red-500">
                    {errors.displayName}
                  </p>
                ) : null}
              </label>

              <label className={fieldClass}>
                {t.email}
                <input
                  type="email"
                  disabled
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-400 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  value={user.email}
                />
              </label>

              <label className={fieldClass}>
                {t.phone}
                <input
                  type="tel"
                  className={inputClass}
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
                {errors.phone ? (
                  <p className="mt-2 text-xs font-normal text-red-500">
                    {errors.phone}
                  </p>
                ) : null}
              </label>

              <div className={fieldClass}>
                {t.joinedDate}
                <p className="mt-2 text-sm font-semibold normal-case tracking-normal text-slate-700 dark:text-slate-300">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                    : t.noData}
                </p>
              </div>
            </div>

            <label className={fieldClass}>
              Bio
              <textarea
                maxLength={200}
                rows={4}
                className={`${inputClass} resize-none`}
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                {errors.bio ? (
                  <p className="text-xs font-normal text-red-500">
                    {errors.bio}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs font-normal normal-case tracking-normal text-slate-400">
                  {form.bio.length}/200
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-900/20 transition hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              {isSaving ? t.saving : t.save}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
