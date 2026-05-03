"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhone = exports.uploadAvatar = exports.updateProfile = exports.getProfile = exports.evaluateVerifyPhoneGuard = void 0;
const user_model_1 = require("../models/user.model");
const cloudinary_service_1 = require("../services/cloudinary.service");
const activity_notification_service_1 = require("../services/activity-notification.service");
const hash_1 = require("../utils/hash");
const firebase_1 = require("../config/firebase");
const buildFirebaseUid = (userId) => `urent_${userId}`;
const isFirebaseUserNotFoundError = (error) => {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'auth/user-not-found');
};
const getExpectedFirebaseUidForUser = async (userId, email) => {
    try {
        const firebaseUser = await firebase_1.admin.auth().getUserByEmail(email);
        return firebaseUser.uid;
    }
    catch (error) {
        if (!isFirebaseUserNotFoundError(error)) {
            throw error;
        }
        // If the Firebase user has not been provisioned by email yet, fallback to deterministic UID.
        return buildFirebaseUid(userId);
    }
};
const evaluateVerifyPhoneGuard = ({ decodedUid, expectedFirebaseUid, hasExistingPhoneOwner }) => {
    if (decodedUid !== expectedFirebaseUid) {
        return { ok: false, status: 403, message: 'Firebase token does not belong to the current user' };
    }
    if (hasExistingPhoneOwner) {
        return { ok: false, status: 409, message: 'Phone number is already linked to another account' };
    }
    return { ok: true };
};
exports.evaluateVerifyPhoneGuard = evaluateVerifyPhoneGuard;
// Fields excluded from all profile responses
const EXCLUDED_FIELDS = '-password -otpCode -otpExpiresAt -loginOtpCode -loginOtpExpiresAt -resetToken -resetTokenExpiresAt';
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
    const { displayName, bio, phone, currentPassword, newPassword } = req.body;
    const user = await user_model_1.UserModel.findById(userId);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    // Handle password change if requested
    if (currentPassword && newPassword) {
        if (!user.password) {
            return res.status(400).json({ message: 'Password has not been set for this account yet' });
        }
        const isMatch = await (0, hash_1.comparePassword)(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = await (0, hash_1.hashPassword)(newPassword);
        user.authProviders = Array.from(new Set([...(user.authProviders ?? []), 'local']));
    }
    // Update other fields
    if (displayName)
        user.displayName = displayName;
    if (bio !== undefined)
        user.bio = bio;
    if (phone) {
        // Direct update without Firebase verification — mark as unverified
        user.phone = phone;
        user.isPhoneVerified = false;
    }
    await user.save();
    try {
        await (0, activity_notification_service_1.createActivityOnly)({
            userId,
            type: 'update',
            action: 'Profile updated',
            description: 'User updated profile information'
        });
    }
    catch {
        // Non-fatal: activity logging failure should not block profile update
    }
    const updatedUser = await user_model_1.UserModel.findById(userId).select(EXCLUDED_FIELDS);
    return res.json(updatedUser);
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
    try {
        await (0, activity_notification_service_1.createActivityOnly)({
            userId,
            type: 'update',
            action: 'Avatar updated',
            description: 'User changed profile avatar'
        });
    }
    catch {
        // Non-fatal: activity logging failure should not block avatar upload
    }
    const updated = await user_model_1.UserModel.findById(userId).select(EXCLUDED_FIELDS);
    return res.json({ avatarUrl: url, publicId, user: updated });
};
exports.uploadAvatar = uploadAvatar;
const verifyPhone = async (req, res) => {
    const userId = req.user?.sub;
    if (!userId)
        return res.status(401).json({ message: 'Unauthorized' });
    if (!(0, firebase_1.isFirebaseAdminInitialized)()) {
        return res.status(503).json({ message: 'Firebase phone verification is not configured' });
    }
    const { idToken } = req.body;
    const user = await user_model_1.UserModel.findById(userId);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    let decodedToken;
    try {
        decodedToken = await firebase_1.admin.auth().verifyIdToken(idToken);
    }
    catch {
        return res.status(401).json({ message: 'Invalid or expired Firebase ID token' });
    }
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
        return res.status(400).json({ message: 'Token does not contain a verified phone number' });
    }
    const expectedFirebaseUid = await getExpectedFirebaseUidForUser(String(user._id), user.email);
    if (decodedToken.uid !== expectedFirebaseUid) {
        return res.status(403).json({ message: 'Firebase token does not belong to the current user' });
    }
    const existingPhoneOwner = await user_model_1.UserModel.findOne({
        _id: { $ne: user._id },
        phone: phoneNumber
    }).select('_id');
    const guardResult = (0, exports.evaluateVerifyPhoneGuard)({
        decodedUid: decodedToken.uid,
        expectedFirebaseUid,
        hasExistingPhoneOwner: Boolean(existingPhoneOwner)
    });
    if (!guardResult.ok) {
        return res.status(guardResult.status).json({ message: guardResult.message });
    }
    user.phone = phoneNumber;
    user.isPhoneVerified = true;
    await user.save();
    try {
        await (0, activity_notification_service_1.createActivityOnly)({
            userId,
            type: 'update',
            action: 'Phone verified',
            description: `User verified phone number ${phoneNumber}`
        });
    }
    catch {
        // Non-fatal
    }
    const updatedUser = await user_model_1.UserModel.findById(userId).select(EXCLUDED_FIELDS);
    return res.json(updatedUser);
};
exports.verifyPhone = verifyPhone;
