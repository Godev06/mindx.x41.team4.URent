import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCTS } from "../../dataset/products";
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

type CategoryKey = "all" | "electronics" | "travel" | "study" | "lifestyle";

const toVnd = (price: number) => (price > 1000 ? price : price * 25_000);
const ACTIVE_STATUSES = new Set(["Available", "Active"]);

export function HomePage({ onProductClick }: HomePageProps) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        setIsLoading(true);
        const fetched = await productService.getProducts({ limit: 20 });
        if (active) {
          setProducts(fetched);
        }
      } catch (err) {
        console.error("Failed to load products in HomePage:", err);
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
  }, []);

  const activeProducts = useMemo(() => {
    return products.filter((product: Product) => ACTIVE_STATUSES.has(product.status ?? "Available"));
  }, [products]);

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
        productMeta={{}}
        onViewMore={() => navigate("/products")}
      />
    </div>
  );
}
