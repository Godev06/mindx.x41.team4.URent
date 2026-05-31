import { useState, useEffect } from "react";
import { CheckCircle2, Star, ThumbsUp } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { fetchReviewsByProduct } from "../../orders/services/reviewService";

interface Review {
  id: string | number;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  helpful: number;
}



function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          strokeWidth={1.5}
          className={
            s <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200 dark:fill-white/10 dark:text-white/10"
          }
        />
      ))}
    </div>
  );
}

interface RatingBarProps {
  star: number;
  count: number;
  total: number;
}

function RatingBar({ star, count, total }: RatingBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 shrink-0 text-right font-medium text-slate-500 dark:text-slate-400">
        {star}
      </span>
      <Star size={11} className="shrink-0 fill-amber-400 text-amber-400" />
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-slate-400 dark:text-slate-500">
        {count}
      </span>
    </div>
  );
}

interface ProductReviewsProps {
  productId?: string | number;
  rating?: number;
  reviews?: number;
}

export function ProductReviews({
  productId,
  rating = 4.9,
  reviews = 0,
}: ProductReviewsProps) {
  const { t } = useI18n();
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    async function loadReviews() {
      const isObjectId = typeof productId === "string" && productId.length === 24 && /^[0-9a-fA-F]+$/.test(productId);
      if (!productId || !isObjectId) {
        setAllReviews([]);
        return;
      }
      try {
        setIsLoading(true);
        const data = await fetchReviewsByProduct(String(productId));
        if (data && data.length > 0) {
          const mapped = data.map((r: any, idx: number) => ({
            id: r._id || idx,
            author: r.userId?.displayName || r.userId?.username || "Người dùng URent",
            avatar: r.userId?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${r._id || idx}`,
            rating: r.rating,
            date: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Mới đây",
            text: r.content,
            verified: true,
            helpful: 0,
          }));
          setAllReviews(mapped);
        } else {
          setAllReviews([]);
        }
      } catch (err) {
        console.error("Failed to load product reviews:", err);
        setAllReviews([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, [productId]);

  const totalCount = allReviews.length;
  // Calculate average rating dynamically from fetched reviews if database reviews exist
  const dynamicRating = totalCount > 0 
    ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1))
    : 0;

  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach((r) => {
    dist[r.rating] = (dist[r.rating] ?? 0) + 1;
  });

  const handleLike = (id: string | number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-pulse space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Đang tải đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Summary */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4">
        <div className="h-1.5 w-full bg-linear-to-r from-amber-400 via-orange-400 to-amber-500" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Overall score */}
            <div className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-white/6 dark:bg-white/4">
              <span className="text-5xl font-bold tabular-nums text-slate-900 dark:text-white">
                {dynamicRating.toFixed(1)}
              </span>
              <StarRating value={Math.round(dynamicRating)} size={16} />
              <span className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {totalCount} {t.productDetailReviewsCount}
              </span>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-2">
              <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
                {t.productDetailReviewsTitle}
              </h2>
              {[5, 4, 3, 2, 1].map((s) => (
                <RatingBar
                  key={s}
                  star={s}
                  count={dist[s] ?? 0}
                  total={allReviews.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {allReviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            {t.productDetailReviewsEmpty || "Chưa có đánh giá nào cho sản phẩm này."}
          </p>
        ) : (
          allReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 dark:border-white/8 dark:bg-[#101a2a] dark:ring-white/4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={review.avatar}
                  alt={review.author}
                  className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {review.author}
                      </span>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300">
                          <CheckCircle2 size={9} strokeWidth={2.5} />
                          {t.productDetailReviewsVerified}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {review.date}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <StarRating value={review.rating} />
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {review.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleLike(review.id)}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      likedIds.has(review.id)
                        ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:border-white/15 dark:hover:text-slate-200"
                    }`}
                  >
                    <ThumbsUp size={11} strokeWidth={2} />
                    {review.helpful + (likedIds.has(review.id) ? 1 : 0)}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
