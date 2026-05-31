import { useState, useMemo } from "react";
import {
  Clock,
  LogIn,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  X,
  Zap,
  Calendar,
  User,
  Phone,
  MapPin,
  Truck,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Wallet,
  QrCode,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../shared/types";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { APP_ROUTES } from "../../auth/constants";
import { apiClient } from "../../../../lib/api/apiClient";
import { useToast } from "../../shared/hooks/useToast";
import { useAuthGate } from "../../auth/context/AuthGateContext";
import { messageService } from "../../messages/services/messageService";

interface ProductBookingCardProps {
  product: Product;
}

export function ProductBookingCard({ product }: ProductBookingCardProps) {
  const [days, setDays] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, lang } = useI18n();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { guardedNavigate } = useAuthGate();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleContactOwner = async () => {
    if (!product) return;
    const targetOwnerId = product.owner?.id || (product as any).ownerId;
    if (!targetOwnerId) {
      showToast({
        title: lang === "vi" ? "Thông báo" : "Notice",
        description: lang === "vi" ? "Không thể xác định thông tin chủ sở hữu." : "Could not identify product owner.",
        variant: "error",
      });
      return;
    }

    if (!isAuthenticated) {
      guardedNavigate(`/messages`);
      return;
    }

    if (String(user?.id) === String(targetOwnerId)) {
      showToast({
        title: lang === "vi" ? "Thông báo" : "Notice",
        description: lang === "vi" ? "Bạn không thể tự nhắn tin cho chính mình." : "You cannot rent/message your own product.",
        variant: "error",
      });
      return;
    }

    try {
      setIsCreatingChat(true);
      const conversation = await messageService.createConversation(String(targetOwnerId));
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      console.error("Failed to create/open conversation:", err);
      showToast({
        title: lang === "vi" ? "Lỗi kết nối" : "Connection error",
        description: err.response?.data?.error?.message || err.message || (lang === "vi" ? "Không thể mở hộp thoại tin nhắn." : "Could not open chat room."),
        variant: "error",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const isOwner = useMemo(() => {
    if (!isAuthenticated || !user || !product) return false;
    const productOwnerId = product.owner?.id || (product as any).ownerId;
    return String(productOwnerId) === String(user.id);
  }, [isAuthenticated, user, product]);

  // Wizard Confirmation States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Step 1: Handover details
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });
  const [handoverMethod, setHandoverMethod] = useState<'meetup' | 'shipping'>('meetup');

  // Step 2: Contact & policy agreement
  const [renterName, setRenterName] = useState("");
  const [renterPhone, setRenterPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Step 3: Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');

  const isDbVnd = product.price > 1000;
  const isShowVnd = lang === "vi";

  // Convert prices dynamically depending on language context:
  const priceInVnd = isDbVnd ? product.price : product.price * 25000;
  const priceInUsd = isDbVnd ? product.price / 25000 : product.price;

  const displayPrice = isShowVnd ? priceInVnd : priceInUsd;
  const serviceFee = displayPrice * 0.1;
  const total = displayPrice * days + serviceFee;

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

  const handleRentClick = () => {
    if (!isAuthenticated) {
      setShowModal(true);
      return;
    }
    setShowWizard(true);
    setWizardStep(1);
  };

  const handleConfirmLogin = () => {
    setShowModal(false);
    setIsLoading(true);
    setTimeout(() => {
      navigate(APP_ROUTES.login, {
        state: { from: window.location.pathname },
      });
    }, 800);
  };

  const handleConfirmOrderSubmit = async () => {
    setIsLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(startDate);
      end.setDate(start.getDate() + days);

      const response = await apiClient.post("/api/v1/orders", {
        productId: String(product._id || product.id),
        productName: product.name,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalPrice: priceInVnd * days + (priceInVnd * 0.1),
      });

      showToast({
        title: lang === "vi" ? "Gửi yêu cầu thuê thành công!" : "Rental request submitted!",
        description: lang === "vi"
          ? `Đơn hàng ${response.data.data.orderCode} đã được tạo thành công.`
          : `Order ${response.data.data.orderCode} has been successfully created.`,
        variant: "success",
      });

      setShowWizard(false);

      setTimeout(() => {
        navigate("/orders");
      }, 1000);
    } catch (err: any) {
      console.error("Failed to submit rental request:", err);
      showToast({
        title: lang === "vi" ? "Lỗi gửi yêu cầu" : "Request failed",
        description:
          err.response?.data?.error?.message ||
          err.message ||
          (lang === "vi" ? "Đã có lỗi xảy ra." : "An error occurred."),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Login confirm modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          {/* Card */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_80px_-20px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0f1929]">
            <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />
            <div className="p-6">
              {/* Close */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/30">
                <LogIn size={24} strokeWidth={2} className="text-white" />
              </div>

              <h2
                id="booking-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                {t.bookingLoginModalTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t.bookingLoginModalDesc}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleConfirmLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-600 hover:to-cyan-600 active:scale-[0.98] cursor-pointer"
                >
                  <LogIn size={16} strokeWidth={2.5} />
                  {t.bookingLoginModalConfirm}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/8 cursor-pointer"
                >
                  {t.bookingLoginModalCancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity" onClick={() => setShowWizard(false)} />

          {/* Card */}
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl transition-all dark:border-white/10 dark:bg-[#0f1929] flex flex-col max-h-[90vh]">
            {/* Top linear gradient */}
            <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowWizard(false)}
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="text-teal-500 animate-pulse" size={20} />
                {t.wizardTitle}
              </h2>

              {/* Progress Stepper */}
              <div className="mt-6 flex items-center justify-between relative px-4">
                {/* Progress bar background line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-white/10 -translate-y-1/2 z-0" />
                {/* Active progress line */}
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-linear-to-r from-teal-500 to-cyan-500 -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}
                />

                {/* Steps */}
                {[1, 2, 3].map((step) => {
                  const isCompleted = wizardStep > step;
                  const isActive = wizardStep === step;

                  return (
                    <div key={step} className="flex flex-col items-center z-10">
                      <button
                        type="button"
                        onClick={() => {
                          if (step < wizardStep) {
                            setWizardStep(step);
                            setValidationError(null);
                          }
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold border transition-all duration-300 ${isCompleted
                          ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/25 cursor-pointer'
                          : isActive
                            ? 'bg-linear-to-r from-teal-500 to-cyan-500 border-teal-500 text-white shadow-lg shadow-teal-500/30 scale-110'
                            : 'bg-white border-slate-200 text-slate-400 dark:bg-[#152238] dark:border-white/10 dark:text-slate-500'
                          }`}
                      >
                        {isCompleted ? <Check size={16} strokeWidth={3} /> : step}
                      </button>
                      <span className={`mt-2 text-[11px] font-bold tracking-wide uppercase transition-colors duration-300 ${isActive ? 'text-teal-500' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                        {step === 1 ? t.wizardStep1 : step === 2 ? t.wizardStep2 : t.wizardStep3}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Body - scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {validationError && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-500 dark:border-red-550/35">
                  {validationError}
                </div>
              )}

              {/* STEP 1: Handover details */}
              {wizardStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Start Date & Days Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Calendar size={14} className="text-teal-500" />
                        {t.wizardStartDate}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().substring(0, 10)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Clock size={14} className="text-teal-500" />
                        {t.wizardDuration}
                      </label>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5">
                        <button
                          type="button"
                          onClick={() => setDays((n) => Math.max(1, n - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 dark:bg-white/8 dark:text-slate-400 dark:hover:bg-white/15 cursor-pointer"
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className="text-base font-bold tabular-nums text-slate-800 dark:text-slate-100">{days}</span>
                        <button
                          type="button"
                          onClick={() => setDays((n) => n + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 dark:bg-white/8 dark:text-slate-400 dark:hover:bg-white/15 cursor-pointer"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Handover Method Options */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      {t.wizardHandoverMethod}
                    </span>
                    
                    {/* Method Meetup */}
                    <button
                      type="button"
                      onClick={() => setHandoverMethod('meetup')}
                      className={`flex flex-col w-full p-4 text-left rounded-2xl border transition-all cursor-pointer ${handoverMethod === 'meetup'
                        ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20 dark:bg-teal-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/8 dark:bg-[#132238] dark:hover:border-white/15'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${handoverMethod === 'meetup' ? 'bg-teal-50 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                          }`}>
                          <MapPin size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.wizardMethodMeetup}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {t.wizardMethodMeetupDesc}
                      </p>
                    </button>

                    {/* Method Shipping */}
                    <button
                      type="button"
                      onClick={() => setHandoverMethod('shipping')}
                      className={`flex flex-col w-full p-4 text-left rounded-2xl border transition-all cursor-pointer ${handoverMethod === 'shipping'
                        ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20 dark:bg-teal-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/8 dark:bg-[#132238] dark:hover:border-white/15'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${handoverMethod === 'shipping' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                          }`}>
                          <Truck size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.wizardMethodShipping}</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {t.wizardMethodShippingDesc}
                      </p>
                    </button>
                  </div>

            {/* If meetup: display meetup address */}
              {handoverMethod === 'meetup' && (
                <div className="rounded-2xl border border-slate-150 bg-slate-50 p-4 space-y-2 dark:border-white/5 dark:bg-white/3 animate-slideDown">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    {t.wizardMeetupAddress}
                  </span>
                  <div className="flex items-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <MapPin size={16} className="text-teal-500 mt-0.5 shrink-0" />
                    <span>{product.locationText || product.location || "Chưa cập nhật vị trí"}</span>
                  </div>
                </div>
              )}
            </div>
              )}

            {/* STEP 2: Contact Info & Policies */}
            {wizardStep === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t.wizardRenterInfo}
                </h3>

                {/* Recipient Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      {t.wizardRenterName}
                    </label>
                    <input
                      type="text"
                      value={renterName}
                      onChange={(e) => setRenterName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-[#132238] dark:text-slate-100 dark:focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      {t.wizardRenterPhone}
                    </label>
                    <input
                      type="tel"
                      value={renterPhone}
                      onChange={(e) => setRenterPhone(e.target.value)}
                      placeholder="e.g. 09xxxxxxxx"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-[#132238] dark:text-slate-100 dark:focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Delivery address (if courier chosen) */}
                {handoverMethod === 'shipping' && (
                  <div className="space-y-2 animate-slideDown">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {t.wizardShippingAddress}
                    </label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder={t.wizardShippingAddressPlaceholder}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-[#132238] dark:text-slate-100 dark:focus:border-teal-500"
                    />
                  </div>
                )}

                {/* Trust Policy and Checkbox */}
                <div className="rounded-2xl border border-slate-150 bg-teal-50/20 p-4 space-y-3 dark:border-teal-500/10 dark:bg-teal-500/5">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    {t.wizardPolicyTitle}
                  </span>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-350 text-teal-600 focus:ring-teal-500 dark:border-white/20 dark:bg-[#132238]"
                    />
                    <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {t.wizardPolicyAgree}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Payment Method */}
            {wizardStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Simple Order summary */}
                <div className="flex gap-4 rounded-2xl border border-slate-150 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/3">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-white/10 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{product.category}</span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{product.name}</h4>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 text-ellipsis overflow-hidden">
                      {days} {t.bookingDayUnit.replace('/', '')} | {handoverMethod === 'meetup' ? t.wizardMethodMeetup : t.wizardMethodShipping}
                    </span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.wizardFeeBreakdown}
                  </span>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-white/8 dark:bg-[#122238]/40">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatPrice(displayPrice)} × {days} {t.bookingDayUnit.replace('/', '')}
                      </span>
                      <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                        {formatPrice(displayPrice * days)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{t.wizardPlatformFee}</span>
                      <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">{formatPrice(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{t.wizardDeposit}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{t.wizardDepositFree}</span>
                    </div>
                    <div className="border-t border-dashed border-slate-250 pt-3 flex justify-between items-center dark:border-white/10">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{t.wizardGrandTotal}</span>
                      <span className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-teal-500" />
                    {t.wizardPaymentMethod}
                  </span>

                  <div className="space-y-2">
                    {/* Payment method: COD */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex items-start gap-3 w-full p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${paymentMethod === 'cod'
                        ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20 dark:bg-teal-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/8 dark:bg-[#132238] dark:hover:border-white/15'
                        }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${paymentMethod === 'cod' ? 'bg-teal-50 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                        }`}>
                        <Wallet size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.wizardPaymentCOD}</span>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.wizardPaymentCODDesc}</p>
                      </div>
                    </button>

                    {/* Payment method: Bank transfer */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex items-start gap-3 w-full p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${paymentMethod === 'bank_transfer'
                        ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20 dark:bg-teal-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/8 dark:bg-[#132238] dark:hover:border-white/15'
                        }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${paymentMethod === 'bank_transfer' ? 'bg-teal-50 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                        }`}>
                        <QrCode size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.wizardPaymentBank}</span>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.wizardPaymentBankDesc}</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dynamic Bank QR Panel */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/3 space-y-4 animate-slideDown">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <QrCode size={16} />
                      {t.wizardBankDetails}
                    </span>

                    <div className="flex flex-col md:flex-row gap-5 items-center">
                      {/* Visual QR Image */}
                      <div className="relative h-36 w-36 bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `247-VietinBank-URent-ORD_${Date.now()}`
                          )}`}
                          alt="Bank QR Code"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-linear-to-tr from-teal-500/5 to-cyan-500/5 pointer-events-none rounded-2xl" />
                      </div>

                      <div className="flex-1 w-full space-y-2.5 text-xs">
                        <div className="flex justify-between border-b border-slate-200/50 pb-1.5 dark:border-white/5">
                          <span className="text-slate-400 dark:text-slate-500">{t.wizardBankName}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{t.wizardBankBranch}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/50 pb-1.5 dark:border-white/5">
                          <span className="text-slate-400 dark:text-slate-500">{t.wizardAccountName}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">CÔNG TY U-RENT VIỆT NAM</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/50 pb-1.5 dark:border-white/5">
                          <span className="text-slate-400 dark:text-slate-500">{t.wizardAccountNo}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">10988776655</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/50 pb-1.5 dark:border-white/5">
                          <span className="text-slate-400 dark:text-slate-500">{t.wizardTransferContent}</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400 tabular-nums uppercase">ORD-{Date.now().toString().substring(5, 13)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                      {t.wizardQrNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
            {wizardStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setWizardStep((s) => s - 1);
                  setValidationError(null);
                }}
                className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/8 active:scale-[0.98] cursor-pointer"
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
                {t.wizardPrevStep}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                className="flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 transition hover:bg-slate-150 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 active:scale-[0.98] cursor-pointer"
              >
                {t.bookingLoginModalCancel}
              </button>
            )}

            {wizardStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  // Validate step 2
                  if (wizardStep === 2) {
                    if (!renterPhone.trim() || renterPhone.length < 9) {
                      setValidationError(t.wizardPhoneRequired);
                      return;
                    }
                    if (handoverMethod === 'shipping' && !shippingAddress.trim()) {
                      setValidationError(t.wizardAddressRequired);
                      return;
                    }
                    if (!agreedToTerms) {
                      setValidationError(t.wizardPolicyRequired);
                      return;
                    }
                  }
                  setValidationError(null);
                  setWizardStep((s) => s + 1);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:from-teal-600 hover:to-cyan-600 active:scale-[0.98] cursor-pointer"
              >
                {t.wizardNextStep}
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmOrderSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                    <span>{t.wizardSubmitting}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                    <span>{t.wizardSubmitOrder}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Booking Card Interface */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/8 ring-1 ring-slate-900/4 md:sticky md:top-24 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
        {/* Gradient top strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-teal-400 via-cyan-400 to-teal-500" />

        <div className="p-5 sm:p-6">
    {/* Price header */}
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {t.bookingRentPrice}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatPrice(displayPrice)}
          </span>
          <span className="mb-0.5 text-sm font-medium text-slate-400 dark:text-slate-500">
            {t.bookingDayUnit}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t.bookingReady}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <Zap size={10} />
          Instant confirm
        </span>
      </div>
    </div>

    {/* Day picker */}
    <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t.bookingDays}
        </span>
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm dark:border-white/10 dark:bg-white/6">
          <button
            type="button"
            onClick={() => setDays((n) => Math.max(1, n - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white cursor-pointer"
            aria-label={t.bookingDecreaseDays}
          >
            <Minus size={15} strokeWidth={2.5} />
          </button>
          <span className="min-w-8 text-center text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            {days}
          </span>
          <button
            type="button"
            onClick={() => setDays((n) => n + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white cursor-pointer"
            aria-label={t.bookingIncreaseDays}
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2.5 border-t border-slate-200/80 pt-3 dark:border-white/8">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {formatPrice(displayPrice)} × {days} {t.bookingDayUnit}
          </span>
          <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
            {formatPrice(displayPrice * days)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {t.bookingSubtotal}
          </span>
          <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
            {formatPrice(serviceFee)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5 dark:border-white/10">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {t.bookingTotal}
          </span>
          <span className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>

    {/* CTA button */}
    <button
      type="button"
      onClick={handleRentClick}
      disabled={isLoading || isOwner}
      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold tracking-wide text-white shadow-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] disabled:cursor-not-allowed cursor-pointer ${isOwner
        ? "bg-slate-400 dark:bg-slate-700 shadow-none opacity-80"
        : "bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-teal-500/25 hover:shadow-teal-500/35 focus-visible:outline-teal-500 disabled:opacity-70"
        }`}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
          <span>Đang chuyển hướng...</span>
        </>
      ) : isOwner ? (
        lang === "vi" ? "Sản phẩm của bạn" : "Your own product"
      ) : (
        t.bookingRentRequest
      )}
    </button>

    {!isOwner && (
      <button
        type="button"
        onClick={handleContactOwner}
        disabled={isCreatingChat}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/10 dark:hover:text-teal-400 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
      >
        {isCreatingChat ? (
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
        ) : (
          <MessageSquare size={16} strokeWidth={2} />
        )}
        <span>{lang === "vi" ? "Nhắn tin cho chủ sở hữu" : "Message owner"}</span>
      </button>
    )}

    {isOwner && (
      <p className="mt-2.5 text-center text-xs font-semibold text-rose-500 dark:text-rose-450 animate-fadeIn">
        {lang === "vi"
          ? "Bạn không thể tự thuê sản phẩm của chính mình."
          : "You cannot rent your own product."}
      </p>
    )}

    {/* Trust footer */}
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <ShieldCheck
          size={13}
          className="text-teal-500"
          strokeWidth={2}
        />
        {t.bookingProtectedPayment}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Clock size={12} strokeWidth={2} />
        {t.bookingSchedulable}
      </div>
    </div>
  </div>
</div>
    </>
  );
}