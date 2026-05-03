import { useState, useEffect } from "react";
import { BellOff, Edit3 } from "lucide-react";
import type { ApiConversation } from "../types";
import { getAvatarStyle } from "../../shared/utils/avatar";
import {
  CONVERSATION_PREFERENCE_CHANGED_EVENT,
  getConversationPreference,
  type ConversationPreference,
} from "../utils/conversationPreferences";

interface ChatListItemProps {
  conversation: ApiConversation;
  selected: boolean;
  onSelect: (id: string) => void;
  searchTerm?: string;
}

export function ChatListItem({
  conversation,
  selected,
  onSelect,
  searchTerm,
}: ChatListItemProps) {
  const [conversationPreference, setConversationPreference] =
    useState<ConversationPreference>(() =>
      getConversationPreference(conversation.id),
    );
  const [draftMessage, setDraftMessage] = useState<string>(() => {
    return localStorage.getItem(`message_draft_${conversation.id}`) || "";
  });

  const otherParticipant = conversation.participants[0];
  const baseDisplayName =
    otherParticipant?.displayName ?? otherParticipant?.email ?? "Unknown";
  const displayName = conversationPreference.alias?.trim() || baseDisplayName;

  useEffect(() => {
    const handleDraftChange = (event: CustomEvent) => {
      const { chatId, message } = event.detail;
      if (chatId === conversation.id) {
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
  }, [conversation.id]);

  useEffect(() => {
    const handleConversationPreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string;
        preference: ConversationPreference;
      }>;

      if (customEvent.detail.conversationId === conversation.id) {
        setConversationPreference(customEvent.detail.preference);
      }
    };

    window.addEventListener(
      CONVERSATION_PREFERENCE_CHANGED_EVENT,
      handleConversationPreferenceChange,
    );

    return () => {
      window.removeEventListener(
        CONVERSATION_PREFERENCE_CHANGED_EVENT,
        handleConversationPreferenceChange,
      );
    };
  }, [conversation.id]);

  const handleClick = () => {
    onSelect(conversation.id);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
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
          const avatarUrl = otherParticipant?.avatarUrl;
          const { initials, colorClass } = getAvatarStyle(displayName);
          const isUrl =
            !!avatarUrl &&
            /^(https?:\/\/|\/)?.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(
              avatarUrl,
            );
          return isUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
            />
          ) : (
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
                    ? "font-bold text-slate-900 dark:text-slate-100"
                    : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {highlightText(displayName, searchTerm || "")}
            </h4>
            <div className="flex shrink-0 items-center gap-1.5">
              {conversationPreference.muted ? (
                <BellOff
                  size={12}
                  className="text-slate-400 dark:text-slate-500"
                />
              ) : null}
              {conversation.unreadCount > 0 && !draftMessage && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                  {conversation.unreadCount > 99
                    ? "99+"
                    : conversation.unreadCount}
                </span>
              )}
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  draftMessage
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {draftMessage
                  ? "CHƯA GỬI"
                  : formatTime(conversation.lastMessageAt)}
              </span>
            </div>
          </div>
          <p className="mt-0.5 truncate text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {draftMessage ? (
              <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
                <Edit3 size={10} />
                bản nháp: {highlightText(draftMessage, searchTerm || "")}
              </span>
            ) : (
              highlightText(conversation.lastMessage ?? "", searchTerm || "")
            )}
          </p>
        </div>
      </div>
    </button>
  );
}
