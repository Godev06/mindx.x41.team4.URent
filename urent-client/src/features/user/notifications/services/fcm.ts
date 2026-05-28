import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "../../../../lib/firebase";
import { notificationService } from "./notificationService";

// Key VAPID mặc định, có thể thay đổi bằng biến môi trường VITE_FIREBASE_VAPID_KEY
const DEFAULT_VAPID_KEY = "BDd3_hVL9fZi9Ybo2UUzA284WG5FZR30_95YeZJsiApwXKpNcF1rRPF3foIiBHXRdJI2Qhumhf6_LFTeZaNndIo";

export const fcmService = {
  /**
   * Yêu cầu quyền thông báo của trình duyệt và lấy FCM Token lưu lên Backend
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[FCM] Trình duyệt không hỗ trợ Web Push Notification.");
      return null;
    }

    try {
      // 1. Xin quyền người dùng
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[FCM] Người dùng từ chối cấp quyền thông báo.");
        return null;
      }

      const messaging = getMessaging(app);

      // 2. Chờ Service Worker sẵn sàng để đăng ký Firebase Messaging nhận ngầm định
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ("serviceWorker" in navigator) {
        swRegistration = await navigator.serviceWorker.ready;
      }

      // 3. Lấy FCM Token từ Firebase SDK
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || DEFAULT_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        console.info("[FCM] Đã lấy thành công mã thiết bị (Token):", token);
        // Lưu lên Backend
        await notificationService.saveFcmToken(token);
        localStorage.setItem("fcm_token", token);
        return token;
      } else {
        console.warn("[FCM] Không thể tạo token. Cần kiểm tra cấu hình Firebase Console.");
        return null;
      }
    } catch (error) {
      console.error("[FCM] Lỗi lấy mã thông báo đẩy (Token):", error);
      return null;
    }
  },

  /**
   * Hủy đăng ký token FCM khi người dùng logout
   */
  async revokeToken(): Promise<void> {
    try {
      const token = localStorage.getItem("fcm_token");
      if (token) {
        await notificationService.deleteFcmToken(token);
        localStorage.removeItem("fcm_token");
        console.info("[FCM] Đã hủy đăng ký token thiết bị thành công.");
      }
    } catch (error) {
      console.error("[FCM] Lỗi hủy đăng ký token:", error);
    }
  },

  /**
   * Lắng nghe tin nhắn khi ứng dụng đang mở ở trang trước (Foreground)
   */
  setupForegroundListener(onNotification: (payload: any) => void): () => void {
    try {
      const messaging = getMessaging(app);
      return onMessage(messaging, (payload) => {
        console.info("[FCM] Nhận được thông báo nổi (Foreground):", payload);
        onNotification(payload);
      });
    } catch (error) {
      console.error("[FCM] Lỗi thiết lập lắng nghe thông báo nổi:", error);
      return () => {};
    }
  }
};
