"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueLoginOtp = exports.issueResetToken = exports.createUserWithOtp = exports.verifyResetOtp = exports.verifyOtp = exports.issueOtp = void 0;
const env_1 = require("../config/env");
const user_model_1 = require("../models/user.model");
const hash_1 = require("../utils/hash");
const otp_1 = require("../utils/otp");
const email_service_1 = require("./email.service");
const otpExpiry = () => new Date(Date.now() + env_1.env.otpExpiresMinutes * 60 * 1000);
const resetExpiry = () => new Date(Date.now() + env_1.env.resetTokenExpiresMinutes * 60 * 1000);
const normalizedPurpose = (purpose) => (purpose === 'register' ? 'register' : 'login');
const setOtpByPurpose = (user, otp, purpose) => {
    if (purpose === 'register') {
        user.otpCode = otp;
        user.otpExpiresAt = otpExpiry();
        return;
    }
    user.loginOtpCode = otp;
    user.loginOtpExpiresAt = otpExpiry();
};
const clearOtpByPurpose = (user, purpose) => {
    if (purpose === 'register') {
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;
        return;
    }
    user.loginOtpCode = undefined;
    user.loginOtpExpiresAt = undefined;
};
const issueOtp = async (user, purpose) => {
    const otp = (0, otp_1.generateOtp)();
    setOtpByPurpose(user, otp, purpose);
    await user.save();
    await (0, email_service_1.sendOtpEmail)(user.email, otp, purpose);
    console.log(`[auth] ${normalizedPurpose(purpose)} OTP generated for ${user.email}`);
    return user;
};
exports.issueOtp = issueOtp;
const verifyOtp = async (email, otp, purpose) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await user_model_1.UserModel.findOne({ email: normalizedEmail });
    if (!user)
        return null;
    const isValidRegisterOtp = purpose === 'register' &&
        user.otpCode === otp &&
        !!user.otpExpiresAt &&
        user.otpExpiresAt.getTime() >= Date.now();
    const isValidLoginOtp = purpose === 'login' &&
        user.loginOtpCode === otp &&
        !!user.loginOtpExpiresAt &&
        user.loginOtpExpiresAt.getTime() >= Date.now();
    if (!isValidRegisterOtp && !isValidLoginOtp)
        return null;
    if (purpose === 'register') {
        user.isEmailVerified = true;
    }
    clearOtpByPurpose(user, purpose);
    await user.save();
    return user;
};
exports.verifyOtp = verifyOtp;
const verifyResetOtp = async (email, otp) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await user_model_1.UserModel.findOne({ email: normalizedEmail });
    if (!user)
        return null;
    const isValidResetOtp = user.resetToken === otp &&
        !!user.resetTokenExpiresAt &&
        user.resetTokenExpiresAt.getTime() >= Date.now();
    return isValidResetOtp ? user : null;
};
exports.verifyResetOtp = verifyResetOtp;
const createUserWithOtp = async (email, password, username, displayName) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await user_model_1.UserModel.findOne({ email: normalizedEmail });
    if (existing) {
        if (!existing.isEmailVerified) {
            await (0, exports.issueOtp)(existing, 'register');
            console.log(`[auth] register OTP re-sent for unverified email ${normalizedEmail}`);
            return existing;
        }
        console.warn(`[auth] register skipped, email already exists: ${normalizedEmail}`);
        return null;
    }
    const otp = (0, otp_1.generateOtp)();
    const user = await user_model_1.UserModel.create({
        email: normalizedEmail,
        password: await (0, hash_1.hashPassword)(password),
        authProviders: ['local'],
        username,
        displayName,
        otpCode: otp,
        otpExpiresAt: otpExpiry()
    });
    try {
        await (0, email_service_1.sendOtpEmail)(normalizedEmail, otp, 'register');
    }
    catch (error) {
        // Avoid keeping an unusable unverified account if mail delivery fails.
        await user_model_1.UserModel.findByIdAndDelete(user._id);
        throw error;
    }
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
    const token = (0, otp_1.generateOtp)();
    user.resetToken = token;
    user.resetTokenExpiresAt = resetExpiry();
    await user.save();
    await (0, email_service_1.sendOtpEmail)(normalizedEmail, token, 'reset password');
    console.log(`[auth] reset OTP generated for ${normalizedEmail}`);
    return user;
};
exports.issueResetToken = issueResetToken;
const issueLoginOtp = async (user) => {
    return (0, exports.issueOtp)(user, 'login');
};
exports.issueLoginOtp = issueLoginOtp;
