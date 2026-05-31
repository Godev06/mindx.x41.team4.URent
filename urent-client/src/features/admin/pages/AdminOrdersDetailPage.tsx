import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../layout/AdminLayout";
import { apiClient } from "../../../lib/api/apiClient";
import { useToast } from "../../user/shared/hooks/useToast";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  AlertOctagon,
  UserX,
  CheckSquare,
  Mail,
  User,
} from "lucide-react";

export function AdminOrdersDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const orderRes = await apiClient.get(`/api/v1/orders/${id}`);
        if (orderRes.data && orderRes.data.success) {
          setOrder(orderRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load order details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsActionLoading(true);
    try {
      const res = await apiClient.patch(`/api/v1/orders/${id}/status`, {
        status: newStatus
      });
      if (res.data && res.data.success) {
        setOrder(res.data.data);
        showToast({
          title: "Cập nhật thành công",
          description: `Đã thay đổi trạng thái đơn hàng sang ${newStatus}`,
          variant: "success"
        });
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showToast({
        title: "Lỗi cập nhật",
        description: err.message || "Không thể cập nhật trạng thái đơn hàng",
        variant: "error"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSuspendRenter = async () => {
    const renterId = order?.renterId?._id || order?.renterId;
    if (!renterId) return;

    setIsActionLoading(true);
    try {
      await apiClient.patch(`/api/v1/users/${renterId}/trust`, {
        trustScore: 10
      });
      showToast({
        title: "Tài khoản bị hạn chế",
        description: `Đã hạ điểm tin cậy của tài khoản người thuê xuống 10%`,
        variant: "warning"
      });
    } catch (err: any) {
      console.error("Failed to suspend renter:", err);
      showToast({
        title: "Lỗi thực thi",
        description: err.message || "Không thể thực hiện hạ điểm tin cậy",
        variant: "error"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-[400px] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading order details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
          <AlertOctagon className="h-10 w-10 text-rose-500 animate-pulse" />
          <p className="text-sm font-semibold">Order transaction not found</p>
          <button onClick={() => navigate("/admin/orders")} className="mt-4 text-xs font-bold text-cyan-400 hover:underline">
            Back to Orders
          </button>
        </div>
      </AdminLayout>
    );
  }

  const trustScore = order.renterId?.trustScore ?? 100;
  const renterName = order.customerName || order.renterId?.displayName || "Platform Renter";
  const renterEmail = order.renterId?.email || "No email linked";

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Đang xử lý";
      case "confirmed":
      case "shipped":
        return "Đang thuê";
      case "delivered": return "Đã trả";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    if (status === "confirmed" || status === "shipped") {
      return "bg-teal-500/10 text-teal-400 border border-teal-500/25";
    }
    if (status === "pending") {
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
    }
    if (status === "cancelled") {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
    }
    return "bg-slate-900/50 text-slate-400 border border-slate-800";
  };

  return (
    <AdminLayout>
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 0.8; }
        }
        .scan-line {
          animation: scan 2.5s linear infinite;
        }
      `}</style>

      <div className="space-y-8">
        {/* BACK NAVIGATION AND TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-xs font-bold text-slate-300 transition duration-200 hover:text-white hover:bg-slate-900 hover:border-slate-700"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to Orders
            </button>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Order Detail Management
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Audit secure escrow operations, QR verification codes, and manage dispute resolutions
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-6 py-4 shadow-lg shadow-cyan-950/15">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Reference</p>
            <h2 className="mt-1.5 text-2xl font-black text-cyan-400">{order.orderCode}</h2>
          </div>
        </div>

        {/* METRICS ROW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RENTER AUDIT */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Renter Profile</p>
              <h2 className="mt-4 text-2xl font-extrabold text-white">{renterName}</h2>
              <div className="flex items-center gap-2 text-slate-500 mt-2 text-xs font-medium">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{renterEmail}</span>
              </div>
            </div>

            <div className={`mt-6 flex items-center gap-2 self-start rounded-xl px-3 py-1.5 text-xs font-extrabold ${trustScore >= 80 ? "bg-teal-500/10 border border-teal-500/25 text-teal-400" : "bg-yellow-500/10 border border-yellow-500/25 text-yellow-400"}`}>
              <ShieldCheck className="h-4 w-4" />
              {trustScore}% Trust Verified
            </div>
          </div>

          {/* RENTAL TIME METRICS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rental Period</p>
              <div className="mt-4 flex items-center gap-2.5">
                <span className={`rounded-xl px-3 py-1.5 text-xs font-extrabold ${getStatusClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Pick-up Date</span>
                <span className="text-white">{new Date(order.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Return Deadline</span>
                <span className="text-white">{new Date(order.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* ACTIVE NEON SCANNING MOCKUP */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Escrow Verification QR</p>
            </div>

            <div className="relative mt-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 p-4">
              {/* Animated Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-[#0df2c9] shadow-[0_0_12px_#0df2c9] opacity-80 scan-line" />

              <div className="flex flex-col items-center gap-2 z-10">
                <QrCode className="h-10 w-10 text-cyan-400/80" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0df2c9]">QR Secure Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS AND AUDITOR PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RENTER REGISTRY */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <User className="h-4.5 w-4.5 text-slate-400" />
              Order Summary & Details
            </h3>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-4.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</p>
                  <span className="text-[10px] font-black text-cyan-400 font-mono">{order.orderCode}</span>
                </div>
                <p className="text-sm font-bold text-white mt-1.5">{order.productName}</p>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold border-t border-slate-800/80 pt-3">
                  <span className="text-slate-500">Transaction Status</span>
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Total Price</span>
                  <p className="text-sm font-black text-cyan-400">${order.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AUDITOR DISPUTE PANEL */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md shadow-lg shadow-rose-950/5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertOctagon className="h-4.5 w-4.5" />
                Auditor Dispute Panel
              </h3>
              <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed">
                Take executive security actions to lock listings, restrict accounts, or close active rental escalations.
              </p>
            </div>

            <div className="mt-6 space-y-3 font-semibold text-xs">
              <button
                onClick={() => handleUpdateStatus("pending")}
                disabled={isActionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/25 py-3 text-yellow-400 hover:bg-yellow-500/20 transition disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Flag Listing For Review (Pending)
              </button>

              <button
                onClick={handleSuspendRenter}
                disabled={isActionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 py-3 text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50"
              >
                <UserX className="h-4 w-4" />
                Restrict Renter (Trust to 10%)
              </button>

              <button
                onClick={() => handleUpdateStatus("delivered")}
                disabled={isActionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/25 py-3 text-teal-400 hover:bg-teal-500/20 transition disabled:opacity-50"
              >
                <CheckSquare className="h-4 w-4" />
                Mark Dispute Resolved (Delivered)
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
