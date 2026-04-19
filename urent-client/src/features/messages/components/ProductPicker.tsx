import { useEffect, useMemo, useState } from "react";
import { Package, X, Send } from "lucide-react";
import { messageService } from "../services/messageService";
import type { ApiProduct } from "../types";

interface ProductPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ApiProduct) => void;
}

export function ProductPicker({
  isOpen,
  onClose,
  onSelectProduct,
}: ProductPickerProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    messageService
      .getProducts({ limit: 50, q: searchTerm || undefined })
      .then((response) => {
        if (!cancelled) {
          setProducts(response.data);
          setSelectedProductId((currentValue) =>
            response.data.some((product) => product.id === currentValue)
              ? currentValue
              : null,
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setError("Không thể tải danh sách sản phẩm.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, searchTerm]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

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
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm sản phẩm..."
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoading ? (
            <div className="col-span-full py-8 text-center text-sm text-slate-500">
              Đang tải sản phẩm...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-slate-500">
              Không có sản phẩm phù hợp
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  selectedProductId === product.id
                    ? "border-teal-600 bg-teal-50"
                    : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex gap-2">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-2xl">{product.image}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">{product.category}</p>
                    <p className="text-sm font-semibold text-teal-600 mt-1">
                      ${product.price}/day
                    </p>
                    {product.rating && (
                      <p className="text-xs text-amber-600">
                        ⭐ {product.rating} ({product.reviews} reviews)
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        {selectedProduct ? (
          <div>
            <p className="text-sm text-slate-600 mb-2">Sản phẩm đã chọn:</p>
            <p className="text-sm font-medium text-slate-900 mb-3">
              {selectedProduct.name} - ${selectedProduct.price}/ngày
            </p>
            <button
              onClick={() => {
                onSelectProduct(selectedProduct);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-white hover:bg-teal-700 transition"
            >
              <Send size={16} />
              Gửi sản phẩm
            </button>
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
