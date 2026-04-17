import type { ProfileUpdatePayload } from "../../auth/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());

export const validatePassword = (value: string) => {
  if (value.trim().length < 6) {
    return "Mat khau phai co it nhat 6 ky tu.";
  }

  return "";
};

export const validateOtp = (value: string) => {
  if (!/^\d{6}$/.test(value.trim())) {
    return "OTP phai gom dung 6 chu so.";
  }

  return "";
};

export const validateEmail = (value: string) => {
  if (!isValidEmail(value)) {
    return "Email khong hop le.";
  }

  return "";
};

export const validateProfileInput = (payload: ProfileUpdatePayload) => {
  const errors: Partial<Record<keyof ProfileUpdatePayload, string>> = {};

  if (!payload.displayName.trim()) {
    errors.displayName = "Ten hien thi la bat buoc.";
  } else if (payload.displayName.trim().length > 100) {
    errors.displayName = "Ten hien thi khong duoc vuot qua 100 ky tu.";
  }

  if (payload.bio.trim().length > 200) {
    errors.bio = "Bio khong duoc vuot qua 200 ky tu.";
  }

  const normalizedPhone = payload.phone.trim();
  if (normalizedPhone && (normalizedPhone.length < 7 || normalizedPhone.length > 20)) {
    errors.phone = "So dien thoai phai co do dai tu 7 den 20 ky tu.";
  }

  return errors;
};

export const validateAvatarFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    return "Avatar chi chap nhan file anh.";
  }

  const maxSizeInBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return "Avatar phai nho hon hoac bang 5MB.";
  }

  return "";
};
