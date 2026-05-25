import mongoose from "mongoose";
import { getOrCreateOneToOneConversation, sendConversationMessage } from "./message.service";
import { emitConversationMessageCreated } from "../realtime/socket";
import { UserModel } from "../models/user.model";

/**
 * Tự động gửi tin nhắn chào mừng từ tài khoản Admin/Hệ thống đến người dùng mới.
 * Hàm này áp dụng tư duy phòng thủ (Defensive Programming), bọc toàn bộ logic trong try...catch
 * để đảm bảo không làm gián đoạn hay crash luồng đăng ký chính nếu có lỗi xảy ra.
 *
 * @param newUserId ID của người dùng mới đăng ký
 */
export async function sendWelcomeMessageFromAdmin(newUserId: string): Promise<void> {
  try {
    // 1. Input validation: Kiểm tra tính hợp lệ của newUserId
    if (!newUserId || typeof newUserId !== "string" || !mongoose.Types.ObjectId.isValid(newUserId)) {
      console.warn("[WelcomeMessage] Bỏ qua gửi tin nhắn chào mừng: newUserId không hợp lệ.");
      return;
    }

    // 2. Cấu hình Admin ID từ biến môi trường với cơ chế fallback an toàn
    let ADMIN_ID = process.env.ADMIN_ID || "65b2be22287a930012fdf8aa";
    if (!mongoose.Types.ObjectId.isValid(ADMIN_ID)) {
      console.error("[WelcomeMessage] Cấu hình ADMIN_ID không phải là ObjectId hợp lệ.");
      return;
    }

    // Kiểm tra tính tồn tại thực tế của ADMIN_ID trong Database
    let adminExists = await UserModel.exists({ _id: ADMIN_ID }).then(res => !!res);
    if (!adminExists) {
      console.warn(`[WelcomeMessage] Admin với ID ${ADMIN_ID} không tồn tại trong database. Đang tìm tài khoản Admin khác...`);
      const activeAdmin = await UserModel.findOne({ role: "admin" }).select("_id").lean();
      if (activeAdmin) {
        ADMIN_ID = String(activeAdmin._id);
        adminExists = true;
        console.log(`[WelcomeMessage] Tìm thấy tài khoản Admin thay thế: ${ADMIN_ID}`);
      } else {
        console.error("[WelcomeMessage] Không tìm thấy bất kỳ tài khoản Admin nào trong database để gửi tin nhắn chào mừng!");
        return;
      }
    }

    // Tránh tự gửi tin nhắn cho chính mình nếu tài khoản đăng ký là Admin
    if (newUserId === ADMIN_ID) {
      console.log("[WelcomeMessage] Đăng ký mới là tài khoản Admin. Không gửi tin nhắn chào mừng.");
      return;
    }

    console.log(`[WelcomeMessage] Đang tạo cuộc hội thoại chào mừng giữa Admin (${ADMIN_ID}) và User (${newUserId})...`);

    // 3. Khởi tạo/Lấy phòng chat 1-1 giữa Admin và người dùng mới
    const conversation = await getOrCreateOneToOneConversation(ADMIN_ID, newUserId);
    if (!conversation || !conversation.id) {
      console.error("[WelcomeMessage] Không thể tạo phòng chat 1-1 với Admin.");
      return;
    }

    // 4. Tạo nội dung tin nhắn chào mừng thân thiện
    const welcomeContent = 
      "Chào mừng bạn đến với URent - Nền tảng cho thuê phòng và nhà ở hàng đầu!\n\n" +
      "Chúng tôi rất vui mừng được đồng hành cùng bạn. Tại URent, bạn có thể dễ dàng tìm kiếm phòng trọ, căn hộ ưng ý hoặc đăng tin cho thuê một cách nhanh chóng và an toàn.\n\n" +
      "Nếu bạn cần bất kỳ sự trợ giúp nào hoặc có câu hỏi về dịch vụ, vui lòng liên hệ với bộ phận hỗ trợ khách hàng qua email support@urent.com hoặc hotline của chúng tôi. Chúc bạn có trải nghiệm tuyệt vời cùng URent!";

    // 5. Gửi tin nhắn và lưu vào database
    const message = await sendConversationMessage(ADMIN_ID, conversation.id, {
      messageType: "TEXT",
      content: welcomeContent,
    });

    // 6. Phát sự kiện real-time qua Socket.io/WebSocket
    emitConversationMessageCreated(conversation.id, message);

    console.log(`[WelcomeMessage] Đã gửi tin nhắn chào mừng thành công đến người dùng ${newUserId}.`);
  } catch (error) {
    // Cô lập hoàn toàn lỗi để không làm dội lỗi ngược lại luồng đăng ký chính
    console.error("[WelcomeMessage] Lỗi xảy ra trong quá trình gửi tin nhắn chào mừng:", {
      newUserId,
      error: error instanceof Error ? (error.stack ?? error.message) : error,
    });
  }
}
