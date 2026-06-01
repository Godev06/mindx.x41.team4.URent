# 🛡️ Sơ Đồ Toàn Diện & Kiến Trúc - Phân Hệ Admin & Mediator (URent Ecosystem)

Tài liệu này trình bày sơ đồ tư duy (Mindmap), các biểu đồ luồng nghiệp vụ quản trị và phân giải tranh chấp (Sequence & Flowcharts) cùng thiết kế kiến trúc chi tiết của phân hệ **Admin Dashboard (Bảng điều khiển Quản trị)** và **Escrow Dispute Mediator Center (Phòng Hòa giải Tranh chấp Ký ký)** trong hệ sinh thái URent.

Hệ thống quản trị của URent áp dụng hàng rào phân quyền nghiêm ngặt (**RBAC Gates**) và hỗ trợ các tính năng quản trị thông minh: Giám sát luồng tiền ký quỹ, hòa giải tranh chấp bằng bằng chứng hình ảnh hiện trạng bàn giao (Handover Checkpoints) và kênh hỗ trợ trực tuyến Live Chat thời gian thực.

---

## 🧠 1. Sơ Đồ Tư Duy Tổng Quan Phân Hệ Admin (Mermaid Mindmap)

Dưới đây là sơ đồ tư duy phân tách các cột trụ quản trị: **Giám sát Chỉ số hệ thống**, **Phân xử Tranh chấp Tài chính (Dispute Room)**, **Hỗ trợ Khách hàng Live Chat**, và **Hệ thống Kiểm toán An ninh (Audit Logs)**.

```mermaid
mindmap
  root((URent Admin Dashboard))
    SystemMonitoring["1. Giám sát Chỉ số & Sức khỏe"]
      DashboardStats["Dashboard Stats (/dashboard-stats)"]
        UsersCount["Users: Tổng số, phân bổ Online/Offline (70% active)"]
        OrdersCount["Orders: Tổng đơn hàng, phân loại Pending/Completed"]
        InventoryCount["Inventory: Thống kê available, rented, overdue"]
      ActivityStream["Activity Stream thời gian thực"]
        RecentLog["Liệt kê 10 hoạt động gần nhất toàn hệ thống"]
        UserPopulation["Populate thông tin cá nhân: email, avatar"]
    EscrowMediator["2. Hòa giải Ký quỹ & Tranh chấp"]
      EscrowAudit["Truy cập Phòng chat đối soát"]
        PairKeyLookup["Lookup /conversations/escrow theo pairKey"]
        EvidenceFetch["Trích xuất toàn bộ tin nhắn & bằng chứng"]
      HandoverCompare["Đối soát ảnh Handover Checkpoint"]
        PickupPhoto["Ảnh chụp lúc Nhận (Kiểm tra độ nguyên vẹn)"]
        ReturnPhoto["Ảnh chụp lúc Trả (Đối chiếu hư hỏng/trầy xước)"]
      FinancialRelease["Phân tách Ký quỹ (Refund & Payout)"]
        DamageDeduction["Khấu trừ tiền cọc bồi thường hư hại cho Owner"]
        SafeRefund["Hoàn lại phần cọc còn lại cho Renter"]
    SupportSystem["3. Live Support Chat trực tuyến"]
      SupportAPI["Support API (/conversations/support)"]
        SupportType["Tạo phòng chat phân loại type = 'support'"]
        ListAllSupport["listAllSupportConversations: Danh sách cuộc gọi hỗ trợ"]
      AdminWsPool["WebSocket Admin Pool"]
        AdminPoolRoom["room:admin_pool: Đăng ký nhận message hỗ trợ"]
        RbacWsGuard["Kiểm tra quyền Admin trước khi Join support room"]
    AuditSecurity["4. Phân quyền RBAC & Kiểm toán"]
      RbacMiddleware["Hàng rào Bảo vệ (RBAC Gates)"]
        adminGuard["adminGuard: Chặn REST API phi admin"]
        requireRole["requireRole(['admin']): Chặn theo mảng Role tùy biến"]
      UserManagement["Quản trị Người dùng"]
        EkycVerification["Xác duyệt định danh eKYC CCCD/Passport"]
        TrustScoreCorrection["Điều chỉnh Dynamic TrustScore thủ công"]
      BroadcastCenter["Cổng phát thông báo Broadcast"]
        GlobalAlert["Gửi Push notification FCM và WS toàn hệ thống"]
```

---

## 🛡️ 2. Luồng Phân Xử Tranh Chấp Ký Quỹ (Escrow Dispute Resolution Sequence)

Khi có tranh chấp xảy ra giữa Người thuê (Renter) và Chủ đồ (Owner) về tình trạng tài sản hao hụt/hư hỏng, Admin sẽ đóng vai trò là Hòa giải viên (Mediator) truy cập vào **Dispute Room** để phân xử dựa trên bằng chứng hình ảnh không thể chối cãi tại các **Handover Checkpoints**:

```mermaid
sequenceDiagram
    autonumber
    actor Renter as Người thuê (Renter)
    actor Owner as Chủ tài sản (Owner)
    actor Admin as Hòa giải viên (Mediator)
    participant BE as Express API Server
    participant MDB as MongoDB Database

    %% PHÁT SINH TRANH CHẤP
    Renter->>Owner: Trả thiết bị phát hiện nứt vỡ/hỏng hóc
    Owner->>BE: 1. Gửi khiếu nại nứt vỡ & yêu cầu giữ tiền cọc (Escrow Dispute)
    BE->>MDB: 2. Đánh dấu trạng thái Order thành 'disputed'
    BE->>MDB: 3. Tăng product.statusQuantities.overdue = 1 (Giám sát rủi ro)

    %% ĐỐI SOÁT BẰNG CHỨNG
    Admin->>BE: 4. GET /api/v1/admin/dashboard-stats (Phát hiện hoạt động tranh chấp mới)
    Admin->>BE: 5. GET /api/v1/conversations/escrow?renterId=...&ownerId=...
    BE->>BE: 6. Tính toán pairKey = [renterId, ownerId].sort().join(':')
    BE->>MDB: 7. Truy vấn Conversation & trích xuất toàn bộ Lịch sử tin nhắn phòng chat
    MDB-->>BE: Trả về danh sách tin nhắn kèm ảnh đính kèm
    BE-->>Admin: 8. Hiển thị dòng thời gian trò chuyện đối soát
    
    Note over Admin: Admin tiến hành so sánh ảnh chụp Handover Checkpoint:<br/>- Ảnh lúc Nhận đồ (Hộp/máy nguyên vẹn)<br/>- Ảnh lúc Trả đồ (Màn hình bị nứt vỡ)

    %% PHÂN XỬ TÀI CHÍNH
    Admin->>BE: 9. Gửi lệnh Phân xử Ký quỹ (Split Escrow Payout)
    Note over BE: Khấu trừ 1.500.000đ tiền cọc của Renter để đền bù nứt màn hình
    BE->>MDB: 10. Giải ngân 1.500.000đ cho Owner & Hoàn trả phần cọc còn lại cho Renter
    BE->>MDB: 11. Ghi nhận ActivityLog ("Security Dispute Resolved")
    BE->>MDB: 12. Trừ điểm tín nhiệm TrustScore của Renter xuống 40 (Cảnh báo)
    BE-->>Admin: 13. Xác nhận xử lý tranh chấp thành công
    BE->>Renter: 14. Bắn thông báo đẩy FCM & WS báo kết quả phân xử tranh chấp
    BE->>Owner: 15. Bắn thông báo đẩy FCM & WS báo kết quả nhận đền bù thành công
```

---

## 💬 3. Kiến Trúc Live Support Chat thời gian thực (Customer Live Support Pipeline)

Hệ thống cho phép bất kỳ khách hàng nào khởi tạo một phiên **Live Support** kết nối trực tiếp với các Admin đang online qua kênh WebSocket:

```mermaid
flowchart TD
    User[Khách hàng gặp sự cố] -->|Click Yêu cầu Hỗ trợ| API_Create[POST /conversations/support]
    
    subgraph ServiceLayer [Tạo Phòng Hỗ Trợ]
        API_Create --> CheckExist{Đã có cuộc hội thoại\nsupport nào trước đó?}
        CheckExist -->|Chưa có| CreateNew["Tạo Conversation mới:
        - conversationType: 'ONE_TO_ONE'
        - type: 'support'
        - lastMessage: 'Yêu cầu hỗ trợ từ...'"]
        CheckExist -->|Đã có| GetActive[Lấy bản ghi support conversation cũ]
    end

    CreateNew & GetActive --> JoinUser[User Client phát sự kiện WS: 'conversation.join']
    JoinUser --> WS_User[WebSocket Server đăng ký socket của User vào phòng conversation:convId]

    %% Phía Admin
    AdminOnline[Admin đăng nhập hệ thống] --> WS_AdminJoin[WebSocket Server tự động đăng ký Admin socket vào room:admin_pool]
    
    %% Luồng Chat
    User -->|Gửi tin nhắn chat mới| WS_Msg[WebSocket phát sự kiện conversation.message.created]
    WS_Msg --> BroadcastConv[Broadcast tới phòng conversation:convId để hiển thị phía User]
    WS_Msg --> BroadcastAdmin[Broadcast tới room:admin_pool để thông báo cho toàn bộ Admin Online]
    
    BroadcastAdmin --> AdminReceive[Admin Dashboard bắt được tin nhắn -> Mở khung chat phản hồi User]
```

---

## 🔒 4. Hàng Rào Bảo Vệ & Phân Quyền Admin (RBAC Gates)

Hệ thống áp dụng cơ chế phân quyền kép ở cả tầng REST API Middleware và WebSocket Gateway để chặn đứng mọi truy cập trái phép vào kho dữ liệu quản trị:

### 4.1 Hàng rào Bảo vệ REST API (`adminGuard`)
Middleware `adminGuard` chặn đứng toàn bộ các request không có quyền `admin` ngay tại tầng Route:
```typescript
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

export const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return next(new AppError(403, "FORBIDDEN", "Quyền truy cập bị từ chối. Chỉ dành cho Admin."));
  }
  next();
};
```

### 4.2 Hàng rào Phân quyền Mảng tùy biến (`requireRole`)
Đối với các route quản trị linh hoạt hơn (hỗ trợ cho cả Moderator hoặc Mediator), route sử dụng `requireRole`:
```typescript
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED" } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: `Yêu cầu quyền: ${roles.join(', ')}` } });
    }
    return next();
  };
};
```

### 4.3 Chốt chặn bảo mật WebSocket (Zero-Trust WS Verification)
Khi người dùng phát lệnh gia nhập phòng chat đối soát tranh chấp (`conversation.join`), WebSocket Gateway tiến hành kiểm tra chéo:
```typescript
const state = await getConversationAccessState(conversationId, userId);
let allowed = state.isMember;

// Nếu người dùng không phải thành viên phòng chat, nhưng là Admin và đây là phòng chat support / phòng tranh chấp
if (!allowed && userRole === "admin") {
  const conversation = await ConversationModel.findById(conversationId).select("type").lean();
  if (conversation?.type === "support") {
    allowed = true; // Cho phép Admin join vào phòng hỗ trợ
  }
}

if (!state.exists || !allowed) {
  ws.send(JSON.stringify({ type: "ack", id: data.id, success: false, error: { code: "FORBIDDEN" } }));
  return;
}
```

---

## 📊 5. Thuật Toán Thống Kê Tổng Hợp Chỉ Số Hệ Thống

Endpoint `/dashboard-stats` thực hiện truy vấn song song tối ưu hiệu năng và tính toán phân bổ dữ liệu:
1.  **Online/Offline Users**: Phân tích số lượng active user toàn sàn để ước lượng dòng người dùng trực tuyến.
2.  **Order Success Rate**:
    $$\text{Tỷ lệ Đơn thành công} = \frac{\text{delivered} + \text{confirmed} + \text{shipped}}{\text{Tổng số Đơn hàng}} \times 100\%$$
3.  **Inventory Quantities (Tổng lượng thiết bị)**: Quét toàn bộ danh mục sản phẩm và cộng dồn số lượng trạng thái trong mảng `statusQuantities` để kết xuất biểu đồ tròn biểu diễn năng lực cung cấp tài sản của URent:
    $$\text{Tổng kho tài sản} = \sum (\text{available} + \text{rented} + \text{overdue})$$

> [!TIP]
> **Audit Logging**: Mọi hành vi phân xử tranh chấp của Admin đều được ghi lại bất biến tại `ActivityLog` kèm theo mã `eventKey` đối soát, bảo đảm tính minh bạch tài chính tuyệt đối của sàn giao dịch cho thuê URent.
