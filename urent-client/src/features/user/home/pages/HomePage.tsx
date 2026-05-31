import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../shared/types";
import { HeroIntro } from "../components/HeroIntro";
import { FeaturedProducts } from "../components/FeaturedProducts";
import { CategoryShowcase } from "../components/CategoryShowcase";
import { Stats } from "../components/Stats";
import { useI18n } from "../../shared/context/LanguageContext";
import { productService } from "../../product/services/productService";

interface HomePageProps {
  onProductClick: (id: string | number) => void;
}

const toVnd = (price: number) => (price > 1000 ? price : price * 25_000);
const ACTIVE_STATUSES = new Set(["Available", "Active"]);

export function HomePage({ onProductClick }: HomePageProps) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [dbStats, setDbStats] = useState<{ totalProducts: number; totalUsers: number; totalTransactions: number } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [fetchedProducts, fetchedStats] = await Promise.all([
          productService.getProducts({ limit: 20 }),
          productService.getPublicStats()
        ]);
        if (active) {
          setProducts(fetchedProducts);
          setDbStats(fetchedStats);
        }
      } catch (err) {
        console.error("Failed to load home page data:", err);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const activeProducts = useMemo(() => {
    return products.filter((product: Product) => ACTIVE_STATUSES.has(product.status ?? "Available"));
  }, [products]);

  return (
    <div className="space-y-8 sm:space-y-10">
      <HeroIntro lang={lang} />
      <Stats 
        lang={lang} 
        totalItems={dbStats?.totalProducts ?? activeProducts.length} 
        totalUsers={dbStats?.totalUsers ?? 5000}
        totalTransactions={dbStats?.totalTransactions ?? 0}
      />
      <CategoryShowcase
        lang={lang}
        onCategoryClick={(catId) => navigate(`/products?category=${catId}`)}
      />
      <FeaturedProducts
        products={activeProducts}
        onProductClick={onProductClick}
        lang={lang}
        dayUnit={lang === "vi" ? "/ ngày" : "/ day"}
        priceConverter={(p) => toVnd(p)}
        productMeta={{}}
        onViewMore={() => navigate("/products")}
      />
    </div>
  );
}
