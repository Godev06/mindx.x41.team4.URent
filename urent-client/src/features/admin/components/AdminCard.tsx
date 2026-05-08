import type { ReactNode } from "react";

interface Props {
  title: string;
  value: number;
  children?: ReactNode;
}

export function AdminCard({ title, value, children }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-5 transition hover:scale-[1.03] hover:border-teal-500/30">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>

      {children && (
        <div className="mt-2 text-sm text-slate-400">{children}</div>
      )}
    </div>
  );
}
