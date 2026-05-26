// Service Worker xử lý thông báo chạy ngầm của Firebase (FCM) khi tab U-Rent bị ẩn hoặc đóng.
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js");

// Đọc cấu hình Firebase từ chuỗi truy vấn (Query Params) truyền từ phía Client khi đăng ký Service Worker.
// Tránh việc phải hardcode thông tin bảo mật trong thư mục public.
const urlParams = new URLSearchParams(self.location.search);
const apiKey = urlParams.get("apiKey");
const authDomain = urlParams.get("authDomain");
const projectId = urlParams.get("projectId");
const storageBucket = urlParams.get("storageBucket");
const messagingSenderId = urlParams.get("messagingSenderId");
const appId = urlParams.get("appId");

if (apiKey && projectId && messagingSenderId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });

  const messaging = firebase.messaging();

  // Lắng nghe các tin nhắn chạy ngầm
  messaging.onBackgroundMessage((payload) => {
    console.log("[ServiceWorker] Nhận thông báo ngầm:", payload);

    const title = payload.notification?.title || "U-Rent";
    const options = {
      body: payload.notification?.body || "Bạn có thông báo mới.",
      icon: "/urent.png", // Icon logo
      badge: "/urent-badge.png", // Icon monochrome trên thanh trạng thái
      data: {
        click_action: payload.data?.click_action || "/",
      },
    };

    self.registration.showNotification(title, options);
  });
} else {
  console.warn("[ServiceWorker] Thiếu cấu hình Firebase. Bỏ qua khởi tạo.");
}

// Xử lý sự kiện click chuột vào thông báo đẩy ngoài màn hình
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  // Lấy đường dẫn deep-link cần chuyển tiếp
  const clickAction = event.notification.data?.click_action || "/";
  const targetUrl = new URL(clickAction, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // 1. Nếu đã có sẵn tab U-Rent đang mở, tập trung (focus) vào tab đó và điều hướng
      for (const client of windowClients) {
        if (client.url.includes(self.location.host) && "focus" in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      // 2. Nếu chưa có tab nào mở, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
