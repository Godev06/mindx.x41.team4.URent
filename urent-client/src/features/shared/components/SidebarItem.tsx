import type { SidebarItemProps } from "../types";

export function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl px-2 transition-all duration-200 ${
        active
          ? "bg-amber-50 text-amber-600 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)]"
          : "text-teal-700/75 hover:bg-teal-50 hover:text-amber-500"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.25 : 1.75} className="transition-transform group-active:scale-95" />
      <span className="text-[10px] font-medium tracking-wide leading-none">{label}</span>
    </button>
  );
}
