import { useState } from "react";
import { Package, X, Send } from "lucide-react";
import { PRODUCTS } from "../../shared/data";

interface ProductPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
  }) => void;
}

export function ProductPicker({
  isOpen,
  onClose,
  onSelectProduct,
}: ProductPickerProps) {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Package size={20} />
          Chọn sản phẩm trong kho
        </h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product.id)}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedProduct === product.id
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex gap-2">
                <div className="text-2xl">{product.image}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                  <p className="text-sm font-semibold text-teal-600 mt-1">
                    ${product.price}/ngày
                  </p>
                  {product.rating && (
                    <p className="text-xs text-amber-600">
                      ⭐ {product.rating} ({product.reviews} reviews)
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        {selectedProduct ? (
          <div>
            {(() => {
              const product = PRODUCTS.find((p) => p.id === selectedProduct);
              return product ? (
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    Sản phẩm đã chọn:
                  </p>
                  <p className="text-sm font-medium text-slate-900 mb-3">
                    {product.name} - ${product.price}/ngày
                  </p>
                  <button
                    onClick={() => {
                      onSelectProduct({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                      });
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-white hover:bg-teal-700 transition"
                  >
                    <Send size={16} />
                    Gửi sản phẩm
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-4">
            Chọn sản phẩm để tiếp tục
          </p>
        )}
      </div>
    </div>
  );
}
