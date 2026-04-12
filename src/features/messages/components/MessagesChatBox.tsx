import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Package,
  MapPin,
  Plus,
} from "lucide-react";
import type { Chat, Message } from "../../shared/types";
import { useTheme } from "../../settings/hooks/useTheme";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { ProductPicker } from "./ProductPicker";
import { LocationPicker } from "./LocationPicker";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";

interface SharedProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface SharedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface MessagesChatBoxProps {
  selectedChat?: Chat;
  selectedChatId: number;
  chatMessages: Message[];
  filteredMessages: Message[];
  searchTerm: string;
  onSendMessage: (content: string) => void;
  onSendProduct: (product: SharedProduct) => void;
  onSendLocation: (location: SharedLocation) => void;
}

const getDraftMessage = (chatId: number) => {
  return localStorage.getItem(`message_draft_${chatId}`) ?? "";
};

export function MessagesChatBox({
  selectedChat,
  selectedChatId,
  chatMessages,
  filteredMessages,
  searchTerm,
  onSendMessage,
  onSendProduct,
  onSendLocation,
}: MessagesChatBoxProps) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState(() =>
    getDraftMessage(selectedChatId),
  );
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t =
    lang === "vi"
      ? {
          noMatch: "Không tìm thấy tin nhắn nào khớp với",
          emptyChat: "Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!",
          inputPlaceholder: "Nhập tin nhắn...",
          moreOptions: "Thêm tùy chọn",
          sendProduct: "Gửi sản phẩm",
          shareLocation: "Chia sẻ vị trí",
          locale: "vi-VN",
        }
      : {
          noMatch: "No messages match",
          emptyChat: "No messages yet. Start the conversation!",
          inputPlaceholder: "Type a message...",
          moreOptions: "More options",
          sendProduct: "Send product",
          shareLocation: "Share location",
          locale: "en-US",
        };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageInput]);

  useEffect(() => {
    if (messageInput.trim()) {
      localStorage.setItem(`message_draft_${selectedChatId}`, messageInput);
    } else {
      localStorage.removeItem(`message_draft_${selectedChatId}`);
    }

    window.dispatchEvent(
      new CustomEvent("draftMessageChanged", {
        detail: { chatId: selectedChatId, message: messageInput },
      }),
    );
  }, [messageInput, selectedChatId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [selectedChatId, chatMessages.length, filteredMessages.length]);

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

  const handleSend = () => {
    const content = messageInput.trim();
    if (!content) return;

    onSendMessage(content);
    setMessageInput("");
    localStorage.removeItem(`message_draft_${selectedChatId}`);
    window.dispatchEvent(
      new CustomEvent("draftMessageChanged", {
        detail: { chatId: selectedChatId, message: "" },
      }),
    );
  };

  const handleMessageInputKeyPress = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const renderAvatar = (message: Message) => {
    const resolvedName =
      message.sender === "user"
        ? (user?.displayName ?? user?.email ?? message.senderName)
        : message.senderName;
    const resolvedAvatar =
      message.sender === "user"
        ? (user?.avatarUrl ?? message.senderAvatar)
        : message.senderAvatar;
    const { initials, colorClass } = getAvatarStyle(resolvedName);
    const isAvatarUrl =
      !!resolvedAvatar &&
      /^(https?:\/\/|\/)?.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(
        resolvedAvatar,
      );

    if (isAvatarUrl) {
      return (
        <img
          src={resolvedAvatar}
          alt={resolvedName}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      );
    }

    return (
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
      >
        {resolvedAvatar || initials}
      </div>
    );
  };

  return (
    <div
      className={`hidden min-w-0 flex-1 flex-col md:flex ${
        theme === "dark"
          ? "bg-linear-to-b from-slate-900 to-slate-950"
          : "bg-linear-to-b from-slate-50/80 to-white"
      }`}
    >
      <div
        className={`flex h-16 items-center px-6 ${
          theme === "dark"
            ? "border-b border-slate-700"
            : "border-b border-slate-200/70"
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            theme === "dark" ? "text-slate-100" : "text-slate-800"
          }`}
        >
          {selectedChat?.name}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "other" && renderAvatar(message)}

                <div
                  className={`max-w-sm rounded-2xl px-4 py-2 text-sm wrap-break-word ${
                    message.sender === "user"
                      ? "bg-teal-600 text-white"
                      : theme === "dark"
                        ? "border border-slate-700 bg-slate-800 text-slate-100"
                        : "border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {highlightText(message.content, searchTerm)}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      message.sender === "user"
                        ? "text-teal-100"
                        : theme === "dark"
                          ? "text-slate-400"
                          : "text-slate-500"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString(t.locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.sender === "user" && renderAvatar(message)}
              </div>
            ))
          ) : chatMessages.length > 0 && searchTerm ? (
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
                {selectedChat?.name}
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
          <div ref={messagesEndRef} />
        </div>

        <div
          className={`border-t p-4 ${
            theme === "dark" ? "border-slate-700" : "border-slate-200/70"
          }`}
        >
          <div className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              placeholder={t.inputPlaceholder}
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyPress={handleMessageInputKeyPress}
              rows={1}
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
                  className={`absolute bottom-full right-0 z-10 mb-2 min-w-max rounded-lg border shadow-lg ${
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
              disabled={!messageInput.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <ProductPicker
          isOpen={isProductPickerOpen}
          onClose={() => setIsProductPickerOpen(false)}
          onSelectProduct={(product) => {
            onSendProduct(product);
            setIsProductPickerOpen(false);
          }}
        />
        <LocationPicker
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={(location) => {
            onSendLocation(location);
            setIsLocationPickerOpen(false);
            setIsMoreMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}
