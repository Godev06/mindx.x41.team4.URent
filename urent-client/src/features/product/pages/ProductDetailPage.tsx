import { useMemo, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, MapPin, ShieldCheck, Star } from "lucide-react";
import { PRODUCTS } from "../../shared/data";
import type { Product } from "../../shared/types";
import { Badge } from "../../shared/components/Badge";

interface ProductDetailPageProps {
  productId: number | null;
  onBack: () => void;
}

export function ProductDetailPage({ productId, onBack }: ProductDetailPageProps) {
  const [days, setDays] = useState(1);
  const product: Product = useMemo(
    () => PRODUCTS.find((item) => item.id === productId) ?? PRODUCTS[0],
    [productId],
  );

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-12">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 font-medium">
        <ArrowLeft size={18} /> Quay lai
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-5">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star size={16} fill="currentColor" />
                {product.rating ?? 4.9}
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin size={16} /> Thu Duc, TP.HCM
              </div>
            </div>
            <p className="text-gray-600">{product.description ?? "Thong tin san pham dang cap nhat."}</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(product.specs ?? ["Bao gom day du phu kien", "Ho tro giao nhan"]).map((spec) => (
                <li key={spec} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={16} className="text-green-500" /> {spec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl sticky top-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gia thue</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-blue-600">${product.price}</span>
                  <span className="text-gray-400 font-medium">/ngay</span>
                </div>
              </div>
              <Badge variant="green">San sang</Badge>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tam tinh</span>
                <span className="font-bold">${product.price * days}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">So ngay</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDays((n) => Math.max(1, n - 1))} className="w-8 h-8 rounded-lg bg-gray-100">-</button>
                  <span className="font-bold">{days}</span>
                  <button onClick={() => setDays((n) => n + 1)} className="w-8 h-8 rounded-lg bg-gray-100">+</button>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
                <span className="font-bold">Tong</span>
                <span className="font-black text-xl text-blue-600">${product.price * days + 2.5}</span>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">Gui yeu cau thue</button>
            <div className="flex items-center gap-2 justify-center text-[10px] text-gray-400 font-bold uppercase mt-4">
              <ShieldCheck size={14} className="text-green-500" /> Thanh toan bao mat
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-2 justify-center">
              <Calendar size={14} /> Co the dat lich ngay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
