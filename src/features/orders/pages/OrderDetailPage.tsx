import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ORDERS, PRODUCTS } from "../../shared/data";
import { Badge } from "../../shared/components/Badge";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const decodedOrderId = orderId ? decodeURIComponent(orderId) : "";

  const order = useMemo(
    () => ORDERS.find((item) => item.id === decodedOrderId) ?? ORDERS[0],
    [decodedOrderId],
  );

  const product = useMemo(
    () => PRODUCTS.find((item) => item.id === order.productId) ?? PRODUCTS[0],
    [order.productId],
  );

  return (
    <div className="space-y-5 pb-10">
      <button
        type="button"
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách đơn
      </button>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Chi tiết đơn hàng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý và theo dõi quá trình mượn/trả thiết bị học tập của bạn.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Trạng thái hiện tại
            </p>
            <Badge variant="green">Trên cao độ đổi đồ với 100%</Badge>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
              <PackageCheck size={16} />
            </div>
            <p className="text-[11px] font-semibold text-teal-600">Gặp mặt</p>
            <p className="text-[10px] text-slate-400">10:30, trưa</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
              <QrCode size={16} />
            </div>
            <p className="text-[11px] font-semibold text-amber-600">Đã nhận</p>
            <p className="text-[10px] text-slate-400">Đang xác minh QR</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <Clock3 size={16} />
            </div>
            <p className="text-[11px] font-medium text-slate-500">Đang trả</p>
            <p className="text-[10px] text-slate-400">Chưa tới bước</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Đã hoàn tất
            </p>
            <p className="text-[10px] text-slate-400">Chưa xác nhận</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 xl:col-span-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Xác nhận giao nhận
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Vui lòng đưa mã này cho chủ đồ quét để xác nhận bạn đã nhận được máy
            tính.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-amber-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Mã QR AI mới
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-slate-100">
                <QrCode size={96} className="text-slate-700" />
              </div>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={14} />
            Mã tự động làm mới sau 02:45
          </div>
        </article>

        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-2xl bg-linear-to-br from-teal-600 to-teal-700 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">StudyShare Bảo Vệ</h3>
              <ShieldCheck size={16} />
            </div>
            <ul className="mt-3 space-y-2 text-xs text-teal-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5" />
                Trả cọc có thiệt hại phát sinh.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5" />
                Hỗ trợ xử lý 24/7 nếu sản phẩm không đúng mô tả.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5" />
                Bảo hiểm hỏng hóc trong quá trình sử dụng.
              </li>
            </ul>
            <button className="mt-4 w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-teal-600 hover:text-amber-500">
              Tìm hiểu chính sách bảo vệ
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Hỗ trợ khách hàng
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-xs font-medium text-slate-700">
                Phản hồi trung bình dưới 2 phút
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Nếu có sự cố QR, đội hỗ trợ sẽ ưu tiên xử lý ngay trong phiên
                giao nhận.
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                className="flex w-full items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
              >
                <MessageCircle size={14} className="mt-0.5 text-teal-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Chat với Chuyên gia
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Trao đổi trực tiếp để xử lý ngay tại điểm hẹn
                  </p>
                </div>
              </button>
              <button
                type="button"
                className="flex w-full items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
              >
                <Building2 size={14} className="mt-0.5 text-teal-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Trung tâm hỗ trợ
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Hướng dẫn quét mã, xác minh danh tính và chính sách
                  </p>
                </div>
              </button>
              <button
                type="button"
                className="flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-left transition hover:bg-amber-50"
              >
                <AlertTriangle size={14} className="mt-0.5 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">
                    Báo cáo vi phạm
                  </p>
                  <p className="text-[11px] text-amber-700/80">
                    Sản phẩm lỗi, không đúng mô tả hoặc nghi ngờ gian lận
                  </p>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 xl:col-span-8">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="flex gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">
                      {order.image}
                    </div>
                  )}
                </div>
                <div>
                  <Badge variant="blue">Auctionbay</Badge>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Chủ sở hữu: {product.owner?.name || "N/A"}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Thời gian thuê</dt>
                  <dd className="font-medium text-slate-800">07 ngày</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Ngày bắt đầu</dt>
                  <dd className="font-medium text-slate-800">
                    {order.startDate}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Ngày hết hạn</dt>
                  <dd className="font-medium text-slate-800">
                    {order.endDate}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Chi tiết thanh toán
              </h4>
              <dl className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Giá thuê / ngày</dt>
                  <dd>${product.price}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Phí dịch vụ</dt>
                  <dd>${Math.round(order.totalPrice * 0.1)}</dd>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <dt>Tiền cọc (hoàn trả)</dt>
                  <dd>${Math.round(order.totalPrice * 2)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-semibold text-slate-800">
                  Tổng cộng
                </span>
                <span className="text-xl font-bold text-teal-600">
                  ${order.totalPrice}
                </span>
              </div>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/4 xl:col-span-4">
          <div className="flex h-full min-h-55 flex-col overflow-hidden rounded-xl bg-slate-100">
            <div className="flex flex-1 items-center justify-center">
              <MapPin size={84} className="text-slate-400" />
            </div>
            <div className="border-t border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Địa điểm giao nhận
              </p>
              <p className="text-xs font-medium text-slate-700">
                Thư viện Trung tâm - Khu phố 6, Linh Trung
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
