"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtpHost,
    port: env_1.env.smtpPort,
    secure: env_1.env.smtpSecure,
    auth: {
        user: env_1.env.smtpUser,
        pass: env_1.env.smtpPass
    }
});
const sendEmail = async (to, subject, html) => {
    const info = await transporter.sendMail({ from: env_1.env.emailFrom, to, subject, html });
    console.log(`[mail] sent to=${to} subject=${subject} messageId=${info.messageId}`);
};
exports.sendEmail = sendEmail;
const sendOtpEmail = async (to, otp, purpose) => {
    const expiresInMinutes = env_1.env.otpExpiresMinutes;
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
    await (0, exports.sendEmail)(to, subject, `
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
    `);
};
exports.sendOtpEmail = sendOtpEmail;
