import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  EllipsisVertical,
  MessageSquare,
  Package,
  MapPin,
  Plus,
  Search,
  Send,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { normalizeApiError } from "../../../../lib/api/apiError";
import type { ApiMessage, LocationMetadata, ProductMetadata } from "../types";
import { useTheme } from "../../settings/hooks/useTheme";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { ProductPicker } from "./ProductPicker";
import { LocationPicker } from "./LocationPicker";
import { useI18n } from "../../shared/context/LanguageContext";
import { AlertMessage } from "../../shared/components/AlertMessage";
import { EmptyState } from "../../shared/components/EmptyState";
import {
  useChatDrafts,
  useChatPreferences,
  useAutoresizeTextarea,
  useScrollToBottom,
} from "../hooks/useChatFeatures";

interface MessagesChatBoxProps {
  conversationName: string;
  baseConversationName: string;
  conversationId: string;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
  peerName?: string;
  peerAvatarUrl?: string | null;
  peerEmail?: string;
  isLoading?: boolean;
  isSearching?: boolean;
  errorMessage?: string | null;
  messages: ApiMessage[];
  searchedMessages?: ApiMessage[] | null;
  searchTerm: string;
  onBack?: () => void;
  onDeleteConversation: () => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onSendProduct: (productId: string, content?: string) => Promise<void>;
  onSendLocation: (lat: number, lng: number, address?: string) => Promise<void>;
}

// --- Memoized Child Component: Message Avatar ---
interface MessageAvatarProps {
  name: string;
  avatarUrl?: string | null;
}

const MessageAvatar = React.memo(function MessageAvatar({ name, avatarUrl }: MessageAvatarProps) {
  const { initials, colorClass } = getAvatarStyle(name);
  const isImageUrl = !!avatarUrl && /^(https?:\/\/|\/).+/.test(avatarUrl);

  if (isImageUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-teal-500/10 transition-transform duration-200 ease-out hover:scale-105"
      />
    );
  }

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-all duration-200 ease-out hover:scale-105 ${colorClass}`}
    >
      {initials}
    </div>
  );
});

// --- Helper: Highlight Searched Keyword ---
const highlightText = (text: string, keyword: string) => {
  if (!keyword.trim()) return text;

  try {
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedKeyword})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="rounded bg-yellow-200 px-0.5 font-medium text-slate-900 dark:bg-yellow-300">
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
};

// --- Memoized Child Component: Message Content Bubble ---
interface MessageContentProps {
  message: ApiMessage;
  searchTerm: string;
  theme: "dark" | "light";
  isMine: boolean;
}

const MessageContent = React.memo(function MessageContent({
  message,
  searchTerm,
  theme,
  isMine,
}: MessageContentProps) {
  if (message.messageType === "PRODUCT") {
    const meta = message.metadata as ProductMetadata | null;
    return (
      <div className="space-y-2">
        {message.content && (
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {highlightText(message.content, searchTerm)}
          </p>
        )}
        {meta?.snapshot && (
          <div
            className={`mt-1 flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 ease-out hover:brightness-95 active:scale-[0.99] ${
              isMine
                ? "border-teal-400/40 bg-teal-500/20 text-white"
                : theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <Package size={18} className="shrink-0 text-teal-500 dark:text-teal-400 opacity-90" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {meta.snapshot.name}
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {meta.snapshot.category} ·{" "}
                {meta.snapshot.pricePerDay.toLocaleString("vi-VN")}đ/ngày
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (message.messageType === "LOCATION") {
    const meta = message.metadata as LocationMetadata | null;
    const mapsUrl = meta
      ? `https://maps.google.com/?q=${meta.latitude},${meta.longitude}`
      : null;
    return (
      <div className="space-y-2">
        {message.content && (
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {highlightText(message.content, searchTerm)}
          </p>
        )}
        {meta && (
          <a
            href={mapsUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 ease-out hover:brightness-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
              isMine
                ? "border-teal-400/40 bg-teal-500/20 text-white"
                : theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <MapPin size={18} className="shrink-0 text-teal-500 dark:text-teal-400 opacity-90" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {meta.address ??
                  `${meta.latitude.toFixed(4)}, ${meta.longitude.toFixed(4)}`}
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">Nhấn để mở bản đồ</p>
            </div>
            <ExternalLink size={14} className="shrink-0 opacity-60" />
          </a>
        )}
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed text-sm">
      {highlightText(message.content ?? "", searchTerm)}
    </p>
  );
});

export function MessagesChatBox({
  conversationName,
  baseConversationName,
  conversationId,
  currentUserId,
  currentUserName = "You",
  currentUserAvatarUrl = null,
  peerName = "Unknown",
  peerAvatarUrl = null,
  peerEmail = "",
  isLoading = false,
  isSearching = false,
  errorMessage = null,
  messages,
  searchedMessages = null,
  searchTerm,
  onBack,
  onDeleteConversation,
  onSendMessage,
  onSendProduct,
  onSendLocation,
}: MessagesChatBoxProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  // State Management
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isConversationMenuOpen, setIsConversationMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // References for Dropdowns (Click Outside & Focus Traps)
  const conversationMenuRef = React.useRef<HTMLDivElement>(null);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);
  const convButtonRef = React.useRef<HTMLButtonElement>(null);
  const moreButtonRef = React.useRef<HTMLButtonElement>(null);

  // --- Clean Architectural Hook Integrations ---
  const { messageInput, handleInputChange, clearDraft } = useChatDrafts(conversationId);

  const defaultToastMsg = useMemo(
    () => ({
      muted: t.chatBoxConversationMuted ?? "Conversation muted",
      unmuted: t.chatBoxConversationUnmuted ?? "Conversation unmuted",
    }),
    [t]
  );

  const {
    conversationPreference,
    preferenceFeedback,
    setPreferenceFeedback,
    toggleMuted,
  } = useChatPreferences(conversationId, defaultToastMsg);

  const textareaRef = useAutoresizeTextarea(messageInput);
  const { messagesEndRef } = useScrollToBottom(conversationId, messages.length);

  // Clear composer feedback toast/messages when conversation switches
  useEffect(() => {
    setComposerError(null);
  }, [conversationId]);

  // Sync preferenceFeedback into composerError for visual notice
  useEffect(() => {
    if (preferenceFeedback) {
      setComposerError(preferenceFeedback);
      // Automatically clear confirmation messages after 3s
      const timer = setTimeout(() => {
        setComposerError(null);
        setPreferenceFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [preferenceFeedback, setPreferenceFeedback]);

  // Accessibility & UX: Handle Escape key to dismiss menus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isConversationMenuOpen) {
          setIsConversationMenuOpen(false);
          convButtonRef.current?.focus();
        }
        if (isMoreMenuOpen) {
          setIsMoreMenuOpen(false);
          moreButtonRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConversationMenuOpen, isMoreMenuOpen]);

  // Click outside to dismiss menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isConversationMenuOpen &&
        conversationMenuRef.current &&
        !conversationMenuRef.current.contains(target) &&
        !convButtonRef.current?.contains(target)
      ) {
        setIsConversationMenuOpen(false);
      }
      if (
        isMoreMenuOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target) &&
        !moreButtonRef.current?.contains(target)
      ) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isConversationMenuOpen, isMoreMenuOpen]);

  // --- Keyboard Focus Traps for A11y ---
  useEffect(() => {
    if (!isConversationMenuOpen && !isMoreMenuOpen) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const activeContainer = isConversationMenuOpen
        ? conversationMenuRef.current
        : moreMenuRef.current;

      if (!activeContainer) return;

      const focusables = activeContainer.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusables.length === 0) return;

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [isConversationMenuOpen, isMoreMenuOpen]);

  // --- Memoized Message Formatting Arrays ---
  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return displayMessages;
    return [...(searchedMessages ?? [])].reverse();
  }, [searchTerm, searchedMessages, displayMessages]);

  // --- Async Operations Handlers ---
  const handleSend = useCallback(async () => {
    const content = messageInput.trim();
    if (!content || isSending) return;

    setComposerError(null);
    setIsSending(true);

    try {
      await onSendMessage(content);
      clearDraft();
    } catch (error) {
      setComposerError(normalizeApiError(error).message);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [messageInput, isSending, onSendMessage, clearDraft, textareaRef]);

  const handleMessageInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleDeleteConversation = useCallback(async () => {
    const confirmDelete = window.confirm(
      t.chatBoxDeleteConversationConfirm ?? "Are you sure you want to delete this conversation?"
    );
    if (!confirmDelete) return;

    setComposerError(null);

    try {
      await onDeleteConversation();
      clearDraft();
      setIsConversationMenuOpen(false);
    } catch (error) {
      setComposerError(normalizeApiError(error).message);
    }
  }, [onDeleteConversation, clearDraft, t]);

  // Unified skeleton loader component
  if (isLoading) {
    return (
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          theme === "dark"
            ? "bg-linear-to-b from-slate-900 to-slate-950"
            : "bg-linear-to-b from-slate-50/80 to-white"
        }`}
        role="status"
        aria-live="polite"
        aria-label="Loading conversation messages"
      >
        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex gap-3 items-end ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              {i % 2 !== 0 && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200/70 dark:bg-slate-800 animate-pulse" />
              )}
              <div className="space-y-2 max-w-[16rem] w-full">
                <div className="animate-pulse rounded-lg bg-gray-200/70 h-4 w-full dark:bg-slate-700/60" />
                <div className="animate-pulse rounded-lg bg-gray-200/70 h-4 w-3/4 dark:bg-slate-700/60" />
              </div>
              {i % 2 === 0 && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200/70 dark:bg-slate-800 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col ${
        theme === "dark"
          ? "bg-linear-to-b from-slate-900 to-slate-950 text-slate-100"
          : "bg-linear-to-b from-slate-50/80 to-white text-slate-950"
      }`}
    >
      {/* Header Panel */}
      <div
        className={`flex min-h-16 items-center gap-3 px-4 backdrop-blur-md transition-all duration-200 ease-out sm:px-6 ${
          theme === "dark"
            ? "border-b border-slate-800 bg-slate-900/80"
            : "border-b border-slate-200/70 bg-white/80"
        }`}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 md:hidden ${
              theme === "dark"
                ? "border-slate-700 text-slate-200 hover:bg-slate-800 focus-visible:ring-offset-slate-900"
                : "border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:ring-offset-white"
            }`}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        ) : null}

        <h2
          className={`min-w-0 truncate text-sm font-semibold tracking-wide ${
            theme === "dark" ? "text-slate-100" : "text-slate-800"
          }`}
        >
          {conversationName}
        </h2>

        {conversationPreference.muted ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
              theme === "dark"
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-600"
            }`}
            role="status"
          >
            <BellOff size={12} strokeWidth={2} />
            {t.chatBoxMuteConversation ?? "Muted"}
          </span>
        ) : null}

        <div className="relative ml-auto">
          <button
            type="button"
            ref={convButtonRef}
            id="conversation-menu-button"
            aria-haspopup="true"
            aria-expanded={isConversationMenuOpen}
            aria-controls="conversation-menu-dropdown"
            onClick={() => setIsConversationMenuOpen((current) => !current)}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-95 ${
              theme === "dark"
                ? "border-slate-700 text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300 focus-visible:ring-offset-slate-900"
                : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 focus-visible:ring-offset-white"
            }`}
            aria-label={t.chatBoxConversationOptions ?? "Conversation options"}
          >
            <EllipsisVertical size={18} strokeWidth={2} />
          </button>

          {isConversationMenuOpen ? (
            <div
              ref={conversationMenuRef}
              id="conversation-menu-dropdown"
              role="menu"
              aria-labelledby="conversation-menu-button"
              className={`absolute right-0 top-full z-20 mt-2 w-[18rem] overflow-hidden rounded-2xl border shadow-xl transition-all duration-200 ease-out ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`border-b px-4 py-3 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800/70"
                    : "border-slate-100 bg-slate-50/80"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {t.chatBoxManagingConversation ?? "Manage chat"}
                </p>
                <p
                  className={`mt-1 truncate text-xs ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {t.chatBoxContactLabel ?? "Contact"}: {peerEmail || baseConversationName}
                </p>
              </div>

              <div className="p-2" role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={toggleMuted}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    theme === "dark"
                      ? "text-slate-200 hover:bg-teal-500/10 hover:text-teal-300"
                      : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {conversationPreference.muted ? (
                    <Bell size={16} strokeWidth={2} />
                  ) : (
                    <BellOff size={16} strokeWidth={2} />
                  )}
                  {conversationPreference.muted
                    ? t.chatBoxUnmuteConversation ?? "Unmute"
                    : t.chatBoxMuteConversation ?? "Mute"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDeleteConversation}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                    theme === "dark"
                      ? "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                      : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  <Trash2 size={16} strokeWidth={2} />
                  {t.chatBoxDeleteConversation ?? "Delete chat"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth sm:p-6" role="log" aria-live="polite">
          {isSearching ? (
            <div className="flex flex-1 items-center justify-center py-8 text-sm text-slate-500">
              {/* Centralized spin pattern */}
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent mr-2" />
              {t.chatBoxSearching ?? "Searching..."}
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((message) => {
              const isMine = message.senderId === currentUserId;
              const avatarName = isMine ? currentUserName : peerName;
              const avatarUrl = isMine ? currentUserAvatarUrl : peerAvatarUrl;
              return (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={`flex gap-3 items-end ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {!isMine && <MessageAvatar name={avatarName} avatarUrl={avatarUrl} />}

                  <div
                    className={`max-w-[min(80vw,24rem)] rounded-2xl px-4 py-2.5 shadow-xs wrap-break-word transition-all duration-200 ease-out sm:max-w-sm ${
                      isMine
                        ? "bg-teal-600 text-white rounded-br-sm focus-within:ring-2 focus-within:ring-teal-400"
                        : theme === "dark"
                          ? "border border-slate-800 bg-slate-800 text-slate-100 rounded-bl-sm focus-within:ring-2 focus-within:ring-teal-500"
                          : "border border-slate-200/80 bg-white text-slate-900 rounded-bl-sm focus-within:ring-2 focus-within:ring-teal-500"
                    }`}
                  >
                    <MessageContent
                      message={message}
                      searchTerm={searchTerm}
                      theme={theme}
                      isMine={isMine}
                    />

                    <span
                      className={`block mt-1 text-[10px] text-right font-medium tracking-tight ${
                        isMine
                          ? "text-teal-100/80"
                          : theme === "dark"
                            ? "text-slate-400"
                            : "text-slate-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString(
                        t.chatBoxLocale ?? "vi-VN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  {isMine && <MessageAvatar name={avatarName} avatarUrl={avatarUrl} />}
                </div>
              );
            })
          ) : messages.length > 0 && searchTerm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center" role="status">
              <Search
                size={24}
                className={`mb-2 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
              />
              <p
                className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
              >
                {`${t.chatBoxNoMatch ?? "No match for"} "${searchTerm}"`}
              </p>
            </div>
          ) : (
            // Unified and centralized EmptyState component
            <EmptyState
              message={t.chatBoxEmptyChat ?? "No messages yet."}
              icon={MessageSquare}
              className="flex-1"
            />
          )}

          {errorMessage ? (
            <AlertMessage variant="error" message={errorMessage} />
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Input Area */}
        <div
          className={`border-t p-2.5 sm:p-4 transition-all duration-200 ease-out ${
            theme === "dark" ? "border-slate-800 bg-slate-950" : "border-slate-200/70 bg-white"
          }`}
        >
          {composerError ? (
            <div className="mb-3">
              <AlertMessage variant="error" message={composerError} />
            </div>
          ) : null}

          <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
            <div className="relative flex-1 flex flex-col">
              <label htmlFor="chat-message-input" className="sr-only">
                {t.chatBoxInputPlaceholder ?? "Type a message..."}
              </label>
              <textarea
                id="chat-message-input"
                ref={textareaRef}
                placeholder={t.chatBoxInputPlaceholder ?? "Type a message..."}
                value={messageInput}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={handleMessageInputKeyDown}
                rows={1}
                disabled={isSending}
                className={`min-h-[40px] max-h-32 flex-1 resize-none overflow-y-auto rounded-xl border px-4 py-2.5 text-base md:text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                }`}
              />
            </div>

            {/* Menu options trigger */}
            <div className="relative">
              <button
                type="button"
                ref={moreButtonRef}
                id="more-options-button"
                aria-haspopup="true"
                aria-expanded={isMoreMenuOpen}
                aria-controls="more-options-dropdown"
                onClick={() => setIsMoreMenuOpen((current) => !current)}
                disabled={isSending}
                title={t.chatBoxMoreOptions ?? "More options"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                <Plus
                  size={18}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ease-out ${isMoreMenuOpen ? "rotate-45" : ""}`}
                />
              </button>

              {isMoreMenuOpen && (
                <div
                  ref={moreMenuRef}
                  id="more-options-dropdown"
                  role="menu"
                  aria-labelledby="more-options-button"
                  className={`absolute bottom-full right-0 z-10 mb-2 min-w-[12rem] overflow-hidden rounded-xl border shadow-lg transition-all duration-200 ease-out ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProductPickerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      theme === "dark"
                        ? "text-slate-200 hover:bg-teal-500/10 hover:text-teal-300"
                        : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    <Package size={16} strokeWidth={2} className="opacity-80" />
                    {t.chatBoxSendProduct ?? "Send product"}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsLocationPickerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 border-t px-4 py-2.5 text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      theme === "dark"
                        ? "border-slate-700 text-slate-200 hover:bg-teal-500/10 hover:text-teal-300"
                        : "border-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    <MapPin size={16} strokeWidth={2} className="opacity-80" />
                    {t.chatBoxShareLocation ?? "Share location"}
                  </button>
                </div>
              )}
            </div>

            {/* Send Message Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!messageInput.trim() || isSending}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition-all duration-200 ease-out hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 active:scale-95 disabled:pointer-events-none disabled:opacity-40`}
              aria-label="Send message"
            >
              {isSending ? (
                /* Centralized spinner instead of customized spinner */
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Modular Child Modals */}
        <ProductPicker
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          onSelectProduct={async (product) => {
            try {
              setComposerError(null);
              await onSendProduct(product.id, product.name);
              setIsProductPickerOpen(false);
            } catch (error) {
              setComposerError(normalizeApiError(error).message);
            }
          }}
        />
        <LocationPicker
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={async (location) => {
            try {
              setComposerError(null);
              await onSendLocation(
                location.latitude,
                location.longitude,
                location.address
              );
              setIsLocationPickerOpen(false);
              setIsMoreMenuOpen(false);
            } catch (error) {
              setComposerError(normalizeApiError(error).message);
            }
          }}
        />
      </div>
    </div>
  );
}
