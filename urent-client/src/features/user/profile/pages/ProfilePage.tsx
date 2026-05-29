import { useEffect, useMemo, useState } from "react";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { useAuth } from "../../auth/hooks/useAuth";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { PageLoader } from "../../shared/components/PageLoader";
import { useToast } from "../../shared/hooks/useToast";
import { profileService } from "../services/profileService";
import { normalizeApiError } from "../../../../lib/api/apiError";
import {
  validateAvatarFile,
  validateProfileInput,
} from "../../shared/utils/validation";
import { useI18n } from "../../shared/context/LanguageContext";
import { AddressSelector } from "../../shared/components/AddressSelector";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  CheckCircle2,
  Info,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
  FileText
} from "lucide-react";

export function ProfilePage() {
  const { user, refreshCurrentUser, replaceCurrentUser } = useAuth();
  const { showToast } = useToast();
  const { t, lang } = useI18n();
  const [form, setForm] = useState({ displayName: "", bio: "", phone: "", address: "" });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
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
      address: user.address ?? "",
    });
  }, [user]);

  const avatarMeta = useMemo(() => {
    const displayName =
      user?.displayName ?? user?.email ?? t.profileUserFallback;
    return getAvatarStyle(displayName);
  }, [t.profileUserFallback, user?.displayName, user?.email]);

  const completeness = useMemo(() => {
    let score = 0;
    if (user?.avatarUrl) score += 20;
    if (form.displayName?.trim()) score += 20;
    if (user?.email?.trim()) score += 20;
    if (form.phone?.trim()) score += 20;
    if (form.address?.trim()) score += 20;
    return score;
  }, [user?.avatarUrl, user?.email, form.displayName, form.phone, form.address]);

  if (!user) {
    return <PageLoader label={t.profileLoading} />;
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
        address: form.address.trim(),
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
        title: t.profileAvatarUpdatedTitle,
        description: t.profileAvatarUpdatedDesc,
        variant: "success",
      });
    } catch (error: unknown) {
      setErrorMessage(normalizeApiError(error).message);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleCancel = () => {
    setForm({
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
    });
    setErrors({});
    setErrorMessage("");
    setIsEditingAddress(false);
  };

  const inputClass =
    "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-400/10";

  return (
    <div className="space-y-6 py-6 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div>
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-350">
          <Sparkles size={11} className="inline shrink-0" />
          {t.profileTitle}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t.profileTitle}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-450">
          {t.profileDesc}
        </p>
      </div>

      {/* 2. Hero Banner & Avatar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/85 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/10">
        {/* Banner Cover */}
        <div className="h-32 w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-800 dark:from-teal-850 dark:via-emerald-900 dark:to-slate-855" />
        
        {/* Profile Identity Details Overlay */}
        <div className="px-6 pb-6 pt-0 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end -mt-10 sm:-mt-12">
            {/* Sleek Clickable Avatar Container */}
            <div className="relative shrink-0">
              <label
                className={`group relative block h-24 w-24 cursor-pointer overflow-hidden rounded-full ring-4 shadow-md transition-all ${
                  !user.avatarUrl
                    ? "ring-amber-500/70 hover:ring-amber-500 dark:ring-amber-500/50"
                    : "ring-white dark:ring-slate-900 hover:ring-teal-500/50"
                }`}
              >
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar || isSaving}
                />
                
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center text-3xl font-extrabold text-white transition duration-300 group-hover:scale-105 ${avatarMeta.colorClass}`}
                  >
                    {avatarMeta.initials}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/65 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {isUploadingAvatar ? (
                    <RefreshCw size={18} className="animate-spin text-teal-400" />
                  ) : (
                    <>
                       <Camera size={18} className="animate-pulse" />
                       <span className="mt-1 text-[8px] font-black uppercase tracking-widest text-slate-200">
                         TẢI ẢNH
                       </span>
                    </>
                  )}
                </div>

                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 text-white">
                    <RefreshCw size={18} className="animate-spin text-teal-400" />
                  </div>
                )}
              </label>

              {/* Alert dot if Avatar is missing */}
              {!user.avatarUrl && (
                <span className="absolute bottom-0 right-0 rounded-full border border-white bg-amber-500 p-1 text-white shadow-md dark:border-slate-900 animate-bounce pointer-events-none">
                  <AlertCircle size={10} />
                </span>
              )}
            </div>

            {/* Identity info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {user.displayName || t.profileUserFallback}
                </h2>
                {completeness === 100 && (
                  <ShieldCheck size={18} className="text-teal-500 shrink-0" title={t.profileSecuredAccount} />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-505 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Summary & Progress */}
        <div className="space-y-6 lg:col-span-1">
          {/* Completeness Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/20 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                {t.profileCompleteness}
              </h3>
              <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-black text-teal-600 dark:text-teal-400 animate-pulse">
                {completeness}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${completeness}%` }}
              />
            </div>

            {/* Tips / Feedback */}
            <p className="text-xs font-semibold leading-relaxed text-slate-550 dark:text-slate-400">
              {completeness < 100 ? (
                <span className="flex items-start gap-1.5">
                  <Info size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    {lang === "vi"
                      ? `Hồ sơ của bạn đạt ${completeness}%. Hãy hoàn thiện các mục màu vàng bên dưới để đạt độ uy tín tối đa 100%!`
                      : `Your profile is at ${completeness}%. Complete the amber items below to achieve maximum 100% trust level!`}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold">
                  <CheckCircle2 size={14} className="shrink-0 text-teal-550" />
                  <span>
                    {lang === "vi"
                      ? "Hồ sơ của bạn đã hoàn tất 100%! Độ uy tín của tài khoản đã ở mức tối đa."
                      : "Your profile is 100% complete! Credibility has reached maximum levels."}
                  </span>
                </span>
              )}
            </p>

            {/* INTERACTIVE COMPLETENESS CHECKLIST */}
            <div className="space-y-2 pt-3.5 border-t border-slate-100 dark:border-slate-850">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1.5">
                {lang === "vi" ? "Danh sách cần hoàn thiện:" : "Completeness Checklist:"}
              </span>
              <div className="grid gap-2.5">
                {/* 1. Avatar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {lang === "vi" ? "Ảnh đại diện" : "Profile Picture"}
                  </span>
                  {user.avatarUrl ? (
                    <span className="inline-flex items-center gap-1 font-bold text-teal-605 dark:text-teal-400">
                      <CheckCircle2 size={12} className="text-teal-500" />
                      {lang === "vi" ? "Đã có" : "Completed"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById("avatar-file-input");
                        fileInput?.click();
                      }}
                      className="inline-flex items-center gap-1 font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition hover:underline"
                    >
                      <AlertCircle size={12} className="animate-bounce text-amber-500" />
                      {lang === "vi" ? "Tải ảnh lên" : "Upload picture"}
                    </button>
                  )}
                </div>

                {/* 2. Display Name */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {t.profileDisplayName}
                  </span>
                  {form.displayName?.trim() ? (
                    <span className="inline-flex items-center gap-1 font-bold text-teal-605 dark:text-teal-400">
                      <CheckCircle2 size={12} className="text-teal-500" />
                      {lang === "vi" ? "Đã điền" : "Completed"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-black text-amber-600 dark:text-amber-400">
                      <AlertCircle size={12} className="text-amber-500" />
                      {lang === "vi" ? "Bắt buộc" : "Required"}
                    </span>
                  )}
                </div>

                {/* 3. Phone */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {t.profilePhone}
                  </span>
                  {form.phone?.trim() ? (
                    <span className="inline-flex items-center gap-1 font-bold text-teal-605 dark:text-teal-400">
                      <CheckCircle2 size={12} className="text-teal-500" />
                      {lang === "vi" ? "Đã có" : "Completed"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const phoneInput = document.getElementById("phone-input");
                        phoneInput?.focus();
                        phoneInput?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="inline-flex items-center gap-1 font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition hover:underline animate-pulse"
                    >
                      <AlertCircle size={12} className="text-amber-500 shrink-0" />
                      {lang === "vi" ? "Thêm số điện thoại" : "Add phone"}
                    </button>
                  )}
                </div>

                {/* 4. Address */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {t.profileAddress}
                  </span>
                  {form.address?.trim() ? (
                    <span className="inline-flex items-center gap-1 font-bold text-teal-605 dark:text-teal-400">
                      <CheckCircle2 size={12} className="text-teal-500" />
                      {lang === "vi" ? "Đã có" : "Completed"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAddress(true);
                        setTimeout(() => {
                          const addressBlock = document.getElementById("address-block");
                          addressBlock?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);
                      }}
                      className="inline-flex items-center gap-1 font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition hover:underline animate-pulse"
                    >
                      <AlertCircle size={12} className="text-amber-500 shrink-0" />
                      {lang === "vi" ? "Thiết lập địa chỉ" : "Configure address"}
                    </button>
                  )}
                </div>

                {/* 5. Bio */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {lang === "vi" ? "Tiểu sử" : "Bio"}
                  </span>
                  {form.bio?.trim() ? (
                    <span className="inline-flex items-center gap-1 font-bold text-teal-605 dark:text-teal-400">
                      <CheckCircle2 size={12} className="text-teal-500" />
                      {lang === "vi" ? "Đã có" : "Completed"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const bioInput = document.getElementById("bio-input");
                        bioInput?.focus();
                        bioInput?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="inline-flex items-center gap-1 font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition hover:underline animate-pulse"
                    >
                      <AlertCircle size={12} className="text-amber-500 shrink-0" />
                      {lang === "vi" ? "Viết giới thiệu" : "Add bio"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary Stats */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/20 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3">
              {t.profileCardSummaryTitle}
            </h3>

            <div className="space-y-4">
              {/* Joined Date */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                    {t.profileJoinedDate}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : t.profileNoData}
                  </span>
                </div>
              </div>

              {/* Status Active */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:text-teal-400 shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                    {lang === "vi" ? "Trạng thái tài khoản" : "Account Status"}
                  </span>
                  <span className="text-xs font-bold text-teal-605 dark:text-teal-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping shrink-0" />
                    {t.profileStatusActive}
                  </span>
                </div>
              </div>

              {/* Account Security */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                    {lang === "vi" ? "Bảo mật tài khoản" : "Account Security"}
                  </span>
                  <span className="text-xs font-bold text-emerald-605 dark:text-emerald-400">
                    {t.profileSecuredAccount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Main Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/20">
            {errorMessage && (
              <div className="mb-6">
                <AlertMessage message={errorMessage} />
              </div>
            )}

            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              
              {/* 1. Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="flex items-center gap-2">
                    <User size={14} />
                    {lang === "vi" ? "Thông tin cơ bản" : "Basic Information"}
                  </span>
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Display Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>{t.profileDisplayName}</span>
                      {!form.displayName?.trim() && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-405 animate-pulse">
                          {lang === "vi" ? "Bắt buộc" : "Required"}
                        </span>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <User size={15} className="absolute left-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={100}
                        className={`${inputClass} pl-11`}
                        value={form.displayName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            displayName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    {errors.displayName && (
                      <p className="text-xs font-semibold text-red-505 flex items-center gap-1 mt-1">
                        <AlertCircle size={12} />
                        {errors.displayName}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>{t.profilePhone}</span>
                      {!form.phone?.trim() && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse">
                          {lang === "vi" ? "Chưa cập nhật" : "Empty"}
                        </span>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={15} className="absolute left-4 text-slate-400 pointer-events-none" />
                      <input
                        id="phone-input"
                        type="tel"
                        className={`${inputClass} pl-11`}
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs font-semibold text-red-505 flex items-center gap-1 mt-1">
                        <AlertCircle size={12} />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Read-only Email Field */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    {t.profileEmail}
                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={15} className="absolute left-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-11 text-sm font-semibold text-slate-405 outline-none select-none cursor-not-allowed dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-500"
                      value={user.email}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-start gap-1.5 mt-1.5">
                    <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>{t.profileEmailHint}</span>
                  </p>
                </div>
              </div>

              {/* 2. Contact Address Section */}
              <div id="address-block" className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="flex items-center gap-2">
                    <MapPin size={14} />
                    {t.profileAddress}
                  </span>
                  {!form.address?.trim() && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse normal-case tracking-normal">
                      {lang === "vi" ? "Chưa thiết lập" : "Not configured"}
                    </span>
                  )}
                </h3>

                {/* Intelligent address container */}
                {!isEditingAddress ? (
                   <div className={`rounded-2xl border p-4 flex items-start justify-between gap-4 shadow-sm transition-all ${
                     !form.address?.trim()
                       ? "border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]"
                       : "border-slate-150 bg-slate-50/30 dark:border-slate-855 dark:bg-slate-900/20"
                   }`}>
                     <div className="flex items-start gap-3">
                       <div className={`mt-0.5 rounded-xl p-2 shrink-0 ${
                         !form.address?.trim()
                           ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse"
                           : "bg-teal-500/10 text-teal-600 dark:text-teal-450"
                       }`}>
                         <MapPin size={16} />
                       </div>
                       <div>
                         <span className="text-[9px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest block mb-1">
                           {t.profileCurrentAddress}
                         </span>
                         {form.address ? (
                           <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                             {form.address}
                           </p>
                         ) : (
                           <p className="text-xs font-semibold text-amber-650 dark:text-amber-400 italic">
                             {t.profileAddressNotConfigured}
                           </p>
                         )}
                       </div>
                     </div>
                     <button
                       type="button"
                       onClick={() => setIsEditingAddress(true)}
                       className="text-[9px] font-black text-teal-600 hover:text-teal-700 dark:text-teal-450 dark:hover:text-teal-300 transition shrink-0 uppercase tracking-widest"
                     >
                       {form.address ? t.profileChangeAddress : t.profileAddAddress}
                     </button>
                   </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 leading-relaxed">
                        <Info size={13} className="text-teal-500 shrink-0" />
                        <span>{t.profileEditAddressHint}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="text-[9px] font-black text-slate-500 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300 transition shrink-0 uppercase tracking-widest"
                      >
                        {t.profileCancelEditAddress}
                      </button>
                    </div>
                    <AddressSelector
                      lang={lang}
                      onSelect={(fullAddress) => {
                        setForm((current) => ({
                          ...current,
                          address: fullAddress,
                        }));
                        setIsEditingAddress(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 3. Short Bio Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                  <span className="flex items-center gap-2">
                    <FileText size={14} />
                    {lang === "vi" ? "Giới thiệu bản thân" : "About Me"} (Bio)
                  </span>
                  {!form.bio?.trim() && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse normal-case tracking-normal">
                      {lang === "vi" ? "Chưa viết tiểu sử" : "Not configured"}
                    </span>
                  )}
                </h3>

                <div className="space-y-1">
                  <textarea
                     id="bio-input"
                     maxLength={200}
                     rows={4}
                     className={`${inputClass} resize-none`}
                     placeholder={lang === "vi" ? "Chia sẻ ngắn về bạn để xây dựng uy tín với người dùng khác..." : "Share a short bio to build trust with other users..."}
                     value={form.bio}
                     onChange={(event) =>
                       setForm((current) => ({
                         ...current,
                         bio: event.target.value,
                       }))
                     }
                  />
                  <div className="flex items-center justify-between gap-3 mt-1.5">
                    {errors.bio ? (
                      <p className="text-xs font-semibold text-red-505 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.bio}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500">
                      {form.bio.length}/200
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action Area */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-855/80">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-teal-900/10 hover:shadow-lg hover:shadow-teal-900/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-teal-500 dark:hover:bg-teal-400"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={13} className="animate-spin shrink-0" />
                      <span>{t.profileSaving}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span>{t.profileSave}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-355 dark:hover:bg-slate-850"
                >
                  <span>{t.profileReset}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
