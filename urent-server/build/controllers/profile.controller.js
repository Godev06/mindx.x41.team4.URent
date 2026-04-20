"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.updateProfile = exports.getProfile = void 0;
const user_model_1 = require("../models/user.model");
const cloudinary_service_1 = require("../services/cloudinary.service");
// Fields excluded from all profile responses
const EXCLUDED_FIELDS = '-password -otpCode -otpExpiresAt -resetToken -resetTokenExpiresAt';
const getProfile = async (req, res) => {
    const userId = req.user?.sub;
    const user = await user_model_1.UserModel.findById(userId).select(EXCLUDED_FIELDS);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    return res.json(user);
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const userId = req.user?.sub;
    const { displayName, bio, phone } = req.body;
    const user = await user_model_1.UserModel.findByIdAndUpdate(userId, { displayName, bio, phone }, { new: true, runValidators: true }).select(EXCLUDED_FIELDS);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    return res.json(user);
};
exports.updateProfile = updateProfile;
const uploadAvatar = async (req, res) => {
    const userId = req.user?.sub;
    if (!req.file)
        return res.status(400).json({ message: 'No file provided' });
    const user = await user_model_1.UserModel.findById(userId);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    // Delete old avatar from Cloudinary if it exists
    if (user.avatarUrl) {
        // Extract public ID: last two path segments joined by '/' without extension
        const parts = user.avatarUrl.split('/');
        const filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
        const folder = parts[parts.length - 2];
        const oldPublicId = `${folder}/${filename}`;
        await (0, cloudinary_service_1.deleteImage)(oldPublicId).catch(() => {
            // Non-fatal: old image cleanup failure should not block the upload
        });
    }
    const { url, publicId } = await (0, cloudinary_service_1.uploadImage)(req.file.buffer, 'avatars');
    user.avatarUrl = url;
    await user.save();
    const updated = await user_model_1.UserModel.findById(userId).select(EXCLUDED_FIELDS);
    return res.json({ avatarUrl: url, publicId, user: updated });
};
exports.uploadAvatar = uploadAvatar;
