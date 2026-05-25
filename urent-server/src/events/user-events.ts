import { EventEmitter } from "events";
import mongoose from "mongoose";
import { getOrCreateSupportConversation } from "../services/admin-chat.service";
import { sendConversationMessage } from "../services/message.service";
import { emitConversationMessageCreated } from "../realtime/socket";
import { UserModel } from "../models/user.model";

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

    // 2. Xác định System Admin ID từ biến môi trường hoặc fallback mặc định
    let SYSTEM_ADMIN_ID = process.env.SYSTEM_ADMIN_ID || "65b2be22287a930012fdf8aa";
    if (!mongoose.Types.ObjectId.isValid(SYSTEM_ADMIN_ID)) {
      console.error("[UserSupportListener] SYSTEM_ADMIN_ID không phải là ObjectId hợp lệ.");
      return;
    }

    // Kiểm tra tính tồn tại thực tế của SYSTEM_ADMIN_ID trong Database
    let adminExists = await UserModel.exists({ _id: SYSTEM_ADMIN_ID }).then(res => !!res);
    if (!adminExists) {
      console.warn(`[UserSupportListener] Admin với ID ${SYSTEM_ADMIN_ID} không tồn tại trong database. Đang tìm tài khoản Admin khác...`);
      const activeAdmin = await UserModel.findOne({ role: "admin" }).select("_id").lean();
      if (activeAdmin) {
        SYSTEM_ADMIN_ID = String(activeAdmin._id);
        adminExists = true;
        console.log(`[UserSupportListener] Tìm thấy tài khoản Admin thay thế: ${SYSTEM_ADMIN_ID}`);
      } else {
        console.error("[UserSupportListener] Không tìm thấy bất kỳ tài khoản Admin nào trong database để gửi tin nhắn hỗ trợ!");
        return;
      }
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
      "Tôi là trợ lý ảo từ đội ngũ Admin. Nếu bạn có bất kỳ thắc mắc nào về dịch vụ, quy trình đặt phòng, " +
      "thanh toán hoặc cần hỗ trợ kỹ thuật, hãy gửi tin nhắn ngay tại đây. " +
      "Đội ngũ Admin của chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất có thể!\n\n" +
      "Chúc bạn tìm kiếm được căn phòng ưng ý cùng URent!";

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
