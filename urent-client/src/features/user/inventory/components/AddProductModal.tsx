import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Sparkles, Loader2, Zap, MapPin } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { PRODUCTS } from "../../dataset/products";
import { apiClient } from "../../../../lib/api/apiClient";
import { normalizeApiError } from "../../../../lib/api/apiError";

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
  }) => void;
}

type UnknownRecord = Record<string, unknown>;

type ProductAiSuggestion = {
  name?: string;
  category?: string;
  price?: number;
  condition?: string;
  description?: string[];
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

  const rawPrice = data.price;
  const parsedPrice =
    typeof rawPrice === "number"
      ? rawPrice
      : typeof rawPrice === "string" && rawPrice.trim()
        ? Number(rawPrice)
        : undefined;

  const suggestion: ProductAiSuggestion = {
    name: typeof data.name === "string" ? data.name.trim() : undefined,
    category:
      typeof data.category === "string" ? data.category.trim() : undefined,
    price:
      typeof parsedPrice === "number" && Number.isFinite(parsedPrice)
        ? parsedPrice
        : undefined,
    condition:
      typeof data.condition === "string" ? data.condition.trim() : undefined,
    description,
  };

  return Object.values(suggestion).some((value) => value !== undefined)
    ? suggestion
    : null;
};

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { t, lang } = useI18n();
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setAiError("");
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIAnalyze = async () => {
    if (!newProduct.imageUrl) {
      return;
    }

    setAiError("");
    setIsAnalyzing(true);

    try {
      const response = await apiClient.post<unknown>(
        "/api/v1/products/ai/analyze",
        {
          imageUrl: newProduct.imageUrl,
        },
      );

      const suggestion = parseAiSuggestion(response.data);
      if (!suggestion) {
        setAiError(t.addProductAiInvalid);
        return;
      }

      setNewProduct((prev) => ({
        ...prev,
        name: suggestion.name ?? prev.name,
        category: suggestion.category ?? prev.category,
        price:
          typeof suggestion.price === "number"
            ? String(Math.round(suggestion.price))
            : prev.price,
        condition: suggestion.condition ?? prev.condition,
        description: suggestion.description?.join(", ") ?? prev.description,
      }));
    } catch (error: unknown) {
      const apiError = normalizeApiError(error);
      if (apiError.statusCode === 404 || apiError.statusCode === 405) {
        setAiError(t.addProductAiUnavailable);
      } else {
        setAiError(apiError.message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.locationText) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc (Tên, Giá, Vị trí)");
      return;
    }

    onAdd({
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      locationText: newProduct.locationText,
      statusQuantities: newProduct.statusQuantities,
      condition: newProduct.condition,
      imageUrl: newProduct.imageUrl || undefined,
      description: newProduct.description
        ? newProduct.description.split(",").map((s) => s.trim())
        : undefined,
    });

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
    onClose();
  };

  const conditionOptions = [
    { value: "New", label: lang === "vi" ? "Mới 100%" : "New" },
    { value: "99%", label: "99%" },
    { value: "95%", label: "95%" },
    { value: "Used", label: lang === "vi" ? "Đã sử dụng" : "Used" },
  ];

  const defaultCategories = [
    "Điện tử & Công nghệ",
    "Du lịch & Dã ngoại",
    "Đồ dùng học tập",
    "Thời trang & Đời sống",
  ];

  const categoryOptions = defaultCategories.map((cat) => {
    const labels: Record<string, { vi: string; en: string }> = {
      "Điện tử & Công nghệ": { vi: "Điện tử & Công nghệ", en: "Electronics & Tech" },
      "Du lịch & Dã ngoại": { vi: "Du lịch & Dã ngoại", en: "Travel & Outdoors" },
      "Đồ dùng học tập": { vi: "Đồ dùng học tập", en: "School supplies" },
      "Thời trang & Đời sống": { vi: "Thời trang & Đời sống", en: "Fashion & Lifestyle" },
    };
    return {
      value: cat,
      label: lang === "vi" ? labels[cat]?.vi || cat : labels[cat]?.en || cat,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-400">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl transform overflow-hidden rounded-[2.5rem] bg-white shadow-3xl transition-all dark:bg-slate-900 animate-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5 border border-slate-100 dark:border-slate-800">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto no-scrollbar"
        >
          {/* Media Panel */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-10 flex flex-col justify-center border-r border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-teal-500" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {newProduct.imageUrl ? (
              <div className="space-y-6">
                <div className="group relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700">
                  <img
                    src={newProduct.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct((p) => ({ ...p, imageUrl: "" }))
                      }
                      className="h-12 w-12 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 w-12 rounded-full bg-white text-teal-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <Zap size={20} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-slate-800 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {isAnalyzing
                    ? t.addProductAiAnalyzing
                    : t.addProductAiAnalyze}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex aspect-square w-full flex-col items-center justify-center rounded-[2rem] bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl transition-all border-2 border-dashed border-slate-200 dark:border-slate-700"
              >
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-300 group-hover:text-teal-500 transition-colors border border-slate-100 dark:border-slate-700">
                  <Plus size={32} />
                </div>
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t.addProductUploadFile}
                </p>
              </button>
            )}
          </div>

          {/* Form Panel */}
          <div className="flex-1 p-10 md:p-14">
            <header className="mb-10 flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {t.addProductTitle}
                </h3>
                <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {t.addProductSubtitle}
                </p>
              </div>
              <button
                type="button"
                className="text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={onClose}
              >
                <X size={28} />
              </button>
            </header>

            <div className="space-y-8">
              {/* 1. Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {t.addProductName} *
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-base font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all"
                  placeholder={t.addProductPlaceholderName}
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              {/* 2. Category & Condition */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {t.addProductCategory}
                  </label>

                  <select
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all appearance-none cursor-pointer"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        category: e.target.value,
                      }))
                    }
                  >
                    {categoryOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {t.addProductCondition}
                  </label>

                  <select
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all appearance-none cursor-pointer"
                    value={newProduct.condition}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        condition: e.target.value,
                      }))
                    }
                  >
                    {conditionOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Location (NEW) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1">
                  <MapPin size={12} className="text-teal-500" /> Vị trí / Địa chỉ hiển thị *
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all"
                  placeholder="Ví dụ: Cầu Giấy, Hà Nội..."
                  value={newProduct.locationText}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, locationText: e.target.value }))
                  }
                />
              </div>

              {/* 4. Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {t.addProductDescription}
                </label>
                <textarea
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all resize-none"
                  rows={3}
                  placeholder={t.addProductDescriptionPlaceholder}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {/* 5. Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {t.addProductPrice} *
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-lg font-black outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all tabular-nums"
                    placeholder="0"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, price: e.target.value }))
                    }
                    type="number"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    VND / Day
                  </span>
                </div>
              </div>

              {/* 6. Confirmation */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                <input
                  type="checkbox"
                  id="confirmTruth"
                  className="h-5 w-5 rounded-md border-slate-200 text-teal-600 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                  required
                />
                <label
                  htmlFor="confirmTruth"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer"
                >
                  {t.addProductConfirmTruth}
                </label>
              </div>

              {aiError && (
                <div className="text-amber-500 text-[10px] font-black uppercase tracking-widest text-center">
                  {aiError}
                </div>
              )}

              {error && (
                <div className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">
                  {error}
                </div>
              )}
            </div>

            <footer className="mt-14 flex gap-4">
              <button
                type="button"
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={onClose}
              >
                {t.addProductCancel}
              </button>
              <button
                type="submit"
                className="flex-[2] rounded-full bg-slate-900 dark:bg-teal-600 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-slate-200 dark:shadow-teal-900/20"
              >
                {t.addProductSave}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};