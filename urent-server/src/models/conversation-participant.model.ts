import mongoose, { Schema } from 'mongoose';

export interface ConversationParticipantDocument extends mongoose.Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  unreadCount: number;
  lastReadAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationParticipantSchema = new Schema<ConversationParticipantDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    unreadCount: { type: Number, default: 0, min: 0 },
    lastReadAt: { type: Date },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

conversationParticipantSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ConversationParticipantModel = mongoose.model<ConversationParticipantDocument>(
  'ConversationParticipant',
  conversationParticipantSchema
);
