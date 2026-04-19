import { useEffect, useRef, useState } from "react";
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
import { normalizeApiError } from "../../../lib/api/apiError";
import type { ApiMessage, LocationMetadata, ProductMetadata } from "../types";
import { useTheme } from "../../settings/hooks/useTheme";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { ProductPicker } from "./ProductPicker";
import { LocationPicker } from "./LocationPicker";
import { useI18n } from "../../shared/context/LanguageContext";
import {
  CONVERSATION_PREFERENCE_CHANGED_EVENT,
  getConversationPreference,
  toggleConversationMuted,
  type ConversationPreference,
} from "../utils/conversationPreferences";

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

const getDraftMessage = (chatId: string) => {
  return localStorage.getItem(`message_draft_${chatId}`) ?? "";
};

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
  const { lang } = useI18n();
  const [messageInput, setMessageInput] = useState(() =>
    getDraftMessage(conversationId),
  );
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isConversationMenuOpen, setIsConversationMenuOpen] = useState(false);
  const [conversationPreference, setConversationPreference] =
    useState<ConversationPreference>(() =>
      getConversationPreference(conversationId),
    );
  const [isSending, setIsSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationMenuRef = useRef<HTMLDivElement>(null);
  const t =
    lang === "vi"
      ? {
          noMatch: "Không tìm thấy tin nhắn nào khớp với",
          emptyChat: "Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!",
          inputPlaceholder: "Nhập tin nhắn...",
          moreOptions: "Thêm tùy chọn",
          conversationOptions: "Tùy chọn hội thoại",
          muteConversation: "Tắt thông báo hội thoại",
          unmuteConversation: "Bật lại thông báo",
          deleteConversation: "Xóa hội thoại",
          deleteConversationConfirm:
            "Bạn có chắc muốn xóa hội thoại này khỏi danh sách không?",
          conversationDeleted: "Đã xóa hội thoại khỏi danh sách.",
          conversationMuted: "Đã tắt thông báo hội thoại này.",
          conversationUnmuted: "Đã bật lại thông báo hội thoại này.",
          managingConversation: "Quản lý hội thoại",
          contactLabel: "Liên hệ",
          sendProduct: "Gửi sản phẩm",
          shareLocation: "Chia sẻ vị trí",
          sending: "Đang gửi...",
          loading: "Đang tải tin nhắn...",
          searching: "Đang tìm tin nhắn...",
          locale: "vi-VN",
        }
      : {
          noMatch: "No messages match",
          emptyChat: "No messages yet. Start the conversation!",
          inputPlaceholder: "Type a message...",
          moreOptions: "More options",
          conversationOptions: "Conversation options",
          muteConversation: "Mute conversation",
          unmuteConversation: "Unmute conversation",
          deleteConversation: "Delete conversation",
          deleteConversationConfirm:
            "Are you sure you want to remove this conversation from the list?",
          conversationDeleted: "Conversation removed from the list.",
          conversationMuted: "Conversation notifications muted.",
          conversationUnmuted: "Conversation notifications restored.",
          managingConversation: "Manage conversation",
          contactLabel: "Contact",
          sendProduct: "Send product",
          shareLocation: "Share location",
          sending: "Sending...",
          loading: "Loading messages...",
          searching: "Searching messages...",
          locale: "en-US",
        };

  useEffect(() => {
    const nextPreference = getConversationPreference(conversationId);
    setConversationPreference(nextPreference);
    setIsConversationMenuOpen(false);
  }, [conversationId]);

  useEffect(() => {
    const handleConversationPreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string;
        preference: ConversationPreference;
      }>;

      if (customEvent.detail.conversationId !== conversationId) {
        return;
      }

      setConversationPreference(customEvent.detail.preference);
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
  }, [conversationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        conversationMenuRef.current &&
        !conversationMenuRef.current.contains(event.target as Node)
      ) {
        setIsConversationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageInput]);

  useEffect(() => {
    if (messageInput.trim()) {
      localStorage.setItem(`message_draft_${conversationId}`, messageInput);
    } else {
      localStorage.removeItem(`message_draft_${conversationId}`);
    }

    window.dispatchEvent(
      new CustomEvent("draftMessageChanged", {
        detail: { chatId: conversationId, message: messageInput },
      }),
    );
  }, [messageInput, conversationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [conversationId, messages.length]);

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;

    const regex = new RegExp(`(${keyword})`, "gi");
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

  const handleSend = async () => {
    const content = messageInput.trim();
    if (!content || isSending) return;

    setComposerError(null);
    setIsSending(true);

    try {
      await onSendMessage(content);
      setMessageInput("");
      localStorage.removeItem(`message_draft_${conversationId}`);
      window.dispatchEvent(
        new CustomEvent("draftMessageChanged", {
          detail: { chatId: conversationId, message: "" },
        }),
      );
    } catch (error) {
      setComposerError(normalizeApiError(error).message);
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageInputKeyPress = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const emitDraftChange = (message: string) => {
    window.dispatchEvent(
      new CustomEvent("draftMessageChanged", {
        detail: { chatId: conversationId, message },
      }),
    );
  };

  const handleToggleMutedConversation = () => {
    const nextPreference = toggleConversationMuted(conversationId);
    setComposerError(
      nextPreference.muted ? t.conversationMuted : t.conversationUnmuted,
    );
    setIsConversationMenuOpen(false);
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm(t.deleteConversationConfirm)) {
      return;
    }

    setComposerError(null);

    try {
      await onDeleteConversation();
      localStorage.removeItem(`message_draft_${conversationId}`);
      setMessageInput("");
      emitDraftChange("");
      setIsConversationMenuOpen(false);
    } catch (error) {
      setComposerError(normalizeApiError(error).message);
    }
  };

  const renderAvatar = (name: string, avatarUrl?: string | null) => {
    const { initials, colorClass } = getAvatarStyle(name);
    const isImageUrl = !!avatarUrl && /^(https?:\/\/|\/).+/.test(avatarUrl);

    if (isImageUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      );
    }

    return (
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
      >
        {initials}
      </div>
    );
  };

  const renderMessageContent = (message: ApiMessage, isMine: boolean) => {
    if (message.messageType === "PRODUCT") {
      const meta = message.metadata as ProductMetadata | null;
      return (
        <div className="space-y-1">
          {message.content && (
            <p className="whitespace-pre-wrap">
              {highlightText(message.content, searchTerm)}
            </p>
          )}
          {meta?.snapshot && (
            <div
              className={`mt-1 flex items-center gap-2 rounded-xl border p-2 ${
                isMine
                  ? "border-teal-400/40 bg-teal-500/20"
                  : theme === "dark"
                    ? "border-slate-600 bg-slate-700/50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <Package size={16} className="shrink-0 opacity-70" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {meta.snapshot.name}
                </p>
                <p className="text-[11px] opacity-70">
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
        <div className="space-y-1">
          {message.content && (
            <p className="whitespace-pre-wrap">
              {highlightText(message.content, searchTerm)}
            </p>
          )}
          {meta && (
            <a
              href={mapsUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1 flex items-center gap-2 rounded-xl border p-2 transition hover:opacity-80 ${
                isMine
                  ? "border-teal-400/40 bg-teal-500/20"
                  : theme === "dark"
                    ? "border-slate-600 bg-slate-700/50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <MapPin size={16} className="shrink-0 opacity-70" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {meta.address ??
                    `${meta.latitude.toFixed(4)}, ${meta.longitude.toFixed(4)}`}
                </p>
                <p className="text-[11px] opacity-70">Nhấn để mở bản đồ</p>
              </div>
              <ExternalLink size={12} className="shrink-0 opacity-50" />
            </a>
          )}
        </div>
      );
    }

    return (
      <p className="whitespace-pre-wrap">
        {highlightText(message.content ?? "", searchTerm)}
      </p>
    );
  };

  // API returns newest first — reverse for display (oldest on top)
  const displayMessages = [...messages].reverse();
  const filteredMessages = searchTerm
    ? [...(searchedMessages ?? [])].reverse()
    : displayMessages;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col ${
        theme === "dark"
          ? "bg-linear-to-b from-slate-900 to-slate-950"
          : "bg-linear-to-b from-slate-50/80 to-white"
      }`}
    >
      <div
        className={`flex min-h-16 items-center gap-3 px-4 sm:px-6 ${
          theme === "dark"
            ? "border-b border-slate-700"
            : "border-b border-slate-200/70"
        }`}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition md:hidden ${
              theme === "dark"
                ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
        ) : null}
        <p
          className={`min-w-0 truncate text-sm font-semibold ${
            theme === "dark" ? "text-slate-100" : "text-slate-800"
          }`}
        >
          {conversationName}
        </p>
        {conversationPreference.muted ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
              theme === "dark"
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <BellOff size={12} strokeWidth={2} />
            {t.muteConversation}
          </span>
        ) : null}
        <div className="relative ml-auto" ref={conversationMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsConversationMenuOpen((currentValue) => !currentValue);
            }}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              theme === "dark"
                ? "border-slate-700 text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
                : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            }`}
            aria-label={t.conversationOptions}
            aria-expanded={isConversationMenuOpen}
          >
            <EllipsisVertical size={18} strokeWidth={2} />
          </button>

          {isConversationMenuOpen ? (
            <div
              className={`absolute right-0 top-full z-20 mt-2 w-[18rem] overflow-hidden rounded-2xl border shadow-xl ${
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
                  {t.managingConversation}
                </p>
                <p
                  className={`mt-1 truncate text-xs ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {t.contactLabel}: {peerEmail || baseConversationName}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleToggleMutedConversation}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
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
                    ? t.unmuteConversation
                    : t.muteConversation}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                    theme === "dark"
                      ? "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                      : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  <Trash2 size={16} strokeWidth={2} />
                  {t.deleteConversation}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-3 scroll-smooth sm:p-4">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center py-8 text-sm text-slate-500">
              {t.loading}
            </div>
          ) : isSearching ? (
            <div className="flex flex-1 items-center justify-center py-8 text-sm text-slate-500">
              {t.searching}
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
                  className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {!isMine && renderAvatar(avatarName, avatarUrl)}

                  <div
                    className={`max-w-[min(85vw,24rem)] rounded-2xl px-4 py-2 text-sm wrap-break-word sm:max-w-sm ${
                      isMine
                        ? "bg-teal-600 text-white"
                        : theme === "dark"
                          ? "border border-slate-700 bg-slate-800 text-slate-100"
                          : "border border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    {renderMessageContent(message, isMine)}
                    <p
                      className={`mt-1 text-xs ${
                        isMine
                          ? "text-teal-100"
                          : theme === "dark"
                            ? "text-slate-400"
                            : "text-slate-500"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString(
                        t.locale,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>

                  {isMine && renderAvatar(avatarName, avatarUrl)}
                </div>
              );
            })
          ) : messages.length > 0 && searchTerm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search
                size={24}
                className={`mb-2 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
              />
              <p
                className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
              >
                {`${t.noMatch} "${searchTerm}"`}
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <MessageSquare size={26} strokeWidth={2} />
              </div>
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-slate-100" : "text-slate-900"
                }`}
              >
                {conversationName}
              </h3>
              <p
                className={`mt-2 max-w-sm text-sm leading-relaxed ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {t.emptyChat}
              </p>
            </div>
          )}
          {errorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div
          className={`border-t p-4 ${
            theme === "dark" ? "border-slate-700" : "border-slate-200/70"
          }`}
        >
          {composerError ? (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {composerError}
            </div>
          ) : null}
          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              placeholder={t.inputPlaceholder}
              value={messageInput}
              onChange={(event) => {
                setComposerError(null);
                setMessageInput(event.target.value);
              }}
              onKeyPress={handleMessageInputKeyPress}
              rows={1}
              disabled={isSending}
              className={`min-h-10 max-h-32 flex-1 resize-none overflow-y-auto rounded-lg border px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 ${
                theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                  : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsMoreMenuOpen((currentValue) => !currentValue)
                }
                disabled={isSending}
                title={t.moreOptions}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                <Plus size={18} strokeWidth={2} />
              </button>
              {isMoreMenuOpen && (
                <div
                  className={`absolute bottom-full right-0 z-10 mb-2 min-w-[11rem] rounded-lg border shadow-lg ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductPickerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-sm first:rounded-t-lg ${
                      theme === "dark"
                        ? "text-slate-200 hover:bg-teal-500/10 hover:text-teal-300"
                        : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    <Package size={16} strokeWidth={2} />
                    {t.sendProduct}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocationPickerOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 border-t px-4 py-2 text-sm last:rounded-b-lg ${
                      theme === "dark"
                        ? "border-slate-700 text-slate-200 hover:bg-teal-500/10 hover:text-teal-300"
                        : "border-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    <MapPin size={16} strokeWidth={2} />
                    {t.shareLocation}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!messageInput.trim() || isSending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <span className="text-xs font-semibold">...</span>
              ) : (
                <Send size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

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
                location.address,
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
