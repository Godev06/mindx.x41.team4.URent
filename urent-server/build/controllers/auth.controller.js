"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.resetPassword = exports.forgotPassword = exports.login = exports.verifyRegisterOtp = exports.register = void 0;
const user_model_1 = require("../models/user.model");
const hash_1 = require("../utils/hash");
const jwt_1 = require("../utils/jwt");
const user_service_1 = require("../services/user.service");
const normalizeEmail = (email) => email.trim().toLowerCase();
const register = async (req, res) => {
    const { email, password } = req.body;
    const user = await (0, user_service_1.createUserWithOtp)(normalizeEmail(email), password);
    if (!user)
        return res.status(409).json({ message: 'Email already exists' });
    return res.status(201).json({ message: 'OTP has been sent to your email' });
};
exports.register = register;
const verifyRegisterOtp = async (req, res) => {
    const { email, otp } = req.body;
    const user = await user_model_1.UserModel.findOne({ email: normalizeEmail(email) });
    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Email verified successfully' });
};
exports.verifyRegisterOtp = verifyRegisterOtp;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await user_model_1.UserModel.findOne({ email: normalizeEmail(email) });
    if (!user || !(await (0, hash_1.comparePassword)(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = (0, jwt_1.signToken)({ sub: String(user._id), email: user.email });
    return res.json({ token });
};
exports.login = login;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await (0, user_service_1.issueResetToken)(normalizeEmail(email));
    if (!user) {
        return res.status(404).json({ message: 'Email not found' });
    }
    return res.json({ message: 'Reset password token sent to your email' });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;
    const user = await user_model_1.UserModel.findOne({ email: normalizeEmail(email) });
    if (!user || user.resetToken !== token || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    user.password = await (0, hash_1.hashPassword)(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Password reset successful' });
};
exports.resetPassword = resetPassword;
const getMe = async (req, res) => {
    const userId = req.user?.sub;
    const user = await user_model_1.UserModel.findById(userId).select('-password -otpCode -resetToken');
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    return res.json(user);
};
exports.getMe = getMe;
