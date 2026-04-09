import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Send,
  Search,
  Package,
  MapPin,
  Plus,
} from "lucide-react";
import { CHATS, MESSAGES, USER_PROFILE } from "../../shared/data";
import { ChatListItem } from "../components/ChatListItem";
import { ProductPicker } from "../components/ProductPicker";
import { LocationPicker } from "../components/LocationPicker";
import { getAvatarStyle } from "../../shared/utils/avatar";

export function MessagesPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const parsedId = id ? Number(id) : undefined;
  const [selectedChatId, setSelectedChatId] = useState(
    parsedId ?? CHATS[0]?.id ?? 0,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (parsedId && Number.isFinite(parsedId)) {
      setSelectedChatId(parsedId);
    }
  }, [parsedId]);

  // Load message input from localStorage when chat changes
  useEffect(() => {
    const savedMessage = localStorage.getItem(
      `message_draft_${selectedChatId}`,
    );
    if (savedMessage) {
      setMessageInput(savedMessage);
    } else {
      setMessageInput("");
    }
  }, [selectedChatId]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageInput]);

  // Save message input to localStorage and dispatch event
  useEffect(() => {
    if (messageInput.trim()) {
      localStorage.setItem(`message_draft_${selectedChatId}`, messageInput);
    } else {
      localStorage.removeItem(`message_draft_${selectedChatId}`);
    }

    // Dispatch custom event to notify ChatListItem
    window.dispatchEvent(
      new CustomEvent("draftMessageChanged", {
        detail: { chatId: selectedChatId, message: messageInput },
      }),
    );
  }, [messageInput, selectedChatId]);

  const selectedChat =
    CHATS.find((chat) => chat.id === selectedChatId) ?? CHATS[0];
  const chatMessages = messages.filter(
    (message) => message.chatId === selectedChatId,
  );

  // Filter chats based on search term
  const filteredChats = CHATS.filter((chat) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      chat.name.toLowerCase().includes(searchLower) ||
      chat.message.toLowerCase().includes(searchLower)
    );
  });

  // Filter messages based on search term
  const filteredMessages = chatMessages.filter((message) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      message.content.toLowerCase().includes(searchLower) ||
      message.senderName.toLowerCase().includes(searchLower)
    );
  });

  // Function to find the most recent message containing search term
  const findMostRecentMessage = (searchTerm: string) => {
    if (!searchTerm) return null;
    const searchLower = searchTerm.toLowerCase();

    // Find all messages containing the search term
    const matchingMessages = messages.filter(
      (message) =>
        message.content.toLowerCase().includes(searchLower) ||
        message.senderName.toLowerCase().includes(searchLower),
    );

    if (matchingMessages.length === 0) return null;

    // Return the most recent message (by timestamp)
    return matchingMessages.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
  };

  // Find the most recent message containing search term
  const recentMessage = findMostRecentMessage(searchTerm);

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
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const recentMessage = findMostRecentMessage(searchTerm.trim());
      if (recentMessage) {
        setSelectedChatId(recentMessage.chatId);
        navigate(`/messages/${recentMessage.chatId}`);
        // Scroll to the message after a short delay to ensure chat is loaded
        setTimeout(() => {
          const messageElement = document.getElementById(
            `message-${recentMessage.id}`,
          );
          if (messageElement) {
            messageElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            messageElement.classList.add(
              "bg-yellow-100",
              "ring-2",
              "ring-yellow-300",
            );
            setTimeout(() => {
              messageElement.classList.remove(
                "bg-yellow-100",
                "ring-2",
                "ring-yellow-300",
              );
            }, 3000);
          }
        }, 100);
      }
    }
  };
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: messages.length + 1,
        chatId: selectedChatId,
        content: messageInput.trim(),
        sender: "user" as const,
        senderName: USER_PROFILE.name,
        senderAvatar: USER_PROFILE.avatar,
        timestamp: new Date().toISOString(),
      };

      setMessages([...messages, newMessage]);

      // Clear the input and remove from localStorage
      setMessageInput("");
      localStorage.removeItem(`message_draft_${selectedChatId}`);

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("draftMessageChanged", {
          detail: { chatId: selectedChatId, message: "" },
        }),
      );

      // Scroll to bottom after a short delay
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleMessageInputKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendProduct = (product: {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
  }) => {
    const newMessage = {
      id: messages.length + 1,
      chatId: selectedChatId,
      content: `🛍️ ${product.image} ${product.name} - $${product.price}/ngày`,
      sender: "user" as const,
      senderName: USER_PROFILE.name,
      senderAvatar: USER_PROFILE.avatar,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);

    // Scroll to bottom after a short delay
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleSendLocation = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    const googleMapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const newMessage = {
      id: messages.length + 1,
      chatId: selectedChatId,
      content: `📍 ${location.address}\n${googleMapsLink}`,
      sender: "user" as const,
      senderName: USER_PROFILE.name,
      senderAvatar: USER_PROFILE.avatar,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);

    // Scroll to bottom after a short delay
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex h-[min(800px,calc(110vh-15rem))] rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="flex w-full flex-col border-slate-200/90 md:w-[min(100%,20rem)] md:border-r">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Tin nhắn</h2>
            <p className="text-xs text-slate-500">
              Chọn cuộc trò chuyện để xem chi tiết.
            </p>
            <div className="mt-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn, người..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>
          {searchTerm && recentMessage && (
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MessageSquare size={12} />
                <span className="font-medium">Tin nhắn gần nhất:</span>
              </div>
              <div className="mt-2 flex items-start gap-3">
                {(() => {
                  const { initials, colorClass } = getAvatarStyle(
                    recentMessage.senderName,
                  );
                  return (
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
                    >
                      {initials}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {recentMessage.senderName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(recentMessage.timestamp).toLocaleString(
                        "vi-VN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {highlightText(recentMessage.content, searchTerm)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  selected={selectedChatId === chat.id}
                  onSelect={setSelectedChatId}
                  searchTerm={searchTerm}
                  messages={messages}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search size={24} className="text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  {searchTerm
                    ? "Không tìm thấy kết quả"
                    : "Chưa có tin nhắn nào"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-50/80 to-white md:flex">
          <div className="flex h-16 items-center border-b border-slate-200/70 px-6">
            <p className="text-sm font-semibold text-slate-800">
              {selectedChat?.name}
            </p>
          </div>
          <div className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={`flex gap-3 ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.sender === "other" &&
                      (() => {
                        const { initials, colorClass } = getAvatarStyle(
                          message.senderName,
                        );
                        return (
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
                          >
                            {initials}
                          </div>
                        );
                      })()}
                    <div
                      className={`max-w-sm rounded-2xl px-4 py-2 text-sm break-words ${
                        message.sender === "user"
                          ? "bg-teal-600 text-white"
                          : "bg-white border border-slate-200 text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {highlightText(message.content, searchTerm)}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          message.sender === "user"
                            ? "text-teal-100"
                            : "text-slate-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    {message.sender === "user" &&
                      (() => {
                        const { initials, colorClass } = getAvatarStyle(
                          message.senderName,
                        );
                        return (
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
                          >
                            {initials}
                          </div>
                        );
                      })()}
                  </div>
                ))
              ) : chatMessages.length > 0 && searchTerm ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search size={24} className="text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">
                    Không tìm thấy tin nhắn nào khớp với "{searchTerm}"
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <MessageSquare size={26} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedChat?.name}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-slate-200/70 p-4">
              <div className="flex gap-2 items-end relative">
                <textarea
                  ref={textareaRef}
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleMessageInputKeyPress}
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 min-h-[2.5rem] max-h-32 overflow-y-auto"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    title="Thêm tùy chọn"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                  >
                    <Plus size={18} strokeWidth={2} />
                  </button>
                  {isMoreMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-max">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductPickerOpen(true);
                          setIsMoreMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 first:rounded-t-lg"
                      >
                        <Package size={16} strokeWidth={2} />
                        Gửi sản phẩm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLocationPickerOpen(true);
                          setIsMoreMenuOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-600 last:rounded-b-lg border-t border-slate-100"
                      >
                        <MapPin size={16} strokeWidth={2} />
                        Chia sẻ vị trí
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
            <ProductPicker
              isOpen={isProductPickerOpen}
              onClose={() => setIsProductPickerOpen(false)}
              onSelectProduct={handleSendProduct}
            />
            <LocationPicker
              isOpen={isLocationPickerOpen}
              onClose={() => setIsLocationPickerOpen(false)}
              onSelectLocation={handleSendLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
