import mongoose from "mongoose";
import { getOrCreateOneToOneConversation, sendConversationMessage } from "./message.service";
import { emitConversationMessageCreated } from "../realtime/socket";
import { getSystemAdminId } from "../utils/admin";

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

    // 2. Xác định System Admin ID từ helper thống nhất
    const ADMIN_ID = await getSystemAdminId();

    // Nếu chưa có admin nào trong DB → bỏ qua, không crash
    if (!ADMIN_ID) {
      console.warn("[WelcomeMessage] Chưa có admin nào trong DB. Bỏ qua gửi tin nhắn chào mừng.");
      return;
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
      "Chào mừng bạn đến với URent - Nền tảng cho thuê đồ dùng hàng đầu! 👋 \n" +
      "Hệ thống quản trị URent rất vui mừng được đồng hành cùng bạn. Tại đây, bạn có thể dễ dàng tìm kiếm, thuê nhanh các món đồ tiện ích hoặc đăng tin cho thuê các thiết bị nhàn rỗi một cách nhanh chóng và an toàn.\n" +
      "Nếu bạn cần bất kỳ sự trợ giúp nào hoặc có câu hỏi về dịch vụ, hãy gửi tin nhắn ngay tại khung chat này để được hỗ trợ nhé!\n" +
      "Chúc bạn có trải nghiệm tuyệt vời cùng URent!";

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
