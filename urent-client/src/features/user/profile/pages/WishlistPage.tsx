import { useEffect, useState } from "react";
import { Heart, Loader2, PackageOpen, ShoppingBag } from "lucide-react";
import { profileService } from "../services/profileService";
import type { Product } from "../../shared/types";
import { ProductCard } from "../../home/components/ProductCard";
import { useNavigate } from "react-router-dom";

export function WishlistPage() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách yêu thích:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (productId: string | number) => {
    try {
      const res = await profileService.toggleFavorite(String(productId));
      if (!res.isWishlisted) {
        setFavorites((prev) => prev.filter((p) => (p._id || p.id) !== productId));
      }
    } catch (error) {
      console.error("Lỗi khi bỏ yêu thích:", error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
            <Heart size={28} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
              Sản phẩm yêu thích
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {favorites.length > 0 
                ? `${favorites.length} sản phẩm đang theo dõi` 
                : "Danh sách của bạn đang trống"}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section - Đã tối ưu grid để hiển thị cân đối hơn */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {favorites.map((product) => {
            const displayLocation = typeof product.location === 'string' 
              ? product.location 
              : (product.locationText || "Chưa cập nhật");
            
            return (
              <div key={product._id || product.id} className="w-full">
                <ProductCard
                  product={product}
                  onSelect={(id) => navigate(`/product/${id}`)}
                  isWishlisted={true}
                  onToggleWishlist={handleToggleFavorite}
                  location={displayLocation}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-700">
            <PackageOpen size={40} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            Chưa có sản phẩm yêu thích
          </h3>
          <p className="mb-8 max-w-sm text-slate-500 dark:text-slate-400">
            Bạn chưa lưu bất kỳ sản phẩm nào. Hãy khám phá kho sản phẩm của chúng tôi.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98]"
          >
            <ShoppingBag size={20} />
            Khám phá ngay
          </button>
        </div>
      )}
    </div>
  );
}