import mongoose, { Schema } from 'mongoose';

const messageTypeValues = ['TEXT', 'PRODUCT', 'LOCATION'] as const;

type MessageType = (typeof messageTypeValues)[number];

export interface MessageProductMetadata {
  productId: string;
  snapshot: {
    name: string;
    pricePerDay: number;
    imageUrl: string;
    category: string;
  };
}

export interface MessageLocationMetadata {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MessageDocument extends mongoose.Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  messageType: MessageType;
  content?: string;
  metadata?: MessageProductMetadata | MessageLocationMetadata | Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messageType: { type: String, enum: messageTypeValues, required: true },
    content: { type: String, trim: true, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel = mongoose.model<MessageDocument>('Message', messageSchema);