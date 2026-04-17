import mongoose, { Schema } from 'mongoose';

export interface ChatDocument extends mongoose.Document {
  participantIds: mongoose.Types.ObjectId[];
  name?: string;
  message?: string;
  time?: string;
  active: boolean;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
}

const chatSchema = new Schema<ChatDocument>(
  {
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    name: { type: String, trim: true },
    message: { type: String, trim: true },
    time: { type: String, trim: true },
    active: { type: Boolean, default: true },
    avatar: { type: String },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

export const ChatModel = mongoose.model<ChatDocument>('Chat', chatSchema);