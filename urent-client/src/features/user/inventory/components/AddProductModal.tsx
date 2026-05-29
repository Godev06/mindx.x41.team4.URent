import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Zap,
  MapPin,
  Laptop,
  Compass,
  GraduationCap,
  Shirt,
  Layers,
  ChevronDown,
  Map,
  Minus,
  Tag,
  AlignLeft,
  Coins,
  Check,
} from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { useToast } from "../../shared/hooks/useToast";
import { useAuth } from "../../auth/hooks/useAuth";
import { apiClient } from "../../../../lib/api/apiClient";
import { normalizeApiError } from "../../../../lib/api/apiError";
import { AddressSelector } from "../../shared/components/AddressSelector";
import {
  analyzeProductWithGemini,
  analyzeProductWithGeminiFile,
  fileToBase64,
  resizeAndCompressImage,
  parseQuotaError,
} from "../../../../lib/ai/geminiService";
import type { QuotaErrorDetails } from "../../../../lib/ai/geminiService";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    name: string;
    category: string;
    price: number;
    locationText: string;
    statusQuantities: {
      available: number;
      rented: number;
      overdue: number;
    };
    condition: string;
    imageUrl?: string;
    description?: string[];
  }) => Promise<void> | void;
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

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Điện tử & Công nghệ",
    price: "",
    locationText: "",
    statusQuantities: {
      available: 1,
      rented: 0,
      overdue: 0,
    },
    condition: "New",
    imageUrl: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiSuccessToast, setAiSuccessToast] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false); // Premium Custom Checkbox state
  const [aiInsight, setAiInsight] = useState<{
    priceMin?: number;
    priceMax?: number;
    priceReason?: string;
    confidence?: "high" | "medium" | "low";
    aiPowered?: boolean;
  } | null>(null);
  const [quotaDetails, setQuotaDetails] = useState<QuotaErrorDetails | null>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedFromSuggestions, setSelectedFromSuggestions] = useState(false);
  const [showAdminAddress, setShowAdminAddress] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const selectedFileRef = useRef<File | null>(null); // Keep File ref for AI analyze (avoids CORS blob URL)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track which fields were AI-filled for flash animation
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const flashField = useCallback((fields: string[]) => {
    setAiFilledFields(new Set(fields));
    setAiSuccessToast(true);
    setTimeout(() => setAiFilledFields(new Set()), 1800);
    setTimeout(() => setAiSuccessToast(false), 2800);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (user?.address) {
        setNewProduct((prev) => ({
          ...prev,
          locationText: user.address || "",
        }));
      }
    } else {
      setError("");
      setAiError("");
      setIsAnalyzing(false);
      setIsUploading(false);
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      setShowAdminAddress(false);
      setIsCategoryDropdownOpen(false);
      setAiInsight(null);
      setAiFilledFields(new Set());
      setAiSuccessToast(false);
      setIsConfirmed(false);
      selectedFileRef.current = null;
      setQuotaDetails(null);

      // Abort active Gemini analysis when modal closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen, user]);

  // Abort running requests if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

    const query = newProduct.locationText;
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
  }, [newProduct.locationText, selectedFromSuggestions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectedFileRef.current = file; // Store file for AI analyze
      setError("");
      // Show local preview immediately
      setNewProduct((prev) => ({
        ...prev,
        imageUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleAIAnalyze = async () => {
    if (isAnalyzing) return;
    if (!newProduct.imageUrl && !selectedFileRef.current) return;

    // Cancel any active running request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiError("");
    setQuotaDetails(null);
    setIsAnalyzing(true);

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Helper to apply AI result to form fields
    const applyResult = (result: {
      name: string;
      category: string;
      price: number;
      condition: string;
      description: string[];
      priceMin: number;
      priceMax: number;
      priceReason: string;
      confidence: "high" | "medium" | "low";
      aiPowered?: boolean;
    }) => {
      const filled: string[] = [];
      setNewProduct((prev) => {
        const next = { ...prev };
        if (result.name) { next.name = result.name; filled.push("name"); }
        if (result.category) { next.category = result.category; filled.push("category"); }
        if (result.price > 0) { next.price = String(result.price); filled.push("price"); }
        if (result.condition) { next.condition = result.condition; filled.push("condition"); }
        if (result.description.length > 0) {
          next.description = result.description.map(d => `- ${d}`).join("\n");
          filled.push("description");
        }
        return next;
      });
      setAiInsight({
        priceMin: result.priceMin,
        priceMax: result.priceMax,
        priceReason: result.priceReason,
        confidence: result.confidence,
        aiPowered: result.aiPowered !== false,
      });
      flashField(filled);
    };

    let usedRealAi = false;
    let finalResult: any = null;
    let capturedErrorMsg = "";

    if (geminiKey) {
      try {
        // Prefer File object (avoids CORS issues with blob: URLs)
        finalResult = selectedFileRef.current
          ? await analyzeProductWithGeminiFile(selectedFileRef.current, geminiKey, controller.signal)
          : await analyzeProductWithGemini(newProduct.imageUrl, geminiKey, controller.signal);
        usedRealAi = true;
      } catch (geminiErr: any) {
        if (geminiErr.name === "AbortError") {
          console.log("[Gemini] Analysis request aborted.");
          return; // Stop execution, don't fallback or show error
        }
        console.warn("[Gemini Direct] Failed, attempting backend fallback...", geminiErr?.message || geminiErr);
        capturedErrorMsg = geminiErr?.message || String(geminiErr);
      }
    }

    // Attempt backend server-side AI fallback if client call failed or wasn't made
    if (!finalResult) {
      try {
        console.log("[AddProductModal] Client Gemini API failed/quota exceeded. Trying server-side AI analysis fallback...");
        let base64 = "";
        let mimeType = "";
        let fileName = "";
        if (selectedFileRef.current) {
          try {
            console.log("[AddProductModal] Compressing file for backend fallback payload...");
            const compressed = await resizeAndCompressImage(selectedFileRef.current, 768, 0.7);
            base64 = compressed.base64;
            mimeType = compressed.mimeType;
            fileName = selectedFileRef.current.name;
            console.log(`[AddProductModal] Compressed fallback payload successfully: ~${Math.round((base64.length * 3) / 4 / 1024)} KB`);
          } catch (compressErr) {
            console.warn("[AddProductModal] Canvas compression failed, using raw base64 instead:", compressErr);
            const base64Res = await fileToBase64(selectedFileRef.current);
            base64 = base64Res.base64;
            mimeType = base64Res.mimeType;
            fileName = selectedFileRef.current.name;
          }
        }

        const response = await apiClient.post("/api/v1/products/ai/analyze", {
          imageUrl: newProduct.imageUrl && !newProduct.imageUrl.startsWith("blob:") ? newProduct.imageUrl : "",
          imageBase64: base64,
          mimeType: mimeType,
          fileName: fileName,
        }, {
          signal: controller.signal
        });

        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          if (data.aiPowered) {
            console.log("[AddProductModal] Server-side AI analysis succeeded!");
            finalResult = data;
            usedRealAi = true;
          } else {
            console.log("[AddProductModal] Server-side fallback returned offline mock data. Bypassing.");
            usedRealAi = false;
            if (data.aiError) {
              capturedErrorMsg = data.aiError;
            }
          }
        }
      } catch (backendErr: any) {
        if (backendErr.name === "AbortError") {
          console.log("[Gemini Backend Fallback] Request aborted.");
          return;
        }
        console.warn("[Gemini Backend Fallback] Failed:", backendErr?.message || backendErr);
        capturedErrorMsg = backendErr?.message || String(backendErr);
      }
    }

    if (usedRealAi && finalResult) {
      applyResult(finalResult);
      setQuotaDetails(null);
      setIsAnalyzing(false);
      abortControllerRef.current = null;
      return;
    }

    // --- Direct Local Smart Fallback replaced with Manual Input Warning ---
    try {
      if (controller.signal.aborted) {
        return;
      }

      const parsedDetails = parseQuotaError(capturedErrorMsg, lang as any);
      setQuotaDetails(parsedDetails);

      showToast({
        title: lang === "vi" ? "Hạn ngạch AI đã hết" : "AI Quota Exceeded",
        description: parsedDetails.resetTimeMessage,
        variant: "error",
      });

      setAiError(parsedDetails.resetTimeMessage);
    } catch (err: any) {
      if (controller.signal.aborted) return;
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !newProduct.name ||
      !newProduct.category ||
      !newProduct.price ||
      !newProduct.locationText
    ) {
      setError(
        lang === "vi"
          ? "Vui lòng điền đầy đủ các trường bắt buộc (Tên, Giá, Vị trí)"
          : "Please fill all required fields (Name, Price, Location)",
      );
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = newProduct.imageUrl;

      // Upload image to Cloudinary first (if local file selected)
      if (selectedFileRef.current && newProduct.imageUrl.startsWith("blob:")) {
        const uploadData = new FormData();
        uploadData.append("image", selectedFileRef.current);
        const res = await apiClient.post<{ success: boolean; url: string }>("/api/v1/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = res.data.url;
        finalImageUrl = url.startsWith("http") ? url : `${apiClient.defaults.baseURL}${url}`;
      }

      // Call parent handler (includes geocoding + API create)
      await onAdd({
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        locationText: newProduct.locationText,
        statusQuantities: newProduct.statusQuantities,
        condition: newProduct.condition,
        imageUrl: finalImageUrl || undefined,
        description: newProduct.description
          ? parseDescriptionToArray(newProduct.description)
          : undefined,
      });

      // Success — reset form and close
      setNewProduct({
        name: "",
        category: "Điện tử & Công nghệ",
        price: "",
        locationText: "",
        statusQuantities: { available: 1, rented: 0, overdue: 0 },
        condition: "New",
        imageUrl: "",
        description: "",
      });
      selectedFileRef.current = null;
      onClose();
    } catch (err: any) {
      const apiMsg = err?.response?.data?.error?.message || err?.message;
      setError(
        apiMsg ||
        (lang === "vi" ? "Lỗi tải ảnh hoặc tạo sản phẩm. Vui lòng thử lại!" : "Upload or product creation error. Please try again.")
      );
    } finally {
      setIsUploading(false);
    }
  };

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

  const activeCat = categories.find(c => c.value === newProduct.category) || categories[0];
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
        @keyframes ai-flash {
          0%   { box-shadow: 0 0 0 0 rgba(20,184,166,0.0); border-color: transparent; }
          20%  { box-shadow: 0 0 0 6px rgba(20,184,166,0.35); border-color: rgba(20,184,166,0.7); background-color: rgba(20,184,166,0.06); }
          60%  { box-shadow: 0 0 0 3px rgba(20,184,166,0.15); border-color: rgba(20,184,166,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.0); border-color: transparent; background-color: transparent; }
        }
        .ai-filled {
          animation: ai-flash 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
          <div className="w-full md:w-[32%] bg-gradient-to-b from-slate-50/40 to-slate-100/40 dark:from-slate-850/20 dark:to-slate-900/20 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-teal-500/20" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {newProduct.imageUrl ? (
              <div className="space-y-4 relative z-10">
                <div className="group relative aspect-square w-full overflow-hidden rounded-3xl shadow-2xl border-2 border-white dark:border-slate-855 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={newProduct.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-955/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNewProduct((p) => ({ ...p, imageUrl: "" }))}
                      className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-red-500 hover:text-red-650 flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-teal-655 dark:text-teal-400 flex items-center justify-center shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20"
                    >
                      <Zap size={18} />
                    </button>
                  </div>

                  {/* Neon AI Scanner Overlay */}
                  {(isAnalyzing || isUploading) && (
                    <div className="absolute inset-0 bg-slate-955/30 backdrop-blur-[2px] flex flex-col items-center justify-center overflow-hidden">
                      <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_rgba(45,212,191,1)] animate-scan-laser" />
                      <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/25 animate-pulse shadow-2xl">
                        <Loader2 size={20} className="animate-spin text-teal-400" />
                      </div>
                      <span className="mt-3 text-[9px] font-black uppercase tracking-[0.25em] text-teal-400 bg-slate-900/90 px-3.5 py-1.5 rounded-full shadow-2xl border border-teal-500/30">
                        {isUploading
                          ? (lang === "vi" ? "ĐANG TẢI..." : "UPLOADING...")
                          : t.addProductAiAnalyzing}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1.2px] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-98 transition-all duration-300 group overflow-hidden disabled:opacity-50 disabled:pointer-events-none relative shadow-xl shadow-purple-500/10 animate-[pulse_2s_infinite] hover:animate-none"
                >
                  <div className="w-full bg-white dark:bg-slate-900 rounded-[14px] py-3 flex items-center justify-center gap-2 group-hover:bg-transparent transition-colors duration-300">
                    {isAnalyzing ? (
                      <Loader2 size={14} className="animate-spin text-purple-500 group-hover:text-white" />
                    ) : (
                      <Sparkles size={14} className="text-purple-500 group-hover:text-white" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 group-hover:text-white transition-colors">
                      {isAnalyzing
                        ? (lang === "vi" ? "ĐANG PHÂN TÍCH..." : "ANALYZING...")
                        : t.addProductAiAnalyze}
                    </span>
                  </div>
                </button>
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
                  {isUploading ? (lang === "vi" ? "ĐANG TẢI..." : "UPLOADING...") : t.addProductUploadFile}
                </p>
                <p className="mt-1.5 text-[8px] font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-[0.08em] px-2.5 py-0.5 bg-slate-100/50 dark:bg-slate-900/40 rounded-full border border-slate-200/10">
                  {lang === "vi" ? "✨ Mở khóa Gemini AI Auto-Fill" : "✨ Unlock Gemini AI Auto-Fill"}
                </p>
              </div>
            )}
          </div>

          {/* Form Panel (Right Column - Wider & More Spacious with Grid) */}
          <div className="flex-1 p-8 md:p-10 overflow-y-auto no-scrollbar flex flex-col justify-between relative">
            <div>
              {/* Glassmorphic AI Success Banner */}
              {aiSuccessToast && (
                <div className="absolute top-4 right-4 z-[100] flex items-center gap-2.5 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 backdrop-blur-xl border border-teal-500/35 px-4.5 py-3 shadow-lg shadow-teal-500/10 animate-in slide-in-from-top-5 duration-300">
                  <div className="h-7 w-7 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
                      AI Auto-Filled
                    </h4>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      {lang === "vi" 
                        ? "Đã điền tự động các thông tin phân tích từ ảnh!" 
                        : "Automatically filled product analysis from image!"}
                    </p>
                  </div>
                </div>
              )}
              <header className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    {t.addProductTitle}
                    <span className="text-teal-500 animate-pulse">.</span>
                  </h3>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-teal-50 dark:bg-teal-955/20 text-teal-600 dark:text-teal-400 border border-teal-500/10">
                    <Sparkles size={10} className="text-teal-500" />
                    {t.addProductSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  className="group h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:bg-rose-500/25 flex items-center justify-center text-slate-450 transition-all duration-300 border border-slate-100/50 dark:border-slate-750"
                  onClick={onClose}
                >
                  <X size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                </button>
              </header>

              {/* Spacious 12-column Grid Layout */}
              <div className="grid grid-cols-12 gap-5 relative">
                
                {/* Row 1: Name (full width) */}
                <div className="col-span-12 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Tag size={10} className="text-teal-500" />
                    <span>{t.addProductName} *</span>
                  </label>
                  <div className="relative group/name">
                    <input
                      className={`w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all duration-200 h-[46px] ${aiFilledFields.has("name") ? "ai-filled" : ""}`}
                      placeholder={t.addProductPlaceholderName}
                      value={newProduct.name}
                      onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within/name:text-teal-500">
                      <Tag size={15} />
                    </div>
                  </div>
                </div>

                {/* Row 2: Category Dropdown (6 cols) & Condition Pill Selector (6 cols) */}
                <div className="col-span-12 md:col-span-6 space-y-1.5 relative" ref={categoryDropdownRef}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers size={12} className="text-teal-500" />
                    {t.addProductCategory} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className={`w-full flex items-center justify-between rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all duration-200 h-[46px] ${aiFilledFields.has("category") ? "ai-filled" : ""}`}
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

                  {/* Clean Dropdown Panel */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-150 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = newProduct.category === cat.value;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              setNewProduct(p => ({ ...p, category: cat.value }));
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-850/50 ${isSelected ? "text-teal-600 dark:text-teal-400 bg-teal-500/5" : "text-slate-700 dark:text-slate-350"}`}
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
                    </div>
                  )}
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t.addProductCondition} *
                  </label>
                  <div className={`grid grid-cols-4 gap-1 bg-slate-50/40 dark:bg-slate-950/30 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-850 h-[46px] items-center ${aiFilledFields.has("condition") ? "ai-filled" : ""}`}>
                    {conditionOptions.map((opt) => {
                      const isSelected = newProduct.condition === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewProduct((p) => ({ ...p, condition: opt.value }))}
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

                {/* Row 3: Quantity (4 cols) & Location (8 cols) */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {lang === "vi" ? "Số lượng" : "Quantity"}
                  </label>
                  <div className="flex items-center justify-between gap-1 rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 p-1 w-full h-[46px]">
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct((p) => ({
                          ...p,
                          statusQuantities: {
                            ...p.statusQuantities,
                            available: Math.max(1, p.statusQuantities.available - 1),
                          },
                        }))
                      }
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-85 border border-slate-100 dark:border-slate-750/50 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tabular-nums select-none">
                      {newProduct.statusQuantities.available}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct((p) => ({
                          ...p,
                          statusQuantities: {
                            ...p.statusQuantities,
                            available: p.statusQuantities.available + 1,
                          },
                        }))
                      }
                      className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-sm active:scale-85 border border-slate-100 dark:border-slate-750/50 hover:text-teal-500 dark:hover:text-teal-400"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-8 space-y-1.5 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between gap-1 w-full">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-teal-500" />
                      {lang === "vi" ? "Vị trí hiển thị *" : "Display Location *"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdminAddress(!showAdminAddress)}
                      className={`text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${
                        showAdminAddress
                          ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 shadow-teal-500/5 scale-102"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border-slate-200/60 dark:border-slate-700/80 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-102"
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
                      className="w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all pr-10 h-[46px]"
                      placeholder={lang === "vi" ? "Ví dụ: Cầu Giấy, Hà Nội..." : "e.g. District 1, HCMC..."}
                      value={newProduct.locationText}
                      onChange={(e) => {
                        setSelectedFromSuggestions(false);
                        setNewProduct((p) => ({ ...p, locationText: e.target.value }));
                      }}
                    />
                    {isSearchingAddress && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={15} className="animate-spin text-teal-500" />
                      </div>
                    )}
                  </div>

                  {/* Address search suggestions panel */}
                  {addressSuggestions.length > 0 && (
                    <div className="absolute z-[80] left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50 animate-in fade-in duration-200">
                      {addressSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewProduct((p) => ({ ...p, locationText: suggestion }));
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
                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-650 transition-colors"
                      >
                        {lang === "vi" ? "Đóng" : "Close"}
                      </button>
                    </div>
                    <AddressSelector
                      lang={lang as any}
                      onSelect={(fullAddress) => {
                        setNewProduct((prev) => ({ ...prev, locationText: fullAddress }));
                        setShowAdminAddress(false);
                      }}
                    />
                  </div>
                )}

                {/* Row 4: Description (12 cols - Sleek height of 2 rows) */}
                <div className="col-span-12 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <AlignLeft size={10} className="text-teal-500" />
                    <span>{t.addProductDescription}</span>
                  </label>
                  <div className="relative group/desc">
                    <textarea
                      className={`w-full rounded-2xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 pl-11 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all resize-none h-[64px] ${aiFilledFields.has("description") ? "ai-filled" : ""}`}
                      placeholder={t.addProductDescriptionPlaceholder}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                    />
                    <div className="absolute left-4 top-[14px] text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within/desc:text-teal-500">
                      <AlignLeft size={15} />
                    </div>
                  </div>
                </div>

                {/* Row 5: Truth Commitment Checkbox */}
                <div className="col-span-12 flex items-start gap-3 pt-2">
                  <div className="relative flex items-center h-5">
                    <input
                      type="checkbox"
                      id="confirmTruth"
                      className="sr-only peer"
                      required
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                    />
                    <div
                      onClick={() => setIsConfirmed(!isConfirmed)}
                      className={`w-5 h-5 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        isConfirmed
                          ? "bg-teal-500 border-teal-500 shadow-md shadow-teal-500/20 scale-102"
                          : "border-slate-350 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-455"
                      }`}
                    >
                      <Check
                        size={12}
                        className={`text-white font-black transition-transform duration-200 ${
                          isConfirmed ? "scale-100" : "scale-0"
                        }`}
                      />
                    </div>
                  </div>
                  <label
                    htmlFor="confirmTruth"
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 cursor-pointer select-none transition-colors mt-0.5"
                  >
                    {t.addProductConfirmTruth}
                  </label>
                </div>

                {/* Quota Exhausted Warning Banner */}
                {quotaDetails && (
                  <div className="col-span-12 overflow-hidden rounded-3xl bg-gradient-to-br from-red-500/10 via-amber-500/5 to-transparent border border-red-500/20 dark:border-red-500/30 p-5 shadow-lg shadow-red-500/5 animate-in fade-in slide-in-from-top-3 duration-300 relative">
                    <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-red-500/15 dark:bg-red-500/25 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20">
                        <Sparkles size={18} className="text-red-500 animate-pulse" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          {lang === "vi" ? "Hạn ngạch AI tạm thời hết" : "AI Quota Exhausted"}
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        </h4>
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 leading-relaxed">
                          {quotaDetails.resetTimeMessage}
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            ℹ️ {lang === "vi" ? "Kỹ thuật:" : "Technical:"} {quotaDetails.type === "day" ? "DAILY_LIMIT_EXCEEDED" : quotaDetails.type === "minute" ? "MINUTE_LIMIT_EXCEEDED" : "API_QUOTA_EXHAUSTED"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200/5 dark:border-slate-850">
                            ✍️ {lang === "vi" ? "Vui lòng tự điền thông tin" : "Please fill details manually"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Input + Preview Card - Bottom of form */}
                <div className="col-span-12">
                  <div className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
                    newProduct.price
                      ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50/50 dark:from-emerald-955/25 dark:via-teal-955/15 dark:to-slate-900 border-emerald-200/70 dark:border-emerald-800/40 shadow-md shadow-emerald-500/5"
                      : "bg-slate-50/40 dark:bg-slate-950/30 border-slate-200/60 dark:border-slate-800"
                  }`}>
                    {/* Top: Label + Status */}
                    <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        💰
                        <span>{lang === "vi" ? "Giá thuê / ngày" : "Rental price / day"} *</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {aiInsight?.aiPowered && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-650 dark:text-purple-400 border border-purple-500/20">
                            <Sparkles size={8} />
                            Gemini AI
                          </span>
                        )}
                        {aiInsight && !aiInsight.aiPowered && (
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {lang === "vi" ? "Ước tính" : "Estimate"}
                          </span>
                        )}
                        {newProduct.price && (
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                              {lang === "vi" ? "Đã nhập" : "Set"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Input row */}
                    <div className="px-3 pb-3 flex items-center gap-3">
                      <div className="relative flex-1 group/price">
                        <input
                          className={`w-full rounded-xl border pl-11 pr-16 py-2.5 text-xl font-black outline-none tabular-nums tracking-tight transition-all duration-300 h-[52px] ${
                            newProduct.price
                              ? "border-emerald-300/60 dark:border-emerald-700/50 bg-white/80 dark:bg-slate-900/80 text-emerald-800 dark:text-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                              : "border-slate-200/85 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 text-slate-800 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                          } ${aiFilledFields.has("price") ? "ai-filled" : ""}`}
                          placeholder="0"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                          type="number"
                          min="0"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within/price:text-teal-500">
                          <Coins size={15} />
                        </div>
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg pointer-events-none border transition-all duration-300 ${
                          newProduct.price
                            ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/15"
                        }`}>
                          ₫/ngày
                        </span>
                      </div>
                    </div>

                    {/* AI Price Insight Panel */}
                    {aiInsight && (aiInsight.priceMin || aiInsight.priceMax || aiInsight.priceReason) && (
                      <div className="mx-3 mb-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {aiInsight.priceMin && aiInsight.priceMax && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Sparkles size={8} className="text-purple-400" />
                                {lang === "vi" ? "Khoảng giá AI đề xuất" : "AI Suggested Price Range"}
                              </span>
                              {aiInsight.confidence && (
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                  aiInsight.confidence === "high"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : aiInsight.confidence === "medium"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-slate-500/15 text-slate-500"
                                }`}>
                                  {lang === "vi"
                                    ? aiInsight.confidence === "high" ? "🎯 Tin cao" : aiInsight.confidence === "medium" ? "〜 Vừa" : "? Thấp"
                                    : aiInsight.confidence}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                                {new Intl.NumberFormat("vi-VN").format(aiInsight.priceMin)}₫
                              </span>
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-teal-400 rounded-full" />
                              </div>
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                                {new Intl.NumberFormat("vi-VN").format(aiInsight.priceMax)}₫
                              </span>
                            </div>
                          </div>
                        )}
                        {aiInsight.priceReason && (
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-2">
                            💡 {aiInsight.priceReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <footer className="mt-8 flex gap-3 border-t border-slate-100/80 dark:border-slate-800/80 pt-5">
              <button
                type="button"
                className="flex-1 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200"
                onClick={onClose}
              >
                {t.addProductCancel}
              </button>
              <button
                type="submit"
                disabled={isUploading || isAnalyzing}
                className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 dark:from-teal-600 dark:to-emerald-500 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl hover:shadow-teal-500/10 dark:hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-transparent disabled:opacity-50"
              >
                {(isUploading || isAnalyzing) && <Loader2 size={13} className="animate-spin" />}
                {t.addProductSave}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};