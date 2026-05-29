import { admin, isFirebaseAdminInitialized } from '../config/firebase';
import { FcmTokenModel } from '../models/fcm-token.model';

export interface SendPushPayload {
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, string>;
}

export const fcmPushService = {
  /**
   * Gửi thông báo đẩy đến tất cả thiết bị của một người dùng
   */
  async sendPushToUser(userId: string, payload: SendPushPayload): Promise<void> {
    if (!isFirebaseAdminInitialized()) {
      console.warn(`[FCM] Firebase Admin is not initialized. Skipping push to user ${userId}.`);
      return;
    }

    try {
      // 1. Lấy tất cả FCM Tokens của user
      const dbTokens = await FcmTokenModel.find({ userId }).select('token').lean();
      if (!dbTokens || dbTokens.length === 0) {
        return;
      }

      const tokens = dbTokens.map((t) => t.token);

      // 2. Chuẩn bị payload thông báo
      // Firebase cloud message format
      const messagePayload: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          click_action: payload.actionUrl || '/',
          ...(payload.metadata || {}),
        },
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/urent.png', // Logo icon
            badge: '/urent-badge.png', // Monochrome badge
            click_action: payload.actionUrl || '/',
          },
        },
      };

      // 3. Thực hiện gửi multicast
      // Use sendEachForMulticast if available (firebase-admin >=11), otherwise fallback to sendMulticast
      const response = await ((admin.messaging() as any).sendEachForMulticast?.(messagePayload) ?? (admin.messaging() as any).sendMulticast(messagePayload));
      
      console.info(`[FCM] Sent message to ${tokens.length} devices of user ${userId}. Success: ${response.successCount}, Fail: ${response.failureCount}`);

      // 4. Dọn dẹp các token lỗi (stale/unregistered)
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        
        response.responses.forEach((res: admin.messaging.SendResponse, idx: number) => {
          if (!res.success && res.error) {
            const code = (res.error as any).code;
            // Token không còn hợp lệ hoặc đã hủy đăng ký
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              tokensToRemove.push(tokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await FcmTokenModel.deleteMany({ token: { $in: tokensToRemove } });
          console.info(`[FCM] Cleaned up ${tokensToRemove.length} invalid/expired tokens for user ${userId}.`);
        }
      }
    } catch (error) {
      console.error(`[FCM] Error sending push notification to user ${userId}:`, error);
    }
  },
};
