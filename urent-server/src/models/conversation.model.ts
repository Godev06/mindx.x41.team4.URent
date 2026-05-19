import mongoose, { Schema } from 'mongoose';

const conversationTypeValues = ['ONE_TO_ONE'] as const;
type ConversationType = (typeof conversationTypeValues)[number];

export interface ConversationDocument extends mongoose.Document {
  conversationType: ConversationType;
  pairKey?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    conversationType: { type: String, enum: conversationTypeValues, default: 'ONE_TO_ONE', index: true },
    pairKey: { type: String, trim: true },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date, index: true, default: Date.now }
  },
  { timestamps: true }
);

conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ pairKey: 1 }, { unique: true, sparse: true });

export const ConversationModel = mongoose.model<ConversationDocument>('Conversation', conversationSchema);
