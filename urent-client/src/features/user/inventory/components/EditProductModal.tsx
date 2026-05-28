import React, { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Package, Loader2, MapPin } from "lucide-react";
import { apiClient } from "../../../../lib/api/apiClient";
import { useI18n } from "../../shared/context/LanguageContext";
import { PRODUCTS } from "../../dataset/products";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSuccess: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const { lang, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
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

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        name: item.name || "",
        category: item.category || "Electronics",
        price: item.price ? String(item.price) : "",
        condition: item.condition || "New",
        locationText: item.locationText || item.location || "",
        imageUrl: item.imageUrl || item.image || "",
        description: item.description ? item.description.join(", ") : "",
        available: item.statusQuantities?.available ?? 1,
        rented: item.statusQuantities?.rented ?? 0,
        overdue: item.statusQuantities?.overdue ?? 0,
      });
      setError("");
    }
  }, [isOpen, item]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Hiển thị preview ngay lập tức
      setFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
      try {
        const uploadData = new FormData();
        uploadData.append("image", file);
        const res = await apiClient.post("/api/v1/upload", uploadData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setFormData((prev) => ({
          ...prev,
          imageUrl: `${apiClient.defaults.baseURL}${res.data.url}`,
        }));
      } catch (err) {
        setError(lang === "vi" ? "Lỗi tải ảnh. Vui lòng thử lại!" : "Upload error");
      } finally {
        setIsUploading(false);
      }
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price || !formData.locationText) {
      return setError(lang === "vi" ? "Vui lòng nhập đủ các trường bắt buộc" : "Please fill all required fields");
    }
    setIsSaving(true);
    try {
      // Lấy tọa độ GPS thực tế
      let lng = 105.8342, lat = 21.0278;
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.locationText)}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      } catch (e) {}

      const submitData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        condition: formData.condition,
        locationText: formData.locationText,
        location: { type: "Point", coordinates: [lng, lat] }, // <-- Cập nhật tọa độ
        image: formData.imageUrl,
        statusQuantities: {
          available: Number(formData.available),
          rented: Number(formData.rented),
          overdue: Number(formData.overdue),
        },
        description: formData.description ? formData.description.split(",").map((s) => s.trim()) : undefined,
      };
      await apiClient.put(`/api/v1/products/${item.id || item._id}`, submitData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;

  // Options tương tự như AddProductModal
  const conditionOptions = [
    { value: "New", label: lang === "vi" ? "Mới 100%" : "New" },
    { value: "99%", label: "99%" },
    { value: "95%", label: "95%" },
    { value: "Used", label: lang === "vi" ? "Đã sử dụng" : "Used" },
  ];

  const defaultCategories = ["Camera", "Laptop", "Outdoor", "Books", "Electronics"];
  const uniqueCategories =
    PRODUCTS.length > 0
      ? Array.from(new Set(PRODUCTS.map((p) => p.category)))
      : defaultCategories;

  const categoryOptions = uniqueCategories.map((cat) => {
    const labels: Record<string, { vi: string; en: string }> = {
      Camera: { vi: "Máy ảnh", en: "Camera" },
      Laptop: { vi: "Máy tính xách tay", en: "Laptop" },
      Outdoor: { vi: "Dã ngoại", en: "Outdoor" },
      Books: { vi: "Sách", en: "Books" },
      Electronics: { vi: "Điện tử", en: "Electronics" },
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
          {/* Media Panel (Left) */}
          <div className="w-full md:w-5/12 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 p-10 flex flex-col justify-center border-r border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-teal-500" />
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            
            {formData.imageUrl ? (
              <div className="space-y-6">
                <div className="group relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, imageUrl: "" }))}
                      className="h-12 w-12 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 w-12 rounded-full bg-white text-teal-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <Package size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group flex aspect-square w-full flex-col items-center justify-center rounded-[2rem] bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl transition-all border-2 border-dashed border-slate-200 dark:border-slate-700"
              >
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-300 group-hover:text-teal-500 transition-colors border border-slate-100 dark:border-slate-700">
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-teal-500" />
                  ) : (
                    <Package size={32} />
                  )}
                </div>
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {lang === "vi" ? "Tải ảnh lên" : "Upload File"}
                </p>
              </button>
            )}
          </div>

          {/* Form Panel (Right) */}
          <div className="flex-1 p-10 md:p-14">
            <header className="mb-10 flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {lang === "vi" ? "Chỉnh sửa vật phẩm" : "Edit Product"}
                </h3>
                <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {lang === "vi" ? "Cập nhật thông tin chi tiết" : "Update details"}
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
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
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
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
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
                    value={formData.condition}
                    onChange={(e) => setFormData((p) => ({ ...p, condition: e.target.value }))}
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

              {/* 3. Status Quantities (Unique to Edit Modal) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500">
                    {lang === "vi" ? "Sẵn có" : "Available"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all tabular-nums"
                    value={formData.available}
                    onChange={(e) => setFormData((p) => ({ ...p, available: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500">
                    {lang === "vi" ? "Đang Thuê" : "Rented"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all tabular-nums"
                    value={formData.rented}
                    onChange={(e) => setFormData((p) => ({ ...p, rented: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-500">
                    {lang === "vi" ? "Quá hạn" : "Overdue"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all tabular-nums"
                    value={formData.overdue}
                    onChange={(e) => setFormData((p) => ({ ...p, overdue: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* 4. Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1">
                  <MapPin size={12} className="text-teal-500" /> 
                  {lang === "vi" ? "Vị trí / Địa chỉ hiển thị" : "Location"} *
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all"
                  placeholder="Ví dụ: Cầu Giấy, Hà Nội..."
                  value={formData.locationText}
                  onChange={(e) => setFormData((p) => ({ ...p, locationText: e.target.value }))}
                />
              </div>

              {/* 5. Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {t.addProductDescription}
                </label>
                <textarea
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all resize-none"
                  rows={3}
                  placeholder={t.addProductDescriptionPlaceholder}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* 6. Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {t.addProductPrice} *
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-lg font-black outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all tabular-nums"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    type="number"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    VND / Day
                  </span>
                </div>
              </div>

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
                disabled={isSaving || isUploading}
                className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-teal-600 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-slate-200 dark:shadow-teal-900/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {t.addProductSave}
              </button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};