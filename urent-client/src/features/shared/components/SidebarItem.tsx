import type { SidebarItemProps } from "../types";

export function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-4 transition-all ${active ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}
