import mongoose, { Schema } from 'mongoose';

const senderValues = ['user', 'other'] as const;

type MessageSender = (typeof senderValues)[number];

export interface MessageDocument extends mongoose.Document {
  chatId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  sender: MessageSender;
  senderId?: mongoose.Types.ObjectId;
  senderName: string;
  senderAvatar?: string;
}

const messageSchema = new Schema<MessageDocument>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    timestamp: { type: Date, default: Date.now },
    sender: { type: String, enum: senderValues, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, required: true, trim: true },
    senderAvatar: { type: String }
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<MessageDocument>('Message', messageSchema);