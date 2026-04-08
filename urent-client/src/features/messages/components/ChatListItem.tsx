import type { Chat } from "../../shared/types";

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onSelect: (id: number) => void;
}

export function ChatListItem({ chat, selected, onSelect }: ChatListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(chat.id)}
      className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
        selected
          ? "bg-orange-50 ring-1 ring-orange-200/80"
          : "hover:bg-slate-50"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ring-2 ring-white ${
            selected ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-700"
          }`}
        >
          {chat.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`truncate text-sm font-semibold ${selected ? "text-teal-900" : "text-slate-900"}`}>{chat.name}</h4>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">{chat.time}</span>
          </div>
          <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500">{chat.message}</p>
        </div>
      </div>
    </button>
  );
}
