import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Package,
  Loader2,
  MapPin,
  Sparkles,
  Zap,
  Laptop,
  Compass,
  GraduationCap,
  Shirt,
  Layers,
  ChevronDown,
  Map,
  Save,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "../../../../lib/api/apiClient";
import { useI18n } from "../../shared/context/LanguageContext";
import { normalizeApiError } from "../../../../lib/api/apiError";
import type { InventoryItem } from "../../shared/types";
import { productService } from "../../product/services/productService";
import { AddressSelector } from "../../shared/components/AddressSelector";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: InventoryItem | null;
  onSuccess: () => void;
}

type UnknownRecord = Record<string, unknown>;

type ProductAiSuggestion = {
  name?: string;
  category?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  priceReason?: string;
  condition?: string;
  description?: string[];
  confidence?: "high" | "medium" | "low";
  aiPowered?: boolean;
};

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
};

const toNum = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.round(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
  }
  return undefined;
};

const parseAiSuggestion = (payload: unknown): ProductAiSuggestion | null => {
  const root = isRecord(payload) ? payload : null;
  if (!root) {
    return null;
  }

  const data = isRecord(root.data) ? root.data : root;

  const description =
    toStringArray(data.description) ??
    toStringArray(data.specs) ??
    toStringArray(data.suggestedSpecs);

  const suggestion: ProductAiSuggestion = {
    name: typeof data.name === "string" ? data.name.trim() : undefined,
    category:
      typeof data.category === "string" ? data.category.trim() : undefined,
    price: toNum(data.price),
    priceMin: toNum(data.priceMin),
    priceMax: toNum(data.priceMax),
    priceReason: typeof data.priceReason === "string" ? data.priceReason.trim() : undefined,
    condition:
      typeof data.condition === "string" ? data.condition.trim() : undefined,
    description,
    confidence: ["high", "medium", "low"].includes(data.confidence as string)
      ? (data.confidence as "high" | "medium" | "low")
      : undefined,
    aiPowered: data.aiPowered === true,
  };

  return Object.values(suggestion).some((value) => value !== undefined)
    ? suggestion
    : null;
};

const parseDescriptionToArray = (descStr: string): string[] => {
  if (!descStr) return [];
  return descStr
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .map((s) => (s.startsWith("-") ? s.substring(1).trim() : s))
    .filter(Boolean);
};

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const { lang, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Điện tử & Công nghệ",
    price: "",
    condition: "New",
    locationText: "",
    imageUrl: "",
    description: "",
    available: 1,
    rented: 0,
    overdue: 0,
  });

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedFromSuggestions, setSelectedFromSuggestions] = useState(false);
  const [showAdminAddress, setShowAdminAddress] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name || "",
        category: product.category || "Điện tử & Công nghệ",
        price: product.price ? String(product.price) : "",
        condition: product.condition || "New",
        locationText: product.locationText || (typeof product.location === "string" ? product.location : ""),
        imageUrl: product.imageUrl || "",
        description: product.description ? product.description.map(d => `- ${d}`).join("\n") : "",
        available: product.statusQuantities?.available ?? 1,
        rented: product.statusQuantities?.rented ?? 0,
        overdue: product.statusQuantities?.overdue ?? 0,
      });
      setError("");
      setAiError("");
      setIsAnalyzing(false);
      selectedFileRef.current = null;
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      setShowAdminAddress(false);
      setIsCategoryDropdownOpen(false);
    }
  }, [isOpen, product]);

  // Click outside to close category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search for address suggestions via OpenStreetMap Nominatim
  useEffect(() => {
    if (selectedFromSuggestions) {
      setSelectedFromSuggestions(false);
      return;
    }

    const query = formData.locationText;
    if (query.trim().length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearchingAddress(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&addressdetails=1&limit=5&countrycodes=vn`
          );
          const data = await response.json();
          if (data && Array.isArray(data)) {
            const suggestions = data.map((item: any) => item.display_name);
            setAddressSuggestions(suggestions);
          }
        } catch (e) {
          console.error("Lỗi lấy gợi ý địa chỉ:", e);
        } finally {
          setIsSearchingAddress(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(delayDebounceFn);
    } else {
      setAddressSuggestions([]);
    }
  }, [formData.locationText, selectedFromSuggestions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectedFileRef.current = file;
      setError("");
      setFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name || !formData.category || !formData.price || !formData.locationText) {
      return setError(lang === "vi" ? "Vui lòng nhập đủ các trường bắt buộc" : "Please fill all required fields");
    }

    setIsSaving(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Defer image upload to Cloudinary until Save is clicked
      if (selectedFileRef.current && formData.imageUrl.startsWith("blob:")) {
        const uploadData = new FormData();
        uploadData.append("image", selectedFileRef.current);
        const res = await apiClient.post<{ success: boolean; url: string }>("/api/v1/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = res.data.url;
        finalImageUrl = url.startsWith("http") ? url : `${apiClient.defaults.baseURL}${url}`;
      }

      let lng = 105.8342, lat = 21.0278;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            formData.locationText
          )}`
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      } catch (geocodingError) {
        console.warn("Geocoding failed, using defaults:", geocodingError);
      }

      const submitData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        condition: formData.condition,
        locationText: formData.locationText,
        location: { type: "Point", coordinates: [lng, lat] },
        imageUrl: finalImageUrl,
        statusQuantities: {
          available: Number(formData.available),
          rented: Number(formData.rented),
          overdue: Number(formData.overdue),
        },
        description: formData.description
          ? parseDescriptionToArray(formData.description)
          : undefined,
      };

      if (!product) return;

      await productService.updateProduct(product.id, submitData as any);
      selectedFileRef.current = null;
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    {
      value: "Điện tử & Công nghệ",
      labelVi: "Điện tử & Công nghệ",
      labelEn: "Electronics & Tech",
      icon: Laptop,
      iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      activeColor: "bg-gradient-to-r from-blue-500 to-indigo-650 text-white shadow-md shadow-blue-500/15 border-transparent",
    },
    {
      value: "Du lịch & Dã ngoại",
      labelVi: "Du lịch & Dã ngoại",
      labelEn: "Travel & Outdoors",
      icon: Compass,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      activeColor: "bg-gradient-to-r from-emerald-500 to-teal-650 text-white shadow-md shadow-emerald-500/15 border-transparent",
    },
    {
      value: "Đồ dùng học tập",
      labelVi: "Đồ dùng học tập",
      labelEn: "School Supplies",
      icon: GraduationCap,
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      activeColor: "bg-gradient-to-r from-amber-500 to-orange-650 text-white shadow-md shadow-amber-500/15 border-transparent",
    },
    {
      value: "Thời trang & Đời sống",
      labelVi: "Thời trang & Đời sống",
      labelEn: "Fashion & Lifestyle",
      icon: Shirt,
      iconBg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
      activeColor: "bg-gradient-to-r from-rose-500 to-pink-650 text-white shadow-md shadow-rose-500/15 border-transparent",
    },
  ];

  const conditionOptions = [
    { value: "New", label: lang === "vi" ? "Mới 100%" : "New", desc: lang === "vi" ? "Chưa dùng" : "Unused" },
    { value: "99%", label: "99%", desc: lang === "vi" ? "Như mới" : "Like new" },
    { value: "95%", label: "95%", desc: lang === "vi" ? "Xước nhẹ" : "Minor scratch" },
    { value: "Used", label: lang === "vi" ? "Đã dùng" : "Used", desc: lang === "vi" ? "Hao mòn" : "Used" },
  ];

  const formatCurrency = (val: string) => {
    if (!val) return "0 ₫";
    const num = parseInt(val.replace(/\D/g, ""), 10);
    if (isNaN(num)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const isLegacyCategory = formData.category && !categories.some(c => c.value === formData.category);
  const activeCat = categories.find(c => c.value === formData.category) || categories[0];
  const ActiveIcon = activeCat.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-400">
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-laser {
          animation: scan-laser 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-float-icon {
          animation: float-icon 2s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .neo-shadow {
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.08);
        }
        .dark .neo-shadow {
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.35);
        }
      `}</style>
      <div
        className="absolute inset-0 bg-slate-955/40 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl transform overflow-hidden rounded-[2.5rem] bg-white shadow-3xl transition-all dark:bg-slate-900 animate-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row h-auto max-h-[92vh] neo-shadow">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row w-full h-full overflow-hidden"
        >
          {/* Media Panel (Left Column - Slimmer at 32%) */}
          <div className="w-full md:w-[32%] bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-850/20 dark:to-slate-900/20 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-teal-500/20" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {formData.imageUrl ? (
              <div className="space-y-4 relative z-10">
                <div className="group relative aspect-square w-full overflow-hidden rounded-3xl shadow-2xl border-2 border-white dark:border-slate-850 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-955/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                      className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-red-500 hover:text-red-650 flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-teal-650 dark:text-teal-400 flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                    >
                      <Zap size={18} />
                    </button>
                  </div>

                  {/* Neon Upload Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-955/30 backdrop-blur-[2px] flex flex-col items-center justify-center overflow-hidden">
                      <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/25 animate-pulse shadow-2xl">
                        <Loader2 size={20} className="animate-spin text-teal-400" />
                      </div>
                      <span className="mt-3 text-[9px] font-black uppercase tracking-[0.25em] text-teal-400 bg-slate-900/90 px-3.5 py-1.5 rounded-full shadow-2xl border border-teal-500/30">
                        {lang === "vi" ? "ĐANG TẢI..." : "UPLOADING..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex aspect-square w-full flex-col items-center justify-center rounded-[2rem] bg-white/40 dark:bg-slate-850/40 backdrop-blur-md hover:border-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] transition-all duration-300 border-2 border-dashed border-slate-200/80 dark:border-slate-700/80 relative z-10 cursor-pointer p-5 text-center"
              >
                {isUploading ? (
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20 shadow-inner">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-350 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-955/20 transition-all duration-500 border border-slate-100 dark:border-slate-700/50 shadow-sm animate-float-icon">
                    <Plus size={20} className="transition-transform duration-500 group-hover:rotate-90" />
                  </div>
                )}
                <p className="mt-3.5 text-[11px] font-black text-slate-400 group-hover:text-teal-500 dark:group-hover:text-teal-400 uppercase tracking-[0.2em] transition-colors">
                  {isUploading ? (lang === "vi" ? "ĐANG TẢI..." : "UPLOADING...") : (lang === "vi" ? "TẢI ẢNH LÊN" : "UPLOAD IMAGE")}
                </p>
                <p className="mt-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                  JPG, PNG, WEBP • TỐI ĐA 10MB
                </p>
              </div>
            )}
          </div>

          {/* Form Panel (Right Column - Wider & More Spacious with Grid) */}
          <div className="flex-1 p-8 md:p-10 overflow-y-auto no-scrollbar flex flex-col justify-between">
            <div>
              <header className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    {lang === "vi" ? "Chỉnh sửa vật phẩm" : "Edit Product"}
                    <span className="text-teal-500 animate-pulse">.</span>
                  </h3>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-teal-50 dark:bg-teal-955/20 text-teal-600 dark:text-teal-400 border border-teal-500/10">
                    <Sparkles size={10} className="text-teal-500 animate-pulse" />
                    {lang === "vi" ? "Cập nhật thông tin chi tiết" : "Update details"}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-105 flex items-center justify-center text-slate-455 hover:text-slate-750 dark:hover:text-white transition-all duration-200 border border-slate-100/50 dark:border-slate-750"
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </header>

              {/* Spacious 12-column Grid Layout */}
              <div className="grid grid-cols-12 gap-5 relative">
                
                {/* Row 1: Name (8 cols) & Price (4 cols) */}
                <div className="col-span-12 md:col-span-8 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t.addProductName} *
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all duration-200 h-[46px]"
                    placeholder={t.addProductPlaceholderName}
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="col-span-12 md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t.addProductPrice} *
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-3 text-sm font-extrabold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all tabular-nums pr-16 h-[46px]"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                      type="number"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pointer-events-none">
                      VND/Ngày
                    </span>
                  </div>
                </div>

                {/* Price formatting helper (Full-width underneath first row if price exists) */}
                {formData.price && (
                  <div className="col-span-12 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 animate-fade-in w-full">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>
                      {lang === "vi" ? "Giá tiền định dạng:" : "Formatted Price:"}{" "}
                      <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-350">{formatCurrency(formData.price)}</span>
                      <span className="text-slate-400 dark:text-slate-500"> / {lang === "vi" ? "ngày" : "day"}</span>
                    </span>
                  </div>
                )}



                {/* Row 2: Category Dropdown (6 cols) & Condition Pill Selector (6 cols) */}
                <div className="col-span-12 md:col-span-6 space-y-1.5 relative" ref={categoryDropdownRef}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers size={12} className="text-teal-500" />
                    {t.addProductCategory} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all duration-200 h-[46px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded-lg ${activeCat.iconBg}`}>
                        <ActiveIcon size={13} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {lang === "vi" ? activeCat.labelVi : activeCat.labelEn}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Category dropdown list */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-150 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = formData.category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              setFormData(p => ({ ...p, category: cat.value }));
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-855/50 ${isSelected ? "text-teal-600 dark:text-teal-400 bg-teal-500/5" : "text-slate-700 dark:text-slate-350"}`}
                          >
                            <div className={`p-1.5 rounded-lg ${cat.iconBg}`}>
                              <Icon size={13} />
                            </div>
                            <span className="uppercase tracking-wider">
                              {lang === "vi" ? cat.labelVi : cat.labelEn}
                            </span>
                          </button>
                        );
                      })}

                      {/* Support legacy category inside edit mode */}
                      {isLegacyCategory && (
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-white bg-slate-500/90"
                        >
                          <div className="p-1.5 rounded-lg bg-white/20 text-white shrink-0">
                            <Layers size={13} />
                          </div>
                          <span className="uppercase tracking-wider">
                            {formData.category} (Legacy)
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t.addProductCondition} *
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-50/40 dark:bg-slate-955/30 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-850 h-[46px] items-center">
                    {conditionOptions.map((opt) => {
                      const isSelected = formData.condition === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, condition: opt.value }))}
                          className={`h-full rounded-xl flex flex-col items-center justify-center transition-all duration-250 ${
                            isSelected
                              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/50 dark:border-slate-750 font-black"
                              : "text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 3: Status Quantities (Horizontal Bar - takes up very little vertical space) */}
                <div className="col-span-12 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {lang === "vi" ? "Số lượng phân loại trạng thái" : "Status Quantities"}
                  </label>
                  <div className="grid grid-cols-3 gap-4 bg-slate-50/40 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-850">
                    <div className="space-y-1 border-l-2 border-emerald-500 pl-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-450">
                        {lang === "vi" ? "Sẵn có" : "Available"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-transparent text-sm font-extrabold outline-none dark:text-white tabular-nums h-5"
                        value={formData.available}
                        onChange={(e) => setFormData((p) => ({ ...p, available: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-1 border-l-2 border-amber-500 pl-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-450">
                        {lang === "vi" ? "Đang Thuê" : "Rented"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-transparent text-sm font-extrabold outline-none dark:text-white tabular-nums h-5"
                        value={formData.rented}
                        onChange={(e) => setFormData((p) => ({ ...p, rented: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-1 border-l-2 border-rose-500 pl-2.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-455">
                        {lang === "vi" ? "Quá hạn" : "Overdue"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-transparent text-sm font-extrabold outline-none dark:text-white tabular-nums h-5"
                        value={formData.overdue}
                        onChange={(e) => setFormData((p) => ({ ...p, overdue: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 4: Display Location (with inline AddressSelector accordion) */}
                <div className="col-span-12 space-y-1.5 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between gap-1 w-full">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-teal-500" />
                      {lang === "vi" ? "Vị trí / Địa chỉ hiển thị *" : "Location *"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdminAddress(!showAdminAddress)}
                      className={`text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${
                        showAdminAddress
                          ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 shadow-teal-500/5 scale-102"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-455 border-slate-200/60 dark:border-slate-700/80 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-102"
                      }`}
                    >
                      <Map size={10} className={showAdminAddress ? "animate-pulse text-teal-500" : ""} />
                      {showAdminAddress 
                        ? (lang === "vi" ? "Gõ Địa Chỉ Nhanh" : "Quick Text Input") 
                        : (lang === "vi" ? "Chọn Địa Chỉ Hành Chính" : "Select Administrative")}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-3.5 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all pr-10 h-[46px]"
                      placeholder="Ví dụ: Cầu Giấy, Hà Nội..."
                      value={formData.locationText}
                      onChange={(e) => {
                        setSelectedFromSuggestions(false);
                        setFormData((p) => ({ ...p, locationText: e.target.value }));
                      }}
                    />
                    {isSearchingAddress && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={15} className="animate-spin text-teal-500" />
                      </div>
                    )}
                  </div>

                  {/* Address search suggestions list */}
                  {addressSuggestions.length > 0 && (
                    <div className="absolute z-[80] left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 animate-in fade-in duration-200">
                      {addressSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData((p) => ({ ...p, locationText: suggestion }));
                            setSelectedFromSuggestions(true);
                            setAddressSuggestions([]);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors truncate"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* HIGH-END INLINE ACCORDION: Pick address via 3-step dropdown lists */}
                {showAdminAddress && (
                  <div className="col-span-12 mt-1 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800/60 shadow-inner animate-in fade-in slide-in-from-top-3 duration-300 ring-1 ring-black/5 w-full">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <MapPin size={13} className="text-teal-500 animate-pulse" />
                        {lang === "vi" ? "Chọn Địa Chỉ Hành Chính" : "Select Administrative Address"}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowAdminAddress(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-655 transition-colors"
                      >
                        {lang === "vi" ? "Đóng" : "Close"}
                      </button>
                    </div>
                    <AddressSelector
                      lang={lang as any}
                      onSelect={(fullAddress) => {
                        setFormData((prev) => ({ ...prev, locationText: fullAddress }));
                        setShowAdminAddress(false);
                      }}
                    />
                  </div>
                )}
                <div className="col-span-12 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t.addProductDescription}
                  </label>
                  <textarea
                    className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-2.5 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all resize-none"
                    rows={2}
                    placeholder={t.addProductDescriptionPlaceholder}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* Alerts */}
                {aiError && (
                  <div className="col-span-12 text-rose-500 text-[10px] font-bold tracking-wider text-center py-2 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    ⚠️ {aiError}
                  </div>
                )}

                {error && (
                  <div className="col-span-12 text-rose-500 text-[10px] font-bold tracking-wider text-center py-2 bg-rose-500/10 rounded-2xl border border-rose-500/20 animate-bounce">
                    🚫 {error}
                  </div>
                )}

              </div>
            </div>

            <footer className="mt-8 flex gap-3 border-t border-slate-100/80 dark:border-slate-800/80 pt-5">
              <button
                type="button"
                className="flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors duration-200"
                onClick={onClose}
              >
                {t.addProductCancel}
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading || isAnalyzing}
                className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 hover:shadow-2xl border border-transparent disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCircle size={13} />
                )}
                {t.addProductSave || "Lưu vật phẩm"}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};
