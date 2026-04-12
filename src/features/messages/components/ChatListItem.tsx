import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3 } from "lucide-react";
import type { Chat, Message } from "../../shared/types";
import { getAvatarStyle } from "../../shared/utils/avatar";

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onSelect: (id: number) => void;
  searchTerm?: string;
  messages?: Message[];
}

export function ChatListItem({
  chat,
  selected,
  onSelect,
  searchTerm,
  messages = [],
}: ChatListItemProps) {
  const navigate = useNavigate();
  const [draftMessage, setDraftMessage] = useState<string>(() => {
    return localStorage.getItem(`message_draft_${chat.id}`) || "";
  });

  // Get the latest message from others (not from user)
  const latestMessage = messages
    .filter(
      (message) => message.chatId === chat.id && message.sender !== "user",
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];

  useEffect(() => {
    const handleDraftChange = (event: CustomEvent) => {
      const { chatId, message } = event.detail;
      if (chatId === chat.id) {
        setDraftMessage(message);
      }
    };

    window.addEventListener(
      "draftMessageChanged",
      handleDraftChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "draftMessageChanged",
        handleDraftChange as EventListener,
      );
    };
  }, [chat.id]);

  const handleClick = () => {
    onSelect(chat.id);
    navigate(`/messages/${chat.id}`);
  };

  // Function to highlight search term
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-slate-900">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
        selected
          ? "bg-teal-50 ring-1 ring-teal-200/90 dark:bg-teal-500/12 dark:ring-teal-400/30"
          : "hover:bg-teal-50/70 dark:hover:bg-teal-500/10"
      }`}
    >
      <div className="flex gap-3">
        {(() => {
          const { initials, colorClass } = getAvatarStyle(chat.name);
          return (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white dark:ring-slate-800 ${colorClass}`}
            >
              {initials}
            </div>
          );
        })()}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`truncate text-sm font-semibold ${
                selected
                  ? "text-teal-900 dark:text-teal-300"
                  : draftMessage
                    ? "text-slate-900 dark:text-slate-100 font-bold"
                    : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {highlightText(chat.name, searchTerm || "")}
            </h4>
            <span
              className={`shrink-0 text-[10px] font-medium uppercase tracking-wide ${
                draftMessage
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {draftMessage
                ? "CHƯA GỬI"
                : latestMessage
                  ? new Date(latestMessage.timestamp).toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : chat.time}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {draftMessage ? (
              <span className="text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
                <Edit3 size={10} />
                bản nháp: {highlightText(draftMessage, searchTerm || "")}
              </span>
            ) : (
              highlightText(
                latestMessage?.content || chat.message,
                searchTerm || "",
              )
            )}
          </p>
        </div>
      </div>
    </button>
  );
}
