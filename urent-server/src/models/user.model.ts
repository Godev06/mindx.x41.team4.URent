import mongoose, { Schema } from 'mongoose';

export type AuthProvider = 'local' | 'google';

export interface UserDocument extends mongoose.Document {
  email: string;
  password?: string;
  authProviders?: AuthProvider[];
  isEmailVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  loginOtpCode?: string;
  loginOtpExpiresAt?: Date;
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  trustScore?: number;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String },
    authProviders: [{ type: String, enum: ['local', 'google'] }],
    isEmailVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    loginOtpCode: { type: String },
    loginOtpExpiresAt: { type: Date },
    resetToken: { type: String },
    resetTokenExpiresAt: { type: Date },
    displayName: { type: String, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    bio: { type: String, maxlength: 200 },
    avatarUrl: { type: String },
    phone: { type: String, trim: true, unique: true, sparse: true },
    trustScore: { type: Number, enum: [100, 60, 40, 10], default: 100 }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
