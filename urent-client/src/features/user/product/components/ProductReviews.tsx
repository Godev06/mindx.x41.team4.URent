import { useState } from "react";
import { CheckCircle2, Star, ThumbsUp } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";

interface Review {
  id: number;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  helpful: number;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    author: "Minh Tuấn",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    rating: 5,
    date: "12 tháng 4, 2026",
    text: "Thiết bị rất tốt, đúng như mô tả. Chủ thiết bị phản hồi nhanh và hỗ trợ nhiệt tình. Sẽ thuê lại lần sau!",
    verified: true,
    helpful: 8,
  },
  {
    id: 2,
    author: "Lan Anh",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    rating: 4,
    date: "2 tháng 4, 2026",
    text: "Chất lượng ổn, giao nhận đúng hẹn. Có thể cải thiện thêm phụ kiện đi kèm.",
    verified: true,
    helpful: 3,
  },
  {
    id: 3,
    author: "Hải Đăng",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    rating: 5,
    date: "20 tháng 3, 2026",
    text: "Rất hài lòng. Thiết bị sạch sẽ, hoạt động hoàn hảo suốt thời gian thuê.",
    verified: false,
    helpful: 5,
  },
];

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
  productId: number;
  rating?: number;
  reviews?: number;
}

export function ProductReviews({
  rating = 4.9,
  reviews = 0,
}: ProductReviewsProps) {
  const { t } = useI18n();
  const [allReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const totalCount = reviews > 0 ? reviews : allReviews.length;
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach((r) => {
    dist[r.rating] = (dist[r.rating] ?? 0) + 1;
  });

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
                {rating.toFixed(1)}
              </span>
              <StarRating value={Math.round(rating)} size={16} />
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
            {t.productDetailReviewsEmpty}
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
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
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
