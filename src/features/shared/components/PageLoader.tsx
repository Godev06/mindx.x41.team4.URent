interface PageLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function PageLoader({
  label = "Dang tai du lieu...",
  fullScreen = false,
}: PageLoaderProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen" : "min-h-[240px]"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <span>{label}</span>
      </div>
    </div>
  );
}
