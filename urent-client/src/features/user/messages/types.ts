export interface ApiConversationParticipant {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  status: "Available" | "Active" | "Completed";
  image: string;
  imageUrl: string | null;
  rating: number | null;
  reviews: number | null;
}

export interface ApiConversation {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  lastReadAt: string | null;
  participants: ApiConversationParticipant[];
}

export interface ApiOneToOneConversation {
  id: string;
  conversationType: "ONE_TO_ONE";
  pairKey: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  peer: ApiConversationParticipant | null;
}

export interface ProductMetadata {
  productId: string;
  snapshot: {
    name: string;
    pricePerDay: number;
    imageUrl: string | null;
    category: string;
  };
}

export interface LocationMetadata {
  latitude: number;
  longitude: number;
  address?: string;
}

export type ApiMessageType = "TEXT" | "PRODUCT" | "LOCATION";

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: ApiMessageType;
  content: string | null;
  metadata: ProductMetadata | LocationMetadata | null;
  createdAt: string;
}

export interface ApiSearchMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageType: ApiMessageType;
  content: string | null;
  metadata: ProductMetadata | LocationMetadata | null;
  createdAt: string;
}

export interface ApiPaginatedMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ApiPaginatedMeta;
}
