import { EventEmitter } from "events";
import mongoose from "mongoose";
import { getOrCreateSupportConversation } from "../services/admin-chat.service";
import { sendConversationMessage } from "../services/message.service";
import { emitConversationMessageCreated } from "../realtime/socket";
import { getSystemAdminId } from "../utils/admin";

// Instance of the Auth Event Bus
export const authEvents = new EventEmitter();

/**
 * Lắng nghe sự kiện người dùng mới đăng ký thành công.
 * Tự động tạo phòng hỗ trợ (Support Room) và gửi tin nhắn chào mừng từ Admin Team.
 */
authEvents.on("user.registered", async ({ userId }: { userId: string }) => {
  console.log(`[Event-Driven] Handling user.registered event for userId: ${userId}`);

  try {
    // 1. Kiểm tra tính hợp lệ của userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn("[UserSupportListener] Bỏ qua: userId không hợp lệ.");
      return;
    }

    // 2. Xác định System Admin ID từ helper thống nhất
    const SYSTEM_ADMIN_ID = await getSystemAdminId();

    // Nếu chưa có admin nào trong DB → bỏ qua, không crash
    if (!SYSTEM_ADMIN_ID) {
      console.warn("[UserSupportListener] Chưa có admin nào trong DB. Bỏ qua tạo phòng support.");
      return;
    }

    // Tránh tự gửi tin nhắn support cho chính mình nếu đăng ký là Admin
    if (userId === SYSTEM_ADMIN_ID) {
      console.log("[UserSupportListener] Đăng ký mới trùng khớp với System Admin. Bỏ qua.");
      return;
    }

    // 3. Khởi tạo/Tìm kiếm phòng chat support của khách hàng
    console.log(`[UserSupportListener] Khởi tạo phòng chat support cho User: ${userId}`);
    const supportConv = await getOrCreateSupportConversation(userId);
    if (!supportConv || !supportConv.id) {
      console.error("[UserSupportListener] Không thể tạo hoặc lấy support conversation.");
      return;
    }

    // 4. Nội dung tin nhắn chào mừng từ đội ngũ Admin
    const welcomeMessage =
      "Chào mừng bạn đến với bộ phận hỗ trợ khách hàng của URent!\n\n" +
      "Hệ thống quản trị URent đã tự động kích hoạt kênh hỗ trợ này. Nếu bạn có bất kỳ thắc mắc nào về dịch vụ, quy trình thuê đồ, " +
      "thanh toán hoặc cần hỗ trợ kỹ thuật, hãy gửi tin nhắn ngay tại đây. " +
      "Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất có thể!\n\n" +
      "Chúc bạn có những trải nghiệm tuyệt vời cùng URent!";

    // 5. Gửi tin nhắn chào mừng hệ thống
    console.log(`[UserSupportListener] Đang gửi tin nhắn chào mừng từ Admin (${SYSTEM_ADMIN_ID}) đến phòng chat (${supportConv.id})...`);
    const message = await sendConversationMessage(SYSTEM_ADMIN_ID, supportConv.id, {
      messageType: "TEXT",
      content: welcomeMessage,
    });

    // 6. Phát tín hiệu Real-time qua Websocket về phòng cụ thể và room:admin_pool
    emitConversationMessageCreated(supportConv.id, message, "support");
    console.log(`[UserSupportListener] Đã hoàn thành khởi tạo phòng chat và gửi tin nhắn chào mừng cho user ${userId}.`);
  } catch (error) {
    // SỰ CÔ LẬP CỦA LỖI (ERROR ISOLATION): Đảm bảo không làm gián đoạn luồng đăng ký chính
    console.error("[UserSupportListener] Gửi tin nhắn chào mừng support thất bại:", {
      userId,
      error: error instanceof Error ? (error.stack ?? error.message) : error,
    });
  }
});
