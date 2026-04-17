import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const info = await transporter.sendMail({ from: env.emailFrom, to, subject, html });
  console.log(`[mail] sent to=${to} subject=${subject} messageId=${info.messageId}`);
};

export type OtpPurpose = 'register' | 'login' | 'reset password';

export const sendOtpEmail = async (to: string, otp: string, purpose: OtpPurpose) => {
  const expiresInMinutes = env.otpExpiresMinutes;
  const isLoginPurpose = purpose === 'login';
  const isResetPurpose = purpose === 'reset password';
  const subject = isLoginPurpose
    ? 'Sign-in verification code'
    : isResetPurpose
      ? 'Password reset verification code'
      : 'Email verification code';
  const title = isLoginPurpose
    ? 'Two-factor sign-in verification'
    : isResetPurpose
      ? 'Password reset verification'
      : 'Email verification';
  const description = isLoginPurpose
    ? `Use this OTP to complete your sign-in. This code is valid for ${expiresInMinutes} minutes.`
    : isResetPurpose
      ? `Use this OTP to reset your password. This code is valid for ${expiresInMinutes} minutes.`
      : `Use this OTP to verify your email and activate your account. This code is valid for ${expiresInMinutes} minutes.`;

  await sendEmail(
    to,
    subject,
    `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">
              U-Rent Security
            </p>
            <h2 style="margin:0 0 10px;font-size:22px;color:#18181b;">${title}</h2>
            <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
              ${description}
            </p>
            <div style="margin:0 0 18px;padding:14px;border-radius:12px;background:#ecfeff;border:1px dashed #0f766e;text-align:center;">
              <span style="font-size:30px;font-weight:700;letter-spacing:0.35em;color:#115e59;">${otp}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#52525b;">If this was not you, please ignore this email and secure your account.</p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;">For security, never share this OTP with anyone.</p>
          </div>
        </div>
      </div>
    `
  );
};

