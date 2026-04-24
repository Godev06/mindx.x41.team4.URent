import React, { useState, useRef } from "react";
import {
  DollarSign,
  ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  MousePointer2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";

interface ProductFormData {
  name: string;
  category: string;
  description: string;
  price: string;
  statusQuantities: {
    available: number;
    rented: number;
    overdue: number;
  };
  condition: string;
  image: string;
  specs: string;
}

const initialForm: ProductFormData = {
  name: "",
  category: "",
  description: "",
  price: "",
  statusQuantities: {
    available: 1,
    rented: 0,
    overdue: 0
  },
  condition: "New",
  image: "",
  specs: "",
};

export const AddProducts: React.FC = () => {
  const { lang } = useI18n();
  const [form, setForm] = useState<ProductFormData>(initialForm);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t =
    lang === "vi"
      ? {
          title: "Đăng Sản Phẩm Mới",
          subtitle: "Chia sẻ thiết bị của bạn và bắt đầu kiếm thu nhập.",
          step1: "Thông tin",
          step2: "Giá & Số lượng",
          step3: "Hình ảnh",
          name: "Tên sản phẩm",
          category: "Danh mục",
          description: "Mô tả chi tiết",
          price: "Giá thuê (VND/ngày)",
          available: "Số lượng rảnh",
          rented: "Đang cho thuê",
          overdue: "Bị trễ hạn",
          condition: "Độ mới",
          image: "Hình ảnh sản phẩm",
          specs: "Thông số kỹ thuật",
          next: "Tiếp tục",
          back: "Quay lại",
          submit: "Xác nhận Đăng",
          success: "Hoàn tất đăng tải!",
          preview: "Xem trước",
          uploadFile: "Chọn ảnh từ thư mục",
          dropzone: "Chọn hình ảnh sản phẩm",
          confirmTruth: "Tôi cam đoan thông tin trên là sự thật",
          location: "Vị trí",
        }
      : {
          title: "Post New Product",
          subtitle: "Share your equipment and start earning.",
          step1: "Information",
          step2: "Price & Quantities",
          step3: "Media",
          name: "Product Name",
          category: "Category",
          description: "Description",
          price: "Rental Price (VND/day)",
          available: "Available Qty",
          rented: "Rented Qty",
          overdue: "Overdue Qty",
          condition: "Condition",
          image: "Product Image",
          specs: "Technical Specs",
          next: "Continue",
          back: "Go Back",
          submit: "Confirm & Post",
          success: "Post Successful!",
          preview: "Preview",
          uploadFile: "Choose image from folder",
          dropzone: "Choose product image",
          confirmTruth: "I confirm the information is true",
          location: "Location",
        };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleQtyChange = (field: 'available' | 'rented' | 'overdue', val: string) => {
    const num = parseInt(val) || 0;
    setForm(prev => ({
        ...prev,
        statusQuantities: {
            ...prev.statusQuantities,
            [field]: num
        }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const steps = [
    { id: 1, label: t.step1, icon: <Info size={18} /> },
    { id: 2, label: t.step2, icon: <DollarSign size={18} /> },
    { id: 3, label: t.step3, icon: <ImageIcon size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-20 font-sans selection:bg-teal-100 selection:text-teal-900">
      <div className="mx-auto max-w-5xl px-4 pt-12 md:pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.title}<span className="text-teal-500">.</span>
          </h1>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            {t.subtitle}
          </p>
        </div>

        <div className="mx-auto max-w-xl mb-16 flex items-center justify-between px-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2" />
            {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-[4px] border-slate-50 dark:border-slate-900 ${
                        step >= s.id ? "bg-teal-500 text-white shadow-xl shadow-teal-500/20 scale-110" : "bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-700"
                    }`}>
                        {step > s.id ? <CheckCircle2 size={20} strokeWidth={2.5} /> : s.icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.id ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                        {s.label}
                    </span>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/5">
              {success ? (
                <div className="py-20 text-center animate-in zoom-in duration-700">
                   <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-teal-500 text-white shadow-2xl shadow-teal-500/30">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t.success}</h2>
                  <button onClick={() => window.location.reload()} className="mt-10 rounded-full bg-slate-900 dark:bg-teal-600 px-12 py-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.05] active:scale-95 shadow-xl shadow-slate-200 dark:shadow-teal-900/20">
                    {lang === 'vi' ? 'Tiếp tục đăng tin' : 'Post another'}
                  </button>
                </div>
              ) : (
                <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); if(step < 3) setStep(step + 1); else setSuccess(true); }}>
                  {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.name}</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fujifilm X-T4" className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-xl font-bold outline-hidden transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.category}</label>
                        <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold outline-hidden transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white appearance-none cursor-pointer" required>
                          <option value="">Select Category...</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Cameras">Cameras</option>
                          <option value="Outdoor">Outdoor</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.description}</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={5} className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold outline-hidden transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white resize-none" placeholder="Describe your item details..." />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.price}</label>
                        <div className="relative">
                            <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-2xl font-black outline-hidden focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white tabular-nums" required />
                            <span className="absolute right-6 bottom-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">VND / DAY</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5"><CheckCircle2 size={12} strokeWidth={2.5}/> {t.available}</label>
                            <input className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-sm font-bold outline-hidden focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white tabular-nums" type="number" value={form.statusQuantities.available} onChange={(e) => handleQtyChange('available', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><Clock size={12} strokeWidth={2.5}/> {t.rented}</label>
                            <input className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-sm font-bold outline-hidden focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white tabular-nums" type="number" value={form.statusQuantities.rented} onChange={(e) => handleQtyChange('rented', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5"><AlertCircle size={12} strokeWidth={2.5}/> {t.overdue}</label>
                            <input className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-sm font-bold outline-hidden focus:border-rose-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white tabular-nums" type="number" value={form.statusQuantities.overdue} onChange={(e) => handleQtyChange('overdue', e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.condition}</label>
                        <div className="flex gap-3">
                            {["New", "99%", "95%", "Used"].map((c) => (
                                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, condition: c }))} className={`flex-1 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all border ${form.condition === c ? "bg-slate-900 border-slate-900 text-white shadow-xl dark:bg-teal-600 dark:border-teal-600" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50"}`}>{c}</button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.image}</label>
                        <div className="group relative aspect-video w-full rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center transition-all hover:bg-slate-100/50 border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            {form.image ? (
                                <>
                                    <img src={form.image} alt="Preview" className="h-full w-full object-cover rounded-[2.5rem]" />
                                    <button type="button" onClick={() => setForm(prev => ({ ...prev, image: "" }))} className="absolute top-6 right-6 h-12 w-12 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><Trash2 size={22} /></button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-200 group-hover:text-teal-500 transition-all mb-6 border border-slate-100 dark:border-slate-700"><Plus size={32} /></button>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.dropzone}</p>
                                </div>
                            )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.specs}</label>
                        <input name="specs" value={form.specs} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-5 text-sm font-bold outline-hidden transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white" placeholder="Specs separated by comma (e.g. 4K, Bluetooth, 24MP)..." />
                      </div>

                      <div className="flex items-center gap-4 py-4">
                        <input type="checkbox" id="lastConfirm" className="h-6 w-6 rounded-md border-slate-200 text-teal-600 focus:ring-teal-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer" required />
                        <label htmlFor="lastConfirm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t.confirmTruth}</label>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-12">
                    <button type="button" disabled={step === 1} onClick={() => setStep(step - 1)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${step === 1 ? "opacity-0" : "text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>{t.back}</button>
                    <button type="submit" className="px-16 py-5 rounded-full bg-slate-900 dark:bg-teal-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.05] active:scale-95 transition-all shadow-slate-200 dark:shadow-teal-900/20">{step === 3 ? t.submit : t.next}</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-24 space-y-8">
                <div className="space-y-6">
                    <h5 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3"><MousePointer2 size={14} className="text-teal-500" /> {t.preview}</h5>
                    <div className="group rounded-[2.5rem] bg-white dark:bg-slate-800 p-4 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/5">
                        <div className="relative aspect-[5/6] w-full overflow-hidden rounded-[2.2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 shadow-inner">
                            {form.image ? <img src={form.image} alt="Preview" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-slate-200 dark:text-slate-700"><ImageIcon size={48} /></div>}
                            <span className="absolute left-4 top-4 rounded-full border border-teal-400/60 bg-white/90 px-4 py-1.5 text-[10px] font-black text-teal-700 shadow-md dark:bg-slate-800/90 dark:text-teal-300">{form.condition}</span>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2 text-lg leading-tight mb-1">{form.name || "Product Name"}</h3>
                                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">{form.category || "CATEGORY"}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 w-fit px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                <MapPin size={12} className="text-teal-500" /> {t.location}
                            </div>
                            <div className="pt-5 flex items-end justify-between border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                        {form.price ? Number(form.price).toLocaleString() : "0"}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">VND / DAY</span>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-teal-400 to-cyan-400 dark:from-teal-700 dark:to-cyan-700 flex items-center justify-center text-white shadow-xl shadow-teal-500/20"><ChevronRight size={22} strokeWidth={2.5} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
