export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-teal-600/20 bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 p-8 text-white shadow-xl shadow-teal-900/15 md:p-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl" />

      <div className="relative z-10 max-w-xl">
        <span className="mb-4 inline-flex items-center rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-100 ring-1 ring-amber-300/25">
          U-Rent Exclusive
        </span>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.35rem] md:leading-[1.15]">
          Thuê thiết bị công nghệ — linh hoạt, minh bạch, giá hợp lý.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
          Không cần mua mới: thuê theo ngày hoặc tuần, giao nhận nhanh và thanh toán an toàn.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur-sm">
            ✓ Xác minh người cho thuê
          </span>
          <span className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur-sm">
            ✓ Hỗ trợ 7 ngày/tuần
          </span>
        </div>
      </div>
    </div>
  );
}
