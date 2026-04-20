"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueResetToken = exports.createUserWithOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const user_model_1 = require("../models/user.model");
const hash_1 = require("../utils/hash");
const otp_1 = require("../utils/otp");
const email_service_1 = require("./email.service");
const otpExpiry = () => new Date(Date.now() + env_1.env.otpExpiresMinutes * 60 * 1000);
const resetExpiry = () => new Date(Date.now() + env_1.env.resetTokenExpiresMinutes * 60 * 1000);
const createUserWithOtp = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await user_model_1.UserModel.findOne({ email: normalizedEmail });
    if (existing) {
        console.warn(`[auth] register skipped, email already exists: ${normalizedEmail}`);
        return null;
    }
    const otp = (0, otp_1.generateOtp)();
    const user = await user_model_1.UserModel.create({
        email: normalizedEmail,
        password: await (0, hash_1.hashPassword)(password),
        otpCode: otp,
        otpExpiresAt: otpExpiry()
    });
    await (0, email_service_1.sendOtpEmail)(normalizedEmail, otp);
    console.log(`[auth] register OTP generated for ${normalizedEmail}`);
    return user;
};
exports.createUserWithOtp = createUserWithOtp;
const issueResetToken = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await user_model_1.UserModel.findOne({ email: normalizedEmail });
    if (!user) {
        console.warn(`[auth] forgot-password skipped, user not found: ${normalizedEmail}`);
        return null;
    }
    const token = crypto_1.default.randomInt(100000, 999999).toString();
    user.resetToken = token;
    user.resetTokenExpiresAt = resetExpiry();
    await user.save();
    await (0, email_service_1.sendResetTokenEmail)(normalizedEmail, token);
    console.log(`[auth] reset token generated for ${normalizedEmail}`);
    return user;
};
exports.issueResetToken = issueResetToken;
