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

export type OtpPurpose = 'register' | 'login' | 'reset password' | 'create password' | 'toggle 2fa';

export const sendOtpEmail = async (to: string, otp: string, purpose: OtpPurpose) => {
  const expiresInMinutes = env.otpExpiresMinutes;
  const isLoginPurpose = purpose === 'login';
  const isResetPurpose = purpose === 'reset password';
  const isCreatePasswordPurpose = purpose === 'create password';
  const isToggle2faPurpose = purpose === 'toggle 2fa';
  
  const subject = isLoginPurpose
    ? 'Sign-in verification code'
    : isResetPurpose
      ? 'Password reset verification code'
      : isCreatePasswordPurpose
        ? 'Create password verification code'
        : isToggle2faPurpose
          ? 'Two-factor authentication update code'
          : 'Email verification code';
  const title = isLoginPurpose
    ? 'Two-factor sign-in verification'
    : isResetPurpose
      ? 'Password reset verification'
      : isCreatePasswordPurpose
        ? 'Create password verification'
        : isToggle2faPurpose
          ? 'Two-factor authentication update'
          : 'Email verification';
  const description = isLoginPurpose
    ? `Use this OTP to complete your sign-in. This code is valid for ${expiresInMinutes} minutes.`
    : isResetPurpose
      ? `Use this OTP to reset your password. This code is valid for ${expiresInMinutes} minutes.`
      : isCreatePasswordPurpose
        ? `Use this OTP to create a password for your account. This code is valid for ${expiresInMinutes} minutes.`
        : isToggle2faPurpose
          ? `Use this OTP to confirm enabling/disabling your two-factor authentication (2FA). This code is valid for ${expiresInMinutes} minutes.`
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

export const sendPasswordCreatedEmail = async (to: string, displayName?: string) => {
  const name = displayName || 'U-Rent User';
  
  await sendEmail(
    to,
    'Password setup successful',
    `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">
              U-Rent Security
            </p>
            <h2 style="margin:0 0 10px;font-size:22px;color:#18181b;">Password Created Successfully</h2>
            <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
              Hi ${name},
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
              Your password has been successfully created. You can now use your email and password to sign in to your U-Rent account.
            </p>
            <div style="margin:0 0 18px;padding:16px;border-radius:12px;background:#ecfef9;border:1px solid #14b8a6;">
              <p style="margin:0;font-size:13px;color:#0f766e;">✓ Your account is now fully secured with a password</p>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#52525b;">If you did not create this password, please secure your account immediately by changing your password.</p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;">For security, never share your password with anyone.</p>
          </div>
        </div>
      </div>
    `
  );
};

export const sendPasswordChangedEmail = async (to: string, displayName?: string) => {
  const name = displayName || 'U-Rent User';
  
  await sendEmail(
    to,
    'Password changed successfully',
    `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">
              U-Rent Security
            </p>
            <h2 style="margin:0 0 10px;font-size:22px;color:#18181b;">Password Changed Successfully</h2>
            <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
              Hi ${name},
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
              Your password has been successfully changed. You can now sign in with your new password.
            </p>
            <div style="margin:0 0 18px;padding:16px;border-radius:12px;background:#ecfef9;border:1px solid #14b8a6;">
              <p style="margin:0;font-size:13px;color:#0f766e;">✓ Your password has been updated</p>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#52525b;">If you did not make this change, please secure your account immediately.</p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;">For security, never share your password with anyone.</p>
          </div>
        </div>
      </div>
    `
  );
};

export const sendNotificationEmail = async (
  to: string,
  title: string,
  body: string,
  actionUrl?: string
) => {
  const ctaUrl = actionUrl ? `${env.emailFrom.includes('localhost') ? 'http://localhost:5173' : 'https://urent.vercel.app'}${actionUrl}` : undefined;
  
  await sendEmail(
    to,
    `[U-Rent] ${title}`,
    `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
            <div style="display:flex;align-items:center;margin-bottom:16px;">
              <span style="font-size:18px;font-weight:700;color:#0f766e;letter-spacing:0.05em;text-transform:uppercase;">
                U-Rent Notification
              </span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#18181b;font-weight:600;">${title}</h2>
            <p style="margin:0 0 20px;font-size:14px;color:#3f3f46;line-height:1.6;">
              ${body}
            </p>
            ${
              ctaUrl
                ? `
              <div style="margin:0 0 20px;">
                <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;background-color:#0f766e;border-radius:10px;text-decoration:none;text-align:center;box-shadow:0 4px 6px -1px rgba(15,118,110,0.2);">
                  View Details in U-Rent
                </a>
              </div>
              `
                : ''
            }
            <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0;" />
            <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
              You received this email because you opted in to receive notifications. You can customize your preferences anytime in your <a href="${ctaUrl ? ctaUrl.split('/')[0] + '//' + ctaUrl.split('/')[2] + '/settings' : '#'}" style="color:#0f766e;text-decoration:underline;">Settings</a> page.
            </p>
          </div>
        </div>
      </div>
    `
  );
};

