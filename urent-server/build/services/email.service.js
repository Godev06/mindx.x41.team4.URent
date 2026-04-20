"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetTokenEmail = exports.sendOtpEmail = exports.sendEmail = void 0;
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
const sendOtpEmail = async (to, otp) => {
    const expiresInMinutes = env_1.env.otpExpiresMinutes;
    await (0, exports.sendEmail)(to, 'Verify your email - OTP code', `
      <div style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
          <div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:24px;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">
              MERN Auth Starter
            </p>
            <h2 style="margin:0 0 10px;font-size:22px;color:#18181b;">Email Verification OTP</h2>
            <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
              Use this OTP to verify your account. This code is valid for ${expiresInMinutes} minutes.
            </p>
            <div style="margin:0 0 18px;padding:14px;border-radius:12px;background:#faf5ff;border:1px dashed #a855f7;text-align:center;">
              <span style="font-size:30px;font-weight:700;letter-spacing:0.35em;color:#6d28d9;">${otp}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#52525b;">If you did not request this OTP, please ignore this email.</p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;">For security, never share this OTP with anyone.</p>
          </div>
        </div>
      </div>
    `);
};
exports.sendOtpEmail = sendOtpEmail;
const sendResetTokenEmail = async (to, token) => {
    await (0, exports.sendEmail)(to, 'Password reset token', `<p>Your reset token is <b>${token}</b>. It expires in ${env_1.env.resetTokenExpiresMinutes} minutes.</p>`);
};
exports.sendResetTokenEmail = sendResetTokenEmail;
