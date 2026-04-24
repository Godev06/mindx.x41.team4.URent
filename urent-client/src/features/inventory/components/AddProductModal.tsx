import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  CheckCircle2,
  Trash2,
  FolderOpen,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    name: string;
    category: string;
    price: number;
    statusQuantities: {
      available: number;
      rented: number;
      overdue: number;
    };
    condition: string;
    imageUrl?: string;
    specs?: string[];
  }) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { lang } = useI18n();
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    statusQuantities: {
      available: 1,
      rented: 0,
      overdue: 0
    },
    condition: "New",
    imageUrl: "",
    specs: "",
  });
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t =
    lang === "vi"
      ? {
        title: "Thêm hàng mới",
        subtitle: "Cập nhật kho hàng của bạn một cách nhanh chóng.",
        name: "Tên hàng",
        category: "Phân loại",
        price: "Giá thuê/ngày",
        available: "Rảnh",
        rented: "Thuê",
        overdue: "Trễ",
        condition: "Độ mới",
        image: "Hình ảnh",
        specs: "Thông số kỹ thuật",
        save: "Lưu sản phẩm",
        cancel: "Hủy bỏ",
        required: "Vui lòng nhập đầy đủ thông tin.",
        placeholderName: "VD: Máy ảnh Sony A7R IV",
        placeholderCategory: "Chọn loại sản phẩm...",
        uploadFile: "Tải ảnh",
        confirmTruth: "Tôi cam đoan thông tin là sự thật",
      }
      : {
        title: "Add New Item",
        subtitle: "Quickly update your inventory list.",
        name: "Item Name",
        category: "Category",
        price: "Rental Price/Day",
        available: "Free",
        rented: "Rent",
        overdue: "Over",
        condition: "Condition",
        image: "Product Image",
        specs: "Technical Specs",
        save: "Save Item",
        cancel: "Cancel",
        required: "Please fill all fields.",
        placeholderName: "e.g. Sony A7R IV Camera",
        placeholderCategory: "Select category...",
        uploadFile: "Upload Image",
        confirmTruth: "I confirm the information is true",
      };

  useEffect(() => {
    if (!isOpen) {
      setError("");
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQtyChange = (field: 'available' | 'rented' | 'overdue', val: string) => {
    const num = parseInt(val) || 0;
    setNewProduct(prev => ({
      ...prev,
      statusQuantities: {
        ...prev.statusQuantities,
        [field]: num
      }
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      setError(t.required);
      return;
    }

    onAdd({
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      statusQuantities: newProduct.statusQuantities,
      condition: newProduct.condition,
      imageUrl: newProduct.imageUrl || undefined,
      specs: newProduct.specs ? newProduct.specs.split(",").map((s) => s.trim()) : undefined,
    });

    setNewProduct({
      name: "",
      category: "",
      price: "",
      statusQuantities: { available: 1, rented: 0, overdue: 0 },
      condition: "New",
      imageUrl: "",
      specs: "",
    });
    onClose();
  };

  const conditionOptions = [
    { value: "New", label: lang === "vi" ? "Mới 100%" : "New" },
    { value: "99%", label: "99%" },
    { value: "95%", label: "95%" },
    { value: "Used", label: lang === "vi" ? "Đã sử dụng" : "Used" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-400">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-5xl transform overflow-hidden rounded-[2.5rem] bg-white shadow-3xl transition-all dark:bg-slate-900 animate-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5 border border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Media Panel */}
          <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-800/50 p-10 flex flex-col justify-center border-r border-slate-100 dark:border-slate-800">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {newProduct.imageUrl ? (
              <div className="group relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700">
                <img src={newProduct.imageUrl} alt="Preview" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button type="button" onClick={() => setNewProduct(p => ({ ...p, imageUrl: "" }))} className="h-12 w-12 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 rounded-full bg-white text-teal-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><FolderOpen size={20} /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex aspect-square w-full flex-col items-center justify-center rounded-[2rem] bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl transition-all border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-300 group-hover:text-teal-500 transition-colors border border-slate-100 dark:border-slate-700"><Plus size={32} /></div>
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.uploadFile}</p>
              </button>
            )}
          </div>

          {/* Form Panel */}
          <div className="flex-1 p-10 md:p-14">
            <header className="mb-10 flex items-start justify-between">
              <div>
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t.title}</h3>
                <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{t.subtitle}</p>
              </div>
              <button type="button" className="text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={onClose}><X size={28} /></button>
            </header>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.name}</label>
                <div className="relative">
                  <input className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-base font-bold outline-hidden focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all" placeholder={t.placeholderName} value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.category}</label>
                  <input className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-hidden focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all" placeholder={t.placeholderCategory} value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.price}</label>
                  <input className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-hidden focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:text-white transition-all" placeholder="0" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.specs}</label>
                  <input className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 px-5 py-4 text-sm font-bold outline-hidden focus:border-teal-500 dark:text-white transition-all" placeholder="4K, Bluetooth..." value={newProduct.specs} onChange={(e) => setNewProduct((p) => ({ ...p, specs: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t.condition}</label>
                  <div className="flex gap-2">
                    {conditionOptions.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setNewProduct(p => ({ ...p, condition: opt.value }))} className={`flex-1 rounded-xl py-3 text-[9px] font-black uppercase transition-all border ${newProduct.condition === opt.value ? "bg-slate-900 border-slate-900 text-white shadow-lg dark:bg-teal-600 dark:border-teal-600" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700"}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="confirmTruth" className="h-5 w-5 rounded-md border-slate-200 text-teal-600 focus:ring-teal-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer" required />
                <label htmlFor="confirmTruth" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer">{t.confirmTruth}</label>
              </div>

              {error && (
                <div className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">{error}</div>
              )}
            </div>

            <footer className="mt-14 flex gap-4">
              <button type="button" className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={onClose}>{t.cancel}</button>
              <button type="submit" className="flex-[2] rounded-full bg-slate-900 dark:bg-teal-600 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-slate-200 dark:shadow-teal-900/20">{t.save}</button>
            </footer>
          </div>
        </form>
      </div>
    </div>
  );
};
