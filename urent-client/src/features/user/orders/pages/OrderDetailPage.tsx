import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../shared/context/LanguageContext";
import { messageService } from "../../messages/services/messageService";
import { useAuth } from "../../auth/hooks/useAuth";
import { useToast } from "../../shared/hooks/useToast";
import OrderHeader from "../components/OrderHeader";
import { fetchOrderDetail, updateOrderStatus } from "../services/orderService";
import { fetchReviewByOrder, createReview } from "../services/reviewService";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const decodedOrderId = orderId ? decodeURIComponent(orderId) : "";

  const [order, setOrder] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConnectingSupport, setIsConnectingSupport] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const days = useMemo(() => {
    if (!order?.rawStartDate || !order?.rawEndDate) return 1;
    const start = new Date(order.rawStartDate);
    const end = new Date(order.rawEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  }, [order]);

  const isDbVnd = useMemo(() => {
    if (!order) return false;
    return order.totalPrice > 1000;
  }, [order]);

  const isShowVnd = useI18n().lang === "vi";

  const displayDailyPrice = useMemo(() => {
    if (!product) return 0;
    const dailyVnd = isDbVnd ? product.price : product.price * 25000;
    const dailyUsd = isDbVnd ? product.price / 25000 : product.price;
    return isShowVnd ? dailyVnd : dailyUsd;
  }, [product, isDbVnd, isShowVnd]);

  const displayTotalPrice = useMemo(() => {
    if (!order) return 0;
    const totalVnd = isDbVnd ? order.totalPrice : order.totalPrice * 25000;
    const totalUsd = isDbVnd ? order.totalPrice / 25000 : order.totalPrice;
    return isShowVnd ? totalVnd : totalUsd;
  }, [order, isDbVnd, isShowVnd]);

  const serviceFee = displayDailyPrice * 0.1;

  const formatPrice = (value: number) => {
    if (isShowVnd) {
      return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      });
    }
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const isRenter = useMemo(() => {
    if (!user || !order) return false;
    return String(order.renter?.id) === String(user.id);
  }, [user, order]);

  const isOwner = useMemo(() => {
    if (!user || !order) return false;
    return String(order.owner?.id) === String(user.id);
  }, [user, order]);

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t.orderCardPending || "Chờ xử lý";
      case "confirmed":
        return t.orderCardConfirmed || "Đã xác nhận";
      case "shipped":
        return t.orderCardShipping || "Đang giao / Đang thuê";
      case "delivered":
        return t.orderCardDelivered || "Đã giao / Hoàn tất";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const loadOrderDetail = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const ord = await fetchOrderDetail(decodedOrderId);

      const mappedOrder = {
        id: ord.orderCode,
        _id: ord._id,
        productId: ord.productId?._id || ord.productId,
        productName: ord.productName,
        customerName: ord.customerName,
        startDate: new Date(ord.startDate).toLocaleDateString("vi-VN"),
        endDate: new Date(ord.endDate).toLocaleDateString("vi-VN"),
        rawStartDate: ord.startDate,
        rawEndDate: ord.endDate,
        totalPrice: ord.totalPrice,
        status: ord.status,
        image: "🛒",
        owner: ord.ownerId ? {
          id: ord.ownerId._id,
          name: ord.ownerId.displayName || ord.ownerId.username || "",
          avatar: ord.ownerId.avatarUrl || "",
          phone: ord.ownerId.phone || "",
          rating: ord.ownerId.rating ?? 5.0,
          trips: ord.ownerId.trips ?? 0,
        } : { id: undefined, name: "URent Partner", avatar: "", phone: "", rating: 5.0, trips: 10 },
        renter: ord.renterId ? {
          id: ord.renterId._id,
          name: ord.renterId.displayName || ord.renterId.username || "",
          avatar: ord.renterId.avatarUrl || "",
          phone: ord.renterId.phone || "",
          rating: ord.renterId.rating ?? 0,
          trips: ord.renterId.trips ?? 0,
        } : { id: undefined, name: "", avatar: "", phone: "", rating: 0, trips: 0 },
      };

      const mappedProduct = {
        id: ord.productId?._id || ord.productId,
        name: ord.productId?.name || ord.productName,
        category: ord.productId?.category || "Điện tử & Công nghệ",
        price: ord.productId?.price || Math.round(ord.totalPrice / 3),
        status: ord.productId?.status || "Available",
        image: "🛒",
        imageUrl: ord.productId?.imageUrl || ord.productId?.image || "",
        rating: ord.productId?.rating || 5.0,
        reviews: ord.productId?.reviewsCount || 0,
        locationText: ord.productId?.locationText || "",
        location: ord.productId?.location || null,
        owner: ord.productId?.ownerId ? {
          id: ord.productId.ownerId._id,
          name: ord.productId.ownerId.displayName || ord.productId.ownerId.username || "",
          avatar: ord.productId.ownerId.avatarUrl || "",
          phone: ord.productId.ownerId.phone || "",
          rating: ord.productId.ownerId.rating ?? 5.0,
          trips: ord.productId.ownerId.trips ?? 0,
        } : (ord.ownerId ? {
          id: ord.ownerId._id,
          name: ord.ownerId.displayName || ord.ownerId.username || "",
          avatar: ord.ownerId.avatarUrl || "",
          phone: ord.ownerId.phone || "",
          rating: ord.ownerId.rating ?? 5.0,
          trips: ord.ownerId.trips ?? 0,
        } : { id: undefined, name: "URent Partner", avatar: "", phone: "", rating: 5.0, trips: 10 }),
        renter: ord.renterId ? {
          name: ord.renterId.displayName || ord.renterId.username || "",
          avatar: ord.renterId.avatarUrl || "",
          rating: ord.renterId.rating ?? 0,
          trips: ord.renterId.trips ?? 0,
        } : { name: "", avatar: "", rating: 0, trips: 0 },
        summary: ord.productId?.description?.join(", ") || "",
        description: ord.productId?.description || [],
      };

      setOrder(mappedOrder);
      setProduct(mappedProduct);

      if (ord.status === "delivered") {
        try {
          const rev = await fetchReviewByOrder(ord._id);
          setReview(rev);
        } catch (err) {
          console.error("Failed to fetch review for order:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load order detail from BE:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [decodedOrderId, isAuthenticated]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (isUpdatingStatus || !order?._id) return;
    try {
      setIsUpdatingStatus(true);
      await updateOrderStatus(order._id, newStatus);
      showToast({
        title: "Cập nhật thành công",
        description: `Đơn hàng đã được chuyển sang trạng thái mới.`,
        variant: "success",
      });
      await loadOrderDetail(false);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showToast({
        title: "Cập nhật thất bại",
        description: err.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng.",
        variant: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) {
      showToast({
        title: "Thông báo",
        description: "Vui lòng nhập nội dung nhận xét.",
        variant: "error",
      });
      return;
    }
    try {
      setIsSubmittingReview(true);
      const newReview = await createReview({
        orderId: order._id,
        rating: ratingInput,
        content: commentInput,
      });
      setReview(newReview);
      showToast({
        title: "Đánh giá thành công",
        description: "Cảm ơn bạn đã đóng góp ý kiến về sản phẩm!",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      showToast({
        title: "Gửi đánh giá thất bại",
        description: err.response?.data?.message || "Không thể gửi đánh giá lúc này.",
        variant: "error",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleChatWithExpert = async () => {
    if (isConnectingSupport) return;
    try {
      setIsConnectingSupport(true);
      const conversation = await messageService.getOrCreateSupportConversation();
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      console.error("Failed to connect to support chat:", error);
    } finally {
      setIsConnectingSupport(false);
    }
  };

  const handleChatWithPartner = async () => {
    if (isConnectingSupport) return;
    try {
      setIsConnectingSupport(true);

      let partnerId: string | undefined = undefined;
      if (isOwner) {
        partnerId = order.renter?.id || order.renterId || order.customerId;
      } else {
        partnerId = product.owner?.id || order.owner?.id || order.ownerId;
      }

      if (!partnerId) {
        console.error("Partner ID missing");
        return;
      }
      const conversation = await messageService.createConversation(String(partnerId));
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      console.error("Failed to start chat with partner:", error);
    } finally {
      setIsConnectingSupport(false);
    }
  };

  if (isLoading || !order || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-slate-500">{t.loadingSession || "Đang tải..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Header Widget */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-teal-500/10 via-amber-500/5 to-purple-500/10 border border-slate-200/50 dark:border-slate-800/40 shadow-xs">
        <OrderHeader
          title={t.orderDetailTitle}
          subtitle={t.orderDetailSubtitle}
          statusNow={t.orderDetailStatusNow}
          statusBadge={getStatusText(order.status)}
        />
      </div>

      {/* Dynamic Premium Stepper Timeline Progress Bar */}
      <section className="rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800/80 dark:bg-slate-900/60 p-6 shadow-sm ring-1 ring-slate-900/4 dark:ring-white/4 backdrop-blur-md">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">

          {/* Connecting Line between Steps */}
          <div className="absolute top-[24px] left-[12%] right-[12%] h-[3px] bg-slate-100 dark:bg-slate-800 hidden md:block z-0 rounded-full">
            <div
              className="h-full bg-teal-500 transition-all duration-700 ease-out rounded-full"
              style={{
                width: order.status === "delivered"
                  ? "100%"
                  : order.status === "shipped"
                    ? "66%"
                    : order.status === "confirmed"
                      ? "33%"
                      : "0%"
              }}
            />
          </div>

          {/* Step 1: Meetup */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[180px]">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-all duration-300 ring-4 ${(order.status === "confirmed" || order.status === "shipped" || order.status === "delivered")
              ? "bg-teal-600 ring-teal-500/20"
              : (order.status === "pending")
                ? "bg-amber-500 ring-amber-500/20 scale-110 shadow-md shadow-amber-500/25 animate-pulse"
                : "bg-slate-200 text-slate-500 ring-slate-200/10 dark:bg-slate-800 dark:text-slate-400"
              }`}>
              <PackageCheck size={18} />
            </div>
            <h4 className={`mt-3 text-xs font-bold transition-colors duration-300 ${(order.status === "confirmed" || order.status === "shipped" || order.status === "delivered")
              ? "text-teal-600 dark:text-teal-400"
              : (order.status === "pending")
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-500 dark:text-slate-400"
              }`}>
              {t.orderDetailMeetup}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              {order.startDate}
            </p>
          </div>

          {/* Step 2: Received */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[180px]">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-all duration-300 ring-4 ${(order.status === "shipped" || order.status === "delivered")
              ? "bg-teal-600 ring-teal-500/20"
              : order.status === "confirmed"
                ? "bg-amber-500 ring-amber-500/20 scale-110 shadow-md shadow-amber-500/25 animate-pulse"
                : "bg-slate-200 text-slate-500 ring-slate-200/10 dark:bg-slate-800 dark:text-slate-400"
              }`}>
              <QrCode size={18} />
            </div>
            <h4 className={`mt-3 text-xs font-bold transition-colors duration-300 ${(order.status === "shipped" || order.status === "delivered")
              ? "text-teal-600 dark:text-teal-400"
              : order.status === "confirmed"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-500 dark:text-slate-400"
              }`}>
              {t.orderDetailReceived}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold leading-tight">
              {order.status === "pending" ? t.orderDetailNotReached : order.status === "confirmed" ? t.orderDetailVerifyingQr : t.orderCardConfirmed}
            </p>
          </div>

          {/* Step 3: Returning */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[180px]">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-all duration-300 ring-4 ${order.status === "delivered"
              ? "bg-teal-600 ring-teal-500/20"
              : order.status === "shipped"
                ? "bg-amber-500 ring-amber-500/20 scale-110 shadow-md shadow-amber-500/25 animate-pulse"
                : "bg-slate-200 text-slate-500 ring-slate-200/10 dark:bg-slate-800 dark:text-slate-400"
              }`}>
              <Clock3 size={18} />
            </div>
            <h4 className={`mt-3 text-xs font-bold transition-colors duration-300 ${order.status === "delivered"
              ? "text-teal-600 dark:text-teal-400"
              : order.status === "shipped"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-500 dark:text-slate-400"
              }`}>
              {t.orderDetailReturning}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              {order.status === "delivered" ? t.orderCardDelivered : order.status === "shipped" ? "Đang sử dụng" : t.orderDetailNotReached}
            </p>
          </div>

          {/* Step 4: Completed */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[180px]">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-all duration-300 ring-4 ${order.status === "delivered"
              ? "bg-teal-600 ring-teal-500/20 scale-110 shadow-md shadow-teal-500/25"
              : "bg-slate-200 text-slate-500 ring-slate-200/10 dark:bg-slate-800 dark:text-slate-400"
              }`}>
              <CheckCircle2 size={18} />
            </div>
            <h4 className={`mt-3 text-xs font-bold transition-colors duration-300 ${order.status === "delivered"
              ? "text-teal-600 dark:text-teal-400 font-extrabold"
              : "text-slate-500 dark:text-slate-400"
              }`}>
              {t.orderDetailCompleted}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              {order.status === "delivered" ? "Đã hoàn thành" : t.orderDetailNotConfirmed}
            </p>
          </div>

        </div>
      </section>

      {/* Control Center & Support Columns */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Left: Actions Control Card */}
        <article className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/4 xl:col-span-8 dark:border-slate-800/80 dark:bg-slate-900/60 dark:ring-white/4">
          <div className="flex flex-col h-full justify-between gap-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="text-teal-600 h-5.5 w-5.5" />
                Hành động & Tiến trình giao nhận
              </h2>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                {isRenter && order.status === "pending" && "Chờ chủ sở hữu duyệt yêu cầu thuê của bạn. Bạn có thể chọn hủy yêu cầu nếu không còn nhu cầu."}
                {isRenter && order.status === "confirmed" && "Chủ sở hữu đã duyệt yêu cầu thuê! Hai bên vui lòng gặp mặt tại điểm hẹn, kiểm tra thiết bị, sau đó chủ sở hữu sẽ bấm xác nhận giao đồ để kích hoạt thời gian thuê."}
                {isRenter && order.status === "shipped" && "Đơn hàng đang trong trạng thái sử dụng. Sau khi dùng xong và trả thiết bị đầy đủ, hãy bấm 'Xác nhận hoàn tất đơn hàng'."}
                {isRenter && order.status === "delivered" && "Đơn hàng đã hoàn thành trọn vẹn và an toàn! Cảm ơn bạn đã lựa chọn dịch vụ của U-Rent."}
                {isRenter && order.status === "cancelled" && "Đơn hàng này đã bị hủy."}

                {isOwner && order.status === "pending" && "Bạn nhận được một yêu cầu thuê thiết bị mới! Vui lòng kiểm tra kỹ thời gian thuê và xác nhận hoặc từ chối yêu cầu."}
                {isOwner && order.status === "confirmed" && "Bạn đã duyệt yêu cầu. Vui lòng gặp khách hàng tại điểm hẹn để bàn giao thiết bị, sau đó bấm 'Xác nhận đã bàn giao đồ'."}
                {isOwner && order.status === "shipped" && "Thiết bị đang được khách hàng thuê và sử dụng. Đang đợi khách hàng bấm hoàn tất sau khi trả đồ."}
                {isOwner && order.status === "delivered" && "Đơn hàng đã hoàn thành trọn vẹn và an toàn! Doanh thu đã được cộng vào tài khoản của bạn."}
                {isOwner && order.status === "cancelled" && "Đơn hàng này đã bị hủy."}

                {!isRenter && !isOwner && "Xem thông tin trạng thái đơn hàng."}
              </p>
            </div>

            {/* QR or Illustration Area */}
            <div className="flex flex-col items-center justify-center py-4">
              {(order.status === "pending" || order.status === "confirmed") ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-3xl border-2 border-dashed border-teal-500/40 bg-teal-50/20 p-4 dark:border-teal-500/25 dark:bg-teal-500/5 transition-transform hover:scale-102 duration-300 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(order.id)}`}
                      alt="Order QR Code"
                      className="h-40 w-40 object-contain rounded-xl shadow-xs"
                    />
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                    <QrCode size={14} />
                    Mã đơn hàng: <span className="font-extrabold">{order.id}</span>
                  </div>
                </div>
              ) : order.status === "shipped" ? (
                <div className="flex flex-col items-center text-center py-6 space-y-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 animate-pulse">
                    <Clock3 size={32} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Thiết bị đang được sử dụng</h3>
                  <p className="text-xs text-slate-500 max-w-xs font-medium leading-relaxed">Hệ thống đang bảo vệ giao dịch của bạn. Hãy liên hệ với đối tác nếu cần hỗ trợ.</p>
                </div>
              ) : order.status === "delivered" ? (
                <div className="flex flex-col items-center text-center py-6 space-y-3 w-full">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Giao dịch đã hoàn tất</h3>
                  <p className="text-xs text-slate-500 max-w-sm font-medium leading-relaxed">Hợp đồng điện tử đã được lưu giữ an toàn và giao dịch được hoàn tất trọn vẹn.</p>
                  
                  {isRenter && (
                    <div className="mt-6 w-full max-w-md border-t border-slate-100 dark:border-white/5 pt-6 text-left">
                      {review ? (
                        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/10 p-5 shadow-xs dark:border-teal-500/20 dark:bg-teal-500/5">
                          <h4 className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2">Đánh giá của bạn</h4>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10"
                                }
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold italic">
                            "{review.content}"
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Đánh giá & Nhận xét sản phẩm</h4>
                            <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1">Chia sẻ trải nghiệm của bạn khi thuê thiết bị này.</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-550 dark:text-slate-350">Chọn mức độ hài lòng:</span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setRatingInput(star)}
                                  onMouseEnter={() => setHoveredRating(star)}
                                  onMouseLeave={() => setHoveredRating(null)}
                                  className="transition-transform duration-150 hover:scale-125 focus:outline-none cursor-pointer"
                                >
                                  <Star
                                    size={24}
                                    className={`transition-colors duration-150 ${
                                      star <= (hoveredRating ?? ratingInput)
                                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]"
                                        : "fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <textarea
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              placeholder="Thiết bị hoạt động tốt không? Chủ xe hỗ trợ nhiệt tình chứ?..."
                              rows={3}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 shadow-inner outline-none transition focus:border-teal-400 dark:border-white/8 dark:bg-white/4 dark:text-white focus:ring-1 focus:ring-teal-400/30"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingReview ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              "Gửi đánh giá"
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-6 space-y-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Giao dịch đã bị hủy</h3>
                  <p className="text-xs text-slate-500 max-w-sm font-medium leading-relaxed">Yêu cầu giao dịch này đã đóng và không thể thực hiện thêm hành động nào.</p>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-3 items-center justify-center border-t border-slate-100 dark:border-slate-800/80 pt-5">
              {isUpdatingStatus ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-2 font-bold">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  <span>Đang cập nhật trạng thái...</span>
                </div>
              ) : (
                <>
                  {/* Owner & Pending Actions */}
                  {isOwner && order.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus("confirmed")}
                        className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition cursor-pointer"
                      >
                        Chấp nhận yêu cầu thuê
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("cancelled")}
                        className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-950 dark:bg-rose-950/20 px-5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer"
                      >
                        Từ chối yêu cầu
                      </button>
                    </>
                  )}

                  {/* Owner & Confirmed Action */}
                  {isOwner && order.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus("shipped")}
                      className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition cursor-pointer"
                    >
                      Xác nhận đã bàn giao đồ
                    </button>
                  )}

                  {/* Renter & Pending Action */}
                  {isRenter && order.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus("cancelled")}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      Hủy yêu cầu thuê
                    </button>
                  )}

                  {/* Renter & Shipped Action */}
                  {isRenter && order.status === "shipped" && (
                    <button
                      onClick={() => handleUpdateStatus("delivered")}
                      className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 transition cursor-pointer"
                    >
                      Xác nhận nhận đồ & Hoàn tất đơn hàng
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </article>

        {/* Right Sidebar: Protection & Support */}
        <aside className="space-y-4 xl:col-span-4">
          {/* U-Rent Protection Gradient Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-600 via-teal-700 to-indigo-900 p-6 text-white shadow-md border border-teal-500/20">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-xs font-extrabold tracking-wide uppercase">
                {t.orderDetailProtectTitle || "U-Rent Protect"}
              </h3>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
                <ShieldCheck size={16} />
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-[11px] text-teal-50/90 leading-relaxed font-semibold">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-300" />
                {t.orderDetailProtectLine1}
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-300" />
                {t.orderDetailProtectLine2}
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-300" />
                {t.orderDetailProtectLine3}
              </li>
            </ul>
            <button className="relative z-10 mt-5 w-full rounded-xl bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-black text-teal-700 hover:text-amber-500 transition-colors shadow-xs cursor-pointer">
              {t.orderDetailProtectBtn}
            </button>
          </div>

          {/* Support Panel */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-slate-800/80 dark:bg-slate-900/60 dark:ring-white/4">
            <div className="border-b border-slate-250 bg-linear-to-r from-slate-50 to-teal-50/70 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-teal-500/10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {t.orderDetailSupportTitle}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t.orderDetailAvgResponse}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/20">
                <p className="text-[11px] leading-5 text-slate-600 dark:text-slate-300 font-medium">
                  {t.orderDetailSupportDesc}
                </p>
              </div>

              {/* Chat action rows */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isConnectingSupport}
                  onClick={handleChatWithExpert}
                  className="group flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50/40 dark:border-slate-850 dark:bg-slate-800/30 dark:hover:border-teal-500/40 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 shrink-0">
                    {isConnectingSupport ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-700 border-t-transparent dark:border-teal-300" />
                    ) : (
                      <MessageCircle size={15} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {isConnectingSupport ? "Đang kết nối..." : t.orderDetailChatExpert}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      {isConnectingSupport ? "Đang kết nối tới tổng đài viên..." : t.orderDetailChatExpertDesc}
                    </p>
                  </div>
                </button>

                <button
                  disabled={isConnectingSupport}
                  onClick={handleChatWithPartner}
                  className="group flex w-full items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-blue-700 dark:bg-blue-800/30 dark:hover:border-blue-500/40 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 shrink-0">
                    {isConnectingSupport ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent dark:border-blue-300" />
                    ) : (
                      <MessageCircle size={15} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {isConnectingSupport
                        ? "Đang kết nối..."
                        : (isOwner ? "Chat với Người thuê" : t.orderDetailChatOwner)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      {isConnectingSupport
                        ? (isOwner ? "Đang kết nối tới người thuê..." : "Đang kết nối tới chủ sở hữu...")
                        : (isOwner ? "Liên hệ trực tiếp với người thuê qua tin nhắn" : t.orderDetailChatOwnerDesc)}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/messages")}
                  className="group flex w-full items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-3 text-left transition hover:bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-500/10 cursor-pointer"
                >
                  <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 shrink-0">
                    <AlertTriangle size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                      {t.orderDetailReportViolation}
                    </p>
                    <p className="mt-0.5 text-[10px] text-rose-700/80 dark:text-rose-300/80 leading-normal">
                      {t.orderDetailReportViolationDesc}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Product & Payment & Maps Segment */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Product & Billing details card */}
        <article className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 xl:col-span-8 dark:border-slate-800/80 dark:bg-slate-900/60 dark:ring-white/4">
          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
            {/* Product details */}
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800/80 flex flex-col justify-between gap-5 bg-slate-50/20 dark:bg-slate-900/10">

              {/* Product Info Block */}
              <div className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-slate-100 dark:from-slate-850 to-slate-50 dark:to-slate-750 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-inner group">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                  ) : (
                    <span className="text-4xl">{order.image || "🛒"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-sm font-black leading-snug text-slate-900 dark:text-slate-100 truncate">
                    {product.name}
                  </h3>
                  <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                    {product.category || "Thiết bị & Công nghệ"}
                  </span>
                </div>
              </div>

              {/* Partner Profile Block */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {isOwner ? "Thông tin khách hàng (Người thuê)" : "Thông tin đối tác (Chủ sở hữu)"}
                </p>

                {isOwner ? (
                  /* Renter Profile */
                  <div className="flex items-center gap-3.5 rounded-xl border border-slate-150 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-800/20 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-200 shadow-xs">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 overflow-hidden font-bold">
                      {order.renter?.avatar ? (
                        <img src={order.renter.avatar} alt={order.renter?.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold">
                          {(order.renter?.name?.[0] || "U").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                        {order.renter?.name || order.customerName || "Khách hàng U-Rent"}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                        {order.renter?.phone ? `SĐT: ${order.renter.phone}` : "Số điện thoại đã được bảo mật"}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Owner Profile */
                  <div className="flex items-center gap-3.5 rounded-xl border border-slate-150 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-800/20 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition duration-200 shadow-xs">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 overflow-hidden font-bold">
                      {product.owner?.avatar ? (
                        <img src={product.owner.avatar} alt={product.owner?.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold">
                          {(product.owner?.name?.[0] || "U").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                        {product.owner?.name || order.owner?.name || t.orderDetailOwnerFallback}
                      </h4>
                      <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 gap-1.5 flex-wrap font-semibold">
                        <span className="font-extrabold text-amber-500">{product.owner?.rating?.toFixed(1) || "5.0"} ★</span>
                        <span>·</span>
                        <span>{product.owner?.trips || 10} chuyến</span>
                        {product.owner?.phone && (
                          <>
                            <span>·</span>
                            <span className="truncate">SĐT: {product.owner.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rental Duration specifications */}
              <dl className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <div className="flex justify-between font-semibold">
                  <dt>{t.orderDetailRentalDuration}</dt>
                  <dd className="font-bold text-slate-850 dark:text-slate-100">
                    {days} {isShowVnd ? "ngày" : "days"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t.orderDetailStartDate}</dt>
                  <dd className="font-bold text-slate-850 dark:text-slate-100">
                    {order.startDate}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t.orderDetailEndDate}</dt>
                  <dd className="font-bold text-slate-850 dark:text-slate-100">
                    {order.endDate}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Payment Specifications */}
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800/80 flex flex-col justify-between bg-slate-50/20 dark:bg-slate-900/10">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {t.orderDetailPaymentDetails}
                </h4>
                <dl className="space-y-2.5 text-xs text-slate-650 dark:text-slate-350">
                  <div className="flex justify-between font-semibold">
                    <dt>{t.orderDetailRentPerDay}</dt>
                    <dd className="text-slate-800 dark:text-slate-200">{formatPrice(displayDailyPrice)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>{t.orderDetailServiceFee}</dt>
                    <dd className="text-slate-800 dark:text-slate-200">{formatPrice(serviceFee)}</dd>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                    <dt>{t.orderDetailDeposit}</dt>
                    <dd>{t.wizardDepositFree}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/85 pt-4 dark:border-slate-800">
                <span className="text-sm font-black text-slate-850 dark:text-slate-100">
                  {t.orderDetailTotal}
                </span>
                <div className="bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-xl shadow-inner border border-teal-200/20">
                  <span className="text-xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
                    {formatPrice(displayTotalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Right: Map Widget */}
        <aside className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden xl:col-span-4 dark:border-slate-800/80 dark:bg-slate-900/60 p-3">
          <div className="relative flex h-full min-h-55 flex-col overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60">
            {/* Grid Pattern Background mimicking coordinates map */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] dark:bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]" />

            {/* Soft pulsing halo and pin in center */}
            <div className="relative flex-1 flex flex-col items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full bg-teal-500/10 dark:bg-teal-400/10 animate-ping duration-3000" />
              <div className="absolute h-10 w-10 rounded-full bg-teal-500/20 dark:bg-teal-400/20 animate-pulse" />
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/30">
                <MapPin size={28} className="animate-bounce" />
              </div>
            </div>

            {/* Address bar block */}
            <div className="relative z-10 border-t border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3.5 dark:border-slate-800 dark:bg-slate-950/80">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t.orderDetailPickupLocation || "ĐỊA ĐIỂM GIAO NHẬN"}
              </p>
              <p className="mt-1 text-xs font-extrabold text-slate-850 dark:text-slate-200 leading-relaxed">
                {product.locationText || t.orderDetailPickupAddress}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
