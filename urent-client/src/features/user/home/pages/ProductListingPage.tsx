import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  House,
  Laptop,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { PRODUCTS } from "../../dataset/products";
import type { Product } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { useI18n } from "../../shared/context/LanguageContext";

interface ProductListingPageProps {
  onProductClick: (id: number) => void;
  onBack: () => void;
}

type CategoryKey = "all" | "electronics" | "textbooks" | "appliances";

interface ProductMeta {
  group: Exclude<CategoryKey, "all">;
  locationVi: string;
  locationEn: string;
  distanceKm: number;
  availableFrom: string;
  availableTo: string;
  conditionVi: string;
  conditionEn: string;
}

const PRODUCT_META: Record<number, ProductMeta> = {
  1: {
    group: "electronics",
    locationVi: "Thủ Đức",
    locationEn: "Thu Duc",
    distanceKm: 1.2,
    availableFrom: "2026-04-24",
    availableTo: "2026-06-24",
    conditionVi: "Như mới",
    conditionEn: "Like new",
  },
  2: {
    group: "electronics",
    locationVi: "Bình Thạnh",
    locationEn: "Binh Thanh",
    distanceKm: 2.8,
    availableFrom: "2026-04-25",
    availableTo: "2026-07-01",
    conditionVi: "Rất tốt",
    conditionEn: "Excellent",
  },
  3: {
    group: "electronics",
    locationVi: "Quận 3",
    locationEn: "District 3",
    distanceKm: 3.4,
    availableFrom: "2026-05-01",
    availableTo: "2026-06-12",
    conditionVi: "Tốt",
    conditionEn: "Good",
  },
  4: {
    group: "appliances",
    locationVi: "Quận 7",
    locationEn: "District 7",
    distanceKm: 4.5,
    availableFrom: "2026-04-23",
    availableTo: "2026-05-30",
    conditionVi: "Mới 90%",
    conditionEn: "90% new",
  },
  5: {
    group: "textbooks",
    locationVi: "Quận 1",
    locationEn: "District 1",
    distanceKm: 0.9,
    availableFrom: "2026-04-23",
    availableTo: "2026-12-31",
    conditionVi: "Rất tốt",
    conditionEn: "Excellent",
  },
  6: {
    group: "electronics",
    locationVi: "Phú Nhuận",
    locationEn: "Phu Nhuan",
    distanceKm: 2.1,
    availableFrom: "2026-04-25",
    availableTo: "2026-06-30",
    conditionVi: "Như mới",
    conditionEn: "Like new",
  },
  // Demo meta for ids 7-36
  ...Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => {
      const id = 9 + i;
      const groupList = ["electronics", "appliances", "textbooks"];
      const group = groupList[i % groupList.length] as Exclude<
        CategoryKey,
        "all"
      >;
      return [
        id,
        {
          group,
          locationVi: `Quận ${(i % 12) + 1}`,
          locationEn: `District ${(i % 12) + 1}`,
          distanceKm: 0.5 + (i % 10) * 0.7,
          availableFrom: `2026-05-${String((i % 28) + 1).padStart(2, "0")}`,
          availableTo: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`,
          conditionVi: ["Như mới", "Rất tốt", "Tốt"][i % 3],
          conditionEn: ["Like new", "Excellent", "Good"][i % 3],
        },
      ];
    }),
  ),
};

const toVnd = (price: number) => price * 25_000;
const ACTIVE_STATUSES = new Set(["Available", "Active"]);
const ITEMS_PER_PAGE = 10;
const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);

export function ProductListingPage({
  onProductClick,
  onBack,
}: ProductListingPageProps) {
  const { t, lang } = useI18n();
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sortBy, setSortBy] = useState<"latest" | "price-low" | "price-high">(
    "latest",
  );
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const activeProducts = useMemo(
    () =>
      PRODUCTS.filter((product: Product) =>
        ACTIVE_STATUSES.has(product.status),
      ),
    [],
  );

  const { dataMinPriceVnd, dataMaxPriceVnd } = useMemo(() => {
    const prices = activeProducts.map((product: Product) =>
      toVnd(product.price),
    );
    if (prices.length === 0) {
      return { dataMinPriceVnd: 0, dataMaxPriceVnd: 0 };
    }

    return {
      dataMinPriceVnd: Math.min(...prices),
      dataMaxPriceVnd: Math.max(...prices),
    };
  }, [activeProducts]);

  useEffect(() => {
    setMinPriceInput(String(dataMinPriceVnd));
    setMaxPriceInput(String(dataMaxPriceVnd));
  }, [dataMinPriceVnd, dataMaxPriceVnd]);

  const categories = [
    { id: "all" as const, label: t.productListingCatAll, icon: House },
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

  const filteredAndSortedProducts = useMemo(() => {
    const minPrice = Number(minPriceInput);
    const maxPrice = Number(maxPriceInput);
    const hasMinPrice = Number.isFinite(minPrice) && minPrice >= 0;
    const hasMaxPrice = Number.isFinite(maxPrice) && maxPrice >= 0;
    const effectiveMinPrice = hasMinPrice ? minPrice : dataMinPriceVnd;
    const effectiveMaxPrice = hasMaxPrice ? maxPrice : dataMaxPriceVnd;

    let result = activeProducts.filter((product: Product) => {
      const meta = PRODUCT_META[product.id];
      if (!meta) {
        return false;
      }

      const productPriceVnd = toVnd(product.price);
      const matchesCategory = category === "all" || meta.group === category;
      const matchesMinPrice = productPriceVnd >= effectiveMinPrice;
      const matchesMaxPrice = productPriceVnd <= effectiveMaxPrice;

      return matchesCategory && matchesMinPrice && matchesMaxPrice;
    });

    // Sort
    result.sort((a: Product, b: Product) => {
      if (sortBy === "price-low") {
        return a.price - b.price;
      } else if (sortBy === "price-high") {
        return b.price - a.price;
      }
      return 0; // latest
    });

    return result;
  }, [
    activeProducts,
    category,
    sortBy,
    minPriceInput,
    maxPriceInput,
    dataMinPriceVnd,
    dataMaxPriceVnd,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [currentPage, filteredAndSortedProducts]);

  const visiblePageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];

    if (currentPage > 3) {
      pages.push("ellipsis-left");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-right");
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, sortBy, minPriceInput, maxPriceInput]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const sortOptions = [
    { value: "latest", label: t.productListingLatest },
    { value: "price-low", label: t.productListingPriceLow },
    { value: "price-high", label: t.productListingPriceHigh },
  ] as const;

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="relative rounded-3xl bg-slate-50/80 lg:-mx-[2.5%] lg:w-[105%] dark:bg-slate-900/40">
      <div className="-mt-1 mx-auto px-2 sm:px-4 pt-0 pb-3 sm:pb-4 md:pb-5 lg:px-8 lg:pb-6">
        <div className="sticky top-28 z-30 mb-3 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 sm:p-2 md:p-2 lg:p-3 shadow-lg backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/80 transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onBack}
              className="group inline-flex h-9 sm:h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Go back"
            >
              <ChevronLeft
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            </button>

            <div className="ml-auto flex min-w-0 max-w-[calc(100%-2.5rem)] items-center gap-1.5 sm:gap-2">
              <div className="no-scrollbar flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2 overflow-x-auto pr-1">
                {categories.map((item) => {
                  const Icon = item.icon;
                  const active = category === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCategory(item.id)}
                      className={`inline-flex h-8 sm:h-9 shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-semibold transition-all duration-150 ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900"
                          : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Icon size={13} className="shrink-0 opacity-90" />
                      <span className="leading-none hidden sm:inline">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex h-9 sm:h-10 shrink-0 items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-semibold text-slate-700 transition hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)" }}
              >
                <Sliders size={13} />
                <span className="hidden sm:inline">
                  {t.productListingViewFilters}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-5 min-h-[80vh]">
          <div className="grid gap-6 md:gap-8">
            <div className="sticky top-48 self-start" style={{ minWidth: 220 }}>
              <div className="space-y-4 md:space-y-5 lg:space-y-6">
                {/* Sort Section */}
                <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-3 sm:p-4 shadow-md backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="mb-3 sm:mb-3.5 flex items-center gap-2">
                    <ArrowUpDown
                      size={16}
                      className="text-slate-600 dark:text-slate-400"
                    />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t.productListingSortBy}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {sortOptions.map(({ value, label }) => {
                      const isSelected = sortBy === value;
                      return (
                        <label
                          key={value}
                          className={`group flex gap-2 cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 transition-all duration-150 ${
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
                            onChange={() => setSortBy(value)}
                            className="peer sr-only"
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
                            aria-hidden="true"
                          >
                            <Check size={14} strokeWidth={3} className="" />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {/* Price Range Section */}
                <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-3 sm:p-4 shadow-md dark:border-slate-700/60 dark:bg-slate-900/80">
                  <div className="mb-3 sm:mb-3.5 flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t.productListingPriceRange}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPriceInput(String(dataMinPriceVnd));
                        setMaxPriceInput(String(dataMaxPriceVnd));
                      }}
                      className="text-[11px] sm:text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                    >
                      {t.productListingClearPrice}
                    </button>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t.productListingMinPrice}
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        inputMode="numeric"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        placeholder={String(dataMinPriceVnd)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-teal-400 focus:outline-hidden focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
                      />
                    </label>
                    <label className="block text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t.productListingMaxPrice}
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        inputMode="numeric"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        placeholder={String(dataMaxPriceVnd)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white/90 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-teal-400 focus:outline-hidden focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/20"
                      />
                    </label>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                      {t.productListingDefaultPriceRange}:{" "}
                      {formatCompactNumber(dataMinPriceVnd)} -{" "}
                      {formatCompactNumber(dataMaxPriceVnd)} VND
                    </p>
                  </div>
                </div>
              </div>
              {/* Close filters button on mobile */}
              {showFilters && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-700"
                >
                  {t.productListingShowResults}
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-4">
            {filteredAndSortedProducts.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-5">
                  {paginatedProducts.map((product: Product) => {
                    const meta = PRODUCT_META[product.id];
                    const location =
                      lang === "vi" ? meta.locationVi : meta.locationEn;
                    const conditionLabel =
                      lang === "vi" ? meta.conditionVi : meta.conditionEn;
                    return (
                      <ProductCard
                        key={product.id}
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
                <div className="mt-6 md:mt-8 lg:mt-10 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/70">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {t.productListingNext}
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
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
