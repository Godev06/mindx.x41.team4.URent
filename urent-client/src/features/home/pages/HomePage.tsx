import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCTS } from "../../dataset/products";
import type { Product } from "../../shared/types";
import { HeroIntro } from "../components/HeroIntro";
import { FeaturedProducts } from "../components/FeaturedProducts";
import { CategoryShowcase } from "../components/CategoryShowcase";
import { Stats } from "../components/Stats";
import { useI18n } from "../../shared/context/LanguageContext";

interface HomePageProps {
  onProductClick: (id: number) => void;
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
};

const toVnd = (price: number) => price * 25_000;
const ACTIVE_STATUSES = new Set(["Available", "Active"]);

export function HomePage({ onProductClick }: HomePageProps) {
  const { lang } = useI18n();
  const navigate = useNavigate();

  const activeProducts = useMemo(
    () => PRODUCTS.filter((product: Product) => ACTIVE_STATUSES.has(product.status)),
    [],
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <HeroIntro lang={lang} />
      <Stats lang={lang} totalItems={activeProducts.length} />
      <CategoryShowcase
        lang={lang}
        onCategoryClick={() => navigate("/products")}
      />
      <FeaturedProducts
        products={activeProducts}
        onProductClick={onProductClick}
        lang={lang}
        dayUnit={lang === "vi" ? "/ ngày" : "/ day"}
        priceConverter={(p) => toVnd(p)}
        productMeta={PRODUCT_META}
        onViewMore={() => navigate("/products")}
      />
    </div>
  );
}
