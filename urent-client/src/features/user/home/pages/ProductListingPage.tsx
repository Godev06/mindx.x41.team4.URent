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
} from "lucide-react";

import { PRODUCTS } from "../../dataset/products";
import type { Product } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { useI18n } from "../../shared/context/LanguageContext";
import { productService } from "../../product/services/productService";

interface ProductListingPageProps {
  onProductClick: (id: string | number) => void;
  onBack: () => void;
}

type CategoryKey = "all" | "electronics" | "textbooks" | "appliances";
type SortType = "latest" | "price-low" | "price-high";

interface ProductMeta {
  locationVi: string;
  locationEn: string;
  distanceKm: number;
  conditionVi: string;
  conditionEn: string;
}

const ACTIVE_STATUSES = new Set(["Available", "Active"]);
const ITEMS_PER_PAGE = 10;
const SKELETON_COUNT = ITEMS_PER_PAGE;

const toVnd = (price: number) => (price > 1000 ? price : price * 25_000);

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(value);

function buildProductMeta(product: Product): ProductMeta {
  return {
    locationVi: product.location || "Chưa cập nhật",
    locationEn: product.location || "Unknown",
    distanceKm: 1.5,
    conditionVi: product.condition || "Tốt",
    conditionEn: product.condition || "Good",
  };
}

function normalizeCategory(category?: string): Exclude<CategoryKey, "all"> {
  const normalized = category?.toLowerCase();

  if (normalized === "textbooks") return "textbooks";
  if (normalized === "appliances") return "appliances";

  return "electronics";
}

interface FilterPanelProps {
  sortBy: SortType;
  sortOptions: readonly {
    value: SortType;
    label: string;
  }[];
  onSortChange: (value: SortType) => void;
  minPriceInput: string;
  maxPriceInput: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onResetPrice: () => void;
  dataMinPriceVnd: number;
  dataMaxPriceVnd: number;
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
  t,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-md backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="mb-3 flex items-center gap-2">
          <ArrowUpDown
            size={16}
            className="text-slate-600 dark:text-slate-400"
          />

          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.productListingSortBy}
          </h3>
        </div>

        <div className="space-y-2">
          {sortOptions.map(({ value, label }) => {
            const isSelected = sortBy === value;

            return (
              <label
                key={value}
                className={`group flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 transition-all duration-150 ${
                  isSelected
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
                  className={`text-sm font-medium transition-colors ${
                    isSelected
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
                  }`}
                >
                  {label}
                </span>

                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                    isSelected
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
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-hidden focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
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
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-hidden focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
            />
          </label>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.productListingDefaultPriceRange}:{" "}
            {formatCompactNumber(dataMinPriceVnd)} -{" "}
            {formatCompactNumber(dataMaxPriceVnd)} VND
          </p>
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

  const [category, setCategory] = useState<CategoryKey>("all");
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const initializedPriceRef = useRef(false);

  const deferredMinPrice = useDeferredValue(minPriceInput);
  const deferredMaxPrice = useDeferredValue(maxPriceInput);

  useEffect(() => {
    if (!showFilters) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showFilters]);

  useEffect(() => {
    let active = true;
    setHasFetched(false);
    initializedPriceRef.current = false;

    async function loadProducts() {
      try {
        setIsLoading(true);

        let categoryParam: string | undefined;

        if (category === "electronics") {
          categoryParam = "Electronics";
        } else if (category === "textbooks") {
          categoryParam = "Textbooks";
        } else if (category === "appliances") {
          categoryParam = "Appliances";
        }

        const fetched = await productService.getProducts({
          category: categoryParam,
          limit: 50,
        });

        if (!active) return;

        setProducts(fetched);
        setHasFetched(true);
      } catch (error) {
        console.error("Failed to load products:", error);

        if (!active) return;

        setProducts([]);
        setHasFetched(true);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [category]);

  const activeProducts = useMemo(() => {
    if (hasFetched) {
      return products;
    }

    return PRODUCTS.filter((product) => ACTIVE_STATUSES.has(product.status));
  }, [products, hasFetched]);

  const { dataMinPriceVnd, dataMaxPriceVnd } = useMemo(() => {
    const prices = activeProducts.map((product) => toVnd(product.price));

    if (prices.length === 0) {
      return {
        dataMinPriceVnd: 0,
        dataMaxPriceVnd: 0,
      };
    }

    return {
      dataMinPriceVnd: Math.min(...prices),
      dataMaxPriceVnd: Math.max(...prices),
    };
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
    {
      id: "all" as const,
      label: t.productListingCatAll,
      icon: House,
    },
    {
      id: "electronics" as const,
      label: t.productListingCatElectronics,
      icon: Laptop,
    },
    {
      id: "textbooks" as const,
      label: t.productListingCatTextbooks,
      icon: BookOpen,
    },
    {
      id: "appliances" as const,
      label: t.productListingCatAppliances,
      icon: House,
    },
  ];

  const sortOptions = [
    {
      value: "latest" as const,
      label: t.productListingLatest,
    },
    {
      value: "price-low" as const,
      label: t.productListingPriceLow,
    },
    {
      value: "price-high" as const,
      label: t.productListingPriceHigh,
    },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    const minPrice = Number(deferredMinPrice);
    const maxPrice = Number(deferredMaxPrice);

    const effectiveMinPrice = Number.isFinite(minPrice)
      ? minPrice
      : dataMinPriceVnd;

    const effectiveMaxPrice = Number.isFinite(maxPrice)
      ? maxPrice
      : dataMaxPriceVnd;

    const filtered = activeProducts.filter((product) => {
      const normalizedCategory = normalizeCategory(product.category);

      const matchesCategory =
        category === "all" || normalizedCategory === category;

      const priceVnd = toVnd(product.price);

      return (
        matchesCategory &&
        priceVnd >= effectiveMinPrice &&
        priceVnd <= effectiveMaxPrice
      );
    });

    filtered.sort((a, b) => {
      if (sortBy === "price-low") {
        return toVnd(a.price) - toVnd(b.price);
      }

      if (sortBy === "price-high") {
        return toVnd(b.price) - toVnd(a.price);
      }

      return 0;
    });

    return filtered;
  }, [
    activeProducts,
    category,
    sortBy,
    deferredMinPrice,
    deferredMaxPrice,
    dataMinPriceVnd,
    dataMaxPriceVnd,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [category, sortBy, deferredMinPrice, deferredMaxPrice]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredAndSortedProducts, currentPage]);

  const visiblePageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | string> = [1];

    if (currentPage > 3) {
      pages.push("left-ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (currentPage < totalPages - 2) {
      pages.push("right-ellipsis");
    }

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
              <ChevronLeft
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
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
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-all duration-150 ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900"
                          : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Icon size={13} className="opacity-90" />

                      <span className="hidden sm:inline">{item.label}</span>
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
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setShowFilters(false)}
            />

            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.productListingViewFilters}
                </h3>

                <button
                  aria-label="Close filters"
                  onClick={() => setShowFilters(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-400"
                >
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
            ) : filteredAndSortedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {paginatedProducts.map((product) => {
                    const meta = buildProductMeta(product);

                    const location =
                      lang === "vi" ? meta.locationVi : meta.locationEn;

                    const conditionLabel =
                      lang === "vi" ? meta.conditionVi : meta.conditionEn;

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
                      />
                    );
                  })}
                </div>

                <div className="mt-10 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/70">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <ChevronLeft size={15} />
                      {t.productListingPrevious}
                    </button>

                    {visiblePageItems.map((item, index) => {
                      if (typeof item !== "number") {
                        return (
                          <span
                            key={`${item}-${index}`}
                            className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-xs font-semibold text-slate-400 dark:text-slate-500"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                            currentPage === item
                              ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30"
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {t.productListingNext}
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-96 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 bg-linear-to-b from-white/80 to-slate-100/40 text-center dark:border-slate-700 dark:from-slate-800/35 dark:to-slate-900/35">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Search
                      size={48}
                      className="text-slate-300 dark:text-slate-600"
                    />
                  </div>

                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-400">
                      {t.productListingNoResult}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                      Try adjusting your filters
                    </p>
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
