import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUpDown,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  Laptop,
  Search,
  Sliders,
  X,
  Tent,
  Shirt,
  MapPin,
  Calendar,
} from "lucide-react";

import type { Product } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { useI18n } from "../../shared/context/LanguageContext";
import { productService } from "../../product/services/productService";
import { profileService } from "../../profile/services/profileService"; // <-- IMPORT THÊM CHO WISHLIST
import { useSearchParams } from "react-router-dom";

interface ProductListingPageProps {
  onProductClick: (id: string | number) => void;
  onBack: () => void;
}

type CategoryKey = "all" | "electronics" | "travel" | "study" | "lifestyle";
type SortType = "latest" | "price-low" | "price-high";

interface ProductMeta {
  locationVi: string;
  locationEn: string;
  distanceKm?: number;
  conditionVi: string;
  conditionEn: string;
}

const ACTIVE_STATUSES = new Set(["Available", "Active"]);
const ITEMS_PER_PAGE = 10;
const SKELETON_COUNT = ITEMS_PER_PAGE;

const toVnd = (price: number) => (price > 1000 ? price : price * 25_000);

// CÔNG THỨC HAVERSINE TÍNH KHOẢNG CÁCH
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function normalizeLocation(loc: unknown): string | undefined {
  if (!loc) return undefined;
  if (typeof loc === "string") return loc || undefined;
  // GeoJSON object {type, coordinates} → bỏ qua, không hiển thị tọa độ thô
  return undefined;
}

function buildProductMeta(product: Product, userLocation: { lat: number; lng: number } | null): ProductMeta {
  let distance: number | undefined = undefined;

  if (userLocation && product.coordinates && product.coordinates.length === 2) {
    const productLng = product.coordinates[0];
    const productLat = product.coordinates[1];
    distance = calculateDistance(userLocation.lat, userLocation.lng, productLat, productLng);
  }

  const loc = product.locationText || normalizeLocation(product.location);

  return {
    locationVi: loc || "Chưa cập nhật",
    locationEn: loc || "Unknown",
    distanceKm: distance,
    conditionVi: product.condition || "Tốt",
    conditionEn: product.condition || "Good",
  };
}



interface FilterPanelProps {
  sortBy: SortType;
  sortOptions: readonly { value: SortType; label: string }[];
  onSortChange: (value: SortType) => void;
  minPriceInput: string;
  maxPriceInput: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onResetPrice: () => void;
  dataMinPriceVnd: number;
  dataMaxPriceVnd: number;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  userLocation: { lat: number; lng: number } | null;
  onGetLocation: () => void;
  radiusKm: number;
  onRadiusChange: (val: number) => void;
  t: any;
}

function FilterPanel({
  sortBy,
  sortOptions,
  onSortChange,
  minPriceInput,
  maxPriceInput,
  onMinChange,
  onMaxChange,
  onResetPrice,
  dataMinPriceVnd,
  dataMaxPriceVnd,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  userLocation,
  onGetLocation,
  radiusKm,
  onRadiusChange,
  t,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      {/* SORTING */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-md backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center gap-2">
          <ArrowUpDown size={16} className="text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.productListingSortBy || "Sắp xếp"}
          </h3>
        </div>
        <div className="space-y-2">
          {sortOptions.map(({ value, label }) => {
            const isSelected = sortBy === value;
            return (
              <label
                key={value}
                className={`group flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 transition-all duration-150 ${isSelected
                  ? "border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-100/50 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                  }`}
              >
                <input
                  type="radio"
                  name="sort"
                  value={value}
                  checked={isSelected}
                  onChange={() => onSortChange(value)}
                  className="sr-only"
                />
                <span
                  className={`text-sm font-medium transition-colors ${isSelected
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
                    }`}
                >
                  {label}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${isSelected
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-900"
                    : "border-slate-300 bg-white text-transparent group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900"
                    }`}
                >
                  <Check size={14} strokeWidth={3} />
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* FILTER: GPS GEOLOCATION */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-md dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.productListingLocationGPS || "Tìm gần đây (GPS)"}
          </h3>
        </div>
        
        <div className="space-y-3">
          <button
            type="button"
            onClick={onGetLocation}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all duration-150 ${userLocation
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <MapPin size={14} className={userLocation ? "animate-bounce text-emerald-500" : "text-slate-400"} />
            <span>
              {userLocation 
                ? `${t.productListingGPSActive || "Đã định vị"} (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})` 
                : t.productListingGPSBtn || "Lấy vị trí hiện tại"
              }
            </span>
          </button>

          {userLocation && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>{t.productListingRadius || "Bán kính tìm kiếm"}</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 dark:bg-slate-700 dark:accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER: CALENDAR AVAILABILITY */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-md dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.productListingAvailability || "Lịch trống để thuê"}
          </h3>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.productListingStartDate || "Ngày bắt đầu"}
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
            />
          </label>

          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.productListingEndDate || "Ngày kết thúc"}
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
            />
          </label>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                onStartDateChange("");
                onEndDateChange("");
              }}
              className="w-full text-center text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-350"
            >
              {t.productListingClearDates || "Xóa chọn ngày"}
            </button>
          )}
        </div>
      </div>

      {/* FILTER: PRICE */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-md dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.productListingPriceRange}
          </h3>
          <button
            type="button"
            onClick={onResetPrice}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
          >
            {t.productListingClearPrice}
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.productListingMinPrice}
            <input
              type="number"
              min={0}
              step={10000}
              inputMode="numeric"
              value={minPriceInput}
              onChange={(e) => onMinChange(e.target.value)}
              placeholder={String(dataMinPriceVnd)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
            />
          </label>

          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.productListingMaxPrice}
            <input
              type="number"
              min={0}
              step={10000}
              inputMode="numeric"
              value={maxPriceInput}
              onChange={(e) => onMaxChange(e.target.value)}
              placeholder={String(dataMaxPriceVnd)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="space-y-4">
        <div className="aspect-[5/6] w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export function ProductListingPage({
  onProductClick,
  onBack,
}: ProductListingPageProps) {
  const { t, lang } = useI18n();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [category, setCategory] = useState<CategoryKey>(() => {
    const cat = searchParams.get("category") as CategoryKey | null;
    if (cat && ["all", "electronics", "travel", "study", "lifestyle"].includes(cat)) {
      return cat;
    }
    return "all";
  });

  useEffect(() => {
    const cat = searchParams.get("category") as CategoryKey | null;
    if (cat && ["all", "electronics", "travel", "study", "lifestyle"].includes(cat)) {
      setCategory(cat);
    } else {
      setCategory("all");
    }
  }, [searchParams]);
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // --- STATE LƯU ID CÁC SẢN PHẨM ĐÃ THÍCH ---
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const initializedPriceRef = useRef(false);

  const deferredMinPrice = useDeferredValue(minPriceInput);
  const deferredMaxPrice = useDeferredValue(maxPriceInput);
  const deferredRadius = useDeferredValue(radiusKm);

  // --- LẤY DANH SÁCH YÊU THÍCH KHI TRANG TẢI XONG ---
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const favProducts = await profileService.getFavorites();
        setFavoriteIds(favProducts.map(p => String(p._id || p.id)));
      } catch (e) {
        console.log("Chưa đăng nhập hoặc lỗi tải wishlist");
      }
    };
    fetchFavorites();
  }, []);

  // --- HÀM XỬ LÝ KHI BẤM NÚT TRÁI TIM ---
  const handleToggleHeart = async (productId: string | number) => {
    try {
      const res = await profileService.toggleFavorite(String(productId));
      if (res.isWishlisted) {
        setFavoriteIds(prev => [...prev, String(productId)]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== String(productId)));
      }
    } catch (error) {
      alert("Vui lòng đăng nhập để lưu sản phẩm yêu thích!");
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Lỗi lấy vị trí: ", error);
          alert("Không thể lấy vị trí. Vui lòng cấp quyền trong trình duyệt.");
        }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị.");
    }
  };

  useEffect(() => {
    if (!showFilters) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [showFilters]);

  useEffect(() => {
    let active = true;
    setHasFetched(false);
    initializedPriceRef.current = false;

    async function loadProducts() {
      try {
        setIsLoading(true);

        let categoryParam: string | undefined;
        if (category === "electronics") categoryParam = "Điện tử & Công nghệ";
        else if (category === "travel") categoryParam = "Du lịch & Dã ngoại";
        else if (category === "study") categoryParam = "Đồ dùng học tập";
        else if (category === "lifestyle") categoryParam = "Thời trang & Đời sống";

        const fetched = await productService.getProducts({
          category: categoryParam,
          q: searchQuery || undefined,
          limit: 50,
          minPrice: deferredMinPrice ? Number(deferredMinPrice) : undefined,
          maxPrice: deferredMaxPrice ? Number(deferredMaxPrice) : undefined,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radiusInKm: userLocation ? deferredRadius : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        if (!active) return;
        setProducts(fetched);
        setHasFetched(true);
      } catch (error) {
        console.error("Failed to load products:", error);
        if (!active) return;
        setProducts([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProducts();
    return () => { active = false; };
  }, [category, deferredMinPrice, deferredMaxPrice, userLocation, deferredRadius, startDate, endDate, searchQuery]);

  const activeProducts = useMemo(() => {
    if (products.length > 0) return products;
    return products.filter((product: Product) => ACTIVE_STATUSES.has(product.status));
  }, [products]);

  const { dataMinPriceVnd, dataMaxPriceVnd } = useMemo(() => {
    const prices = activeProducts.map((product: Product) => toVnd(product.price));
    if (prices.length === 0) return { dataMinPriceVnd: 0, dataMaxPriceVnd: 0 };
    return { dataMinPriceVnd: Math.min(...prices), dataMaxPriceVnd: Math.max(...prices) };
  }, [activeProducts]);

  useEffect(() => {
    if (!hasFetched) return;
    if (initializedPriceRef.current) return;
    setMinPriceInput(String(dataMinPriceVnd));
    setMaxPriceInput(String(dataMaxPriceVnd));
    initializedPriceRef.current = true;
  }, [hasFetched, dataMinPriceVnd, dataMaxPriceVnd]);

  const resetPriceRange = useCallback(() => {
    setMinPriceInput(String(dataMinPriceVnd));
    setMaxPriceInput(String(dataMaxPriceVnd));
  }, [dataMinPriceVnd, dataMaxPriceVnd]);

  const categories = [
    { id: "all" as const, label: t.productListingCatAll, icon: House },
    { id: "electronics" as const, label: t.productListingCatElectronics, icon: Laptop },
    { id: "travel" as const, label: t.productListingCatTravel, icon: Tent },
    { id: "study" as const, label: t.productListingCatStudy, icon: BookOpen },
    { id: "lifestyle" as const, label: t.productListingCatLifestyle, icon: Shirt },
  ];

  const sortOptions = [
    { value: "latest" as const, label: t.productListingLatest },
    { value: "price-low" as const, label: t.productListingPriceLow },
    { value: "price-high" as const, label: t.productListingPriceHigh },
  ];

  const sortedProducts = useMemo(() => {
    const sorted = [...activeProducts];
    sorted.sort((a, b) => {
      if (sortBy === "price-low") return toVnd(a.price) - toVnd(b.price);
      if (sortBy === "price-high") return toVnd(b.price) - toVnd(a.price);
      return 0;
    });
    return sorted;
  }, [activeProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));

  useEffect(() => { setCurrentPage(1); }, [category, sortBy, deferredMinPrice, deferredMaxPrice, startDate, endDate, deferredRadius]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  const visiblePageItems = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages: Array<number | string> = [1];
    if (currentPage > 3) pages.push("left-ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (currentPage < totalPages - 2) pages.push("right-ellipsis");
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="relative rounded-3xl bg-slate-50/80 dark:bg-slate-900/40 lg:-mx-[2.5%] lg:w-[105%]">
      <div className="mx-auto px-2 pb-4 sm:px-4 lg:px-8 lg:pb-6">
        <div className="sticky top-28 z-30 mb-4 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-lg backdrop-blur-sm transition-all dark:border-slate-700/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Go back"
              className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pr-1">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active = category === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCategory(item.id)}
                      aria-pressed={active}
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-all duration-150 ${active
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900"
                        : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        }`}
                    >
                      <Icon size={13} className="opacity-90" />
                      <span className="text-[10px] sm:text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowFilters(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 lg:hidden"
              >
                <Sliders size={13} />
                <span>{t.productListingViewFilters}</span>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowFilters(false)} />
            <div role="dialog" aria-modal="true" className="relative z-10 flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.productListingViewFilters}</h3>
                <button onClick={() => setShowFilters(false)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1">
                <FilterPanel
                  sortBy={sortBy}
                  sortOptions={sortOptions}
                  onSortChange={setSortBy}
                  minPriceInput={minPriceInput}
                  maxPriceInput={maxPriceInput}
                  onMinChange={setMinPriceInput}
                  onMaxChange={setMaxPriceInput}
                  onResetPrice={resetPriceRange}
                  dataMinPriceVnd={dataMinPriceVnd}
                  dataMaxPriceVnd={dataMaxPriceVnd}
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  userLocation={userLocation}
                  onGetLocation={handleGetLocation}
                  radiusKm={radiusKm}
                  onRadiusChange={setRadiusKm}
                  t={t}
                />
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="mt-5 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all duration-150 hover:bg-teal-700 active:scale-[0.98]"
              >
                {t.productListingShowResults}
              </button>
            </div>
          </div>
        )}

        <div className="flex min-h-[80vh] flex-col gap-6 lg:flex-row">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-48">
              <FilterPanel
                sortBy={sortBy}
                sortOptions={sortOptions}
                onSortChange={setSortBy}
                minPriceInput={minPriceInput}
                maxPriceInput={maxPriceInput}
                onMinChange={setMinPriceInput}
                onMaxChange={setMaxPriceInput}
                onResetPrice={resetPriceRange}
                dataMinPriceVnd={dataMinPriceVnd}
                dataMaxPriceVnd={dataMaxPriceVnd}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                userLocation={userLocation}
                onGetLocation={handleGetLocation}
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                t={t}
              />
            </div>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {paginatedProducts.map((product) => {
                    const meta = buildProductMeta(product, userLocation);
                    const location = lang === "vi" ? meta.locationVi : meta.locationEn;
                    const conditionLabel = lang === "vi" ? meta.conditionVi : meta.conditionEn;

                    return (
                      <ProductCard
                        key={product._id || product.id}
                        product={product}
                        onSelect={onProductClick}
                        dayUnit={lang === "vi" ? "ngày" : "day"}
                        priceVnd={toVnd(product.price)}
                        location={location}
                        distanceKm={meta.distanceKm}
                        conditionLabel={conditionLabel}

                        // ĐÃ BẬT CÔNG TẮC TRÁI TIM Ở ĐÂY
                        isWishlisted={favoriteIds.includes(String(product._id || product.id))}
                        onToggleWishlist={handleToggleHeart}
                      />
                    );
                  })}
                </div>

                <div className="mt-10 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/70">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <ChevronLeft size={15} />
                      {t.productListingPrevious}
                    </button>

                    {visiblePageItems.map((item, index) => {
                      if (typeof item !== "number") {
                        return (
                          <span key={`${item}-${index}`} className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${currentPage === item
                            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                            }`}
                        >
                          {item}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {t.productListingNext}
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-96 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 bg-gradient-to-b from-white/80 to-slate-100/40 text-center dark:border-slate-700 dark:from-slate-800/35 dark:to-slate-900/35">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Search size={48} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">{t.productListingNoResult}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Hãy thử thay đổi điều kiện lọc</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}