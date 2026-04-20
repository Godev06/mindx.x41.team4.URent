"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = void 0;
const cloudinary_1 = require("../config/cloudinary");
/**
 * Uploads an image buffer to Cloudinary under the given folder.
 * Returns the secure URL and public ID of the uploaded asset.
 */
const uploadImage = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error || !result)
                return reject(error ?? new Error('Cloudinary upload failed'));
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(buffer);
    });
};
exports.uploadImage = uploadImage;
/**
 * Deletes an image from Cloudinary by its public ID.
 */
const deleteImage = async (publicId) => {
    await cloudinary_1.cloudinary.uploader.destroy(publicId);
};
exports.deleteImage = deleteImage;
