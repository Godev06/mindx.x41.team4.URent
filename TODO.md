# TODO - Cập nhật API frontend theo backend

## Status

- [x] Messages (1->4)
- [x] Fix endpoint: `getConversationPeerByEmail` gọi `/api/v1/conversations/peer-by-email`
  - [x] Đã đổi sang backend route: `GET /api/v1/conversations/peer` (query `email`/`phone`)
  - [ ] Cần rà soát các nơi khác đang gọi `/peer-by-email`
- [ ] Notifications (2->4)
- [ ] Profile/Settings (3->4)
- [ ] Products/Orders (4->4)

## Notes (đã kiểm tra trong backend)

- `GET /api/v1/conversations` trả `sendSuccess(res, items, meta)` => frontend phải đọc `res.data.data` (không phải `res.data.data.data`).
- `GET /api/v1/conversations/peer` nhận query `email` hoặc `phone` (không phải route `peer-by-email`).

## Messages

- [x] Fix endpoint: `getConversationPeerByEmail`
- [ ] Rà soát map response `sendSuccess` cho mọi message-related service (mỗi method dùng `return res.data` hay `res.data.data`)
- [ ] Xác nhận `searchMessages` dùng đúng `q` bắt buộc cho `GET /api/v1/messages/search`

## Notifications

- [ ] Rà soát paths/method/query params cho notifications service theo backend:
  - `GET /api/v1/notifications`
  - `GET /api/v1/notifications/unread-count`
  - `PATCH /api/v1/notifications/:id/read`
  - `PATCH /api/v1/notifications/mark-all-read?type=...`
  - `DELETE /api/v1/notifications/:id`

## Profile/Settings

- [ ] Profile avatar: kiểm tra frontend upload multipart field name là `avatar` và route là `/api/v1/profile/avatar`
- [ ] Settings: kiểm tra frontend gọi `PATCH /api/v1/settings` đúng body theo backend validator

## Products/Orders

- [ ] Rà soát paths/method cho products service theo backend:
  - `/api/v1/products`
  - `/api/v1/products/:id`
  - `/api/v1/products/:id/archive`
  - `/api/v1/products/ai/analyze`
- [ ] Rà soát paths/method cho orders service theo backend:
  - `/api/v1/orders`
  - `/api/v1/orders/:id`
  - `/api/v1/orders/:id/status`
