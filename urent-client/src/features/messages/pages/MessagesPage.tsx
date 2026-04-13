import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Search } from "lucide-react";
import { CHATS, MESSAGES, USER_PROFILE } from "../../shared/data";
import { useTheme } from "../../settings/hooks/useTheme";
import { ChatListItem } from "../components/ChatListItem";
import { MessagesChatBox } from "../components/MessagesChatBox";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";

export function MessagesPage() {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const { user } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const parsedId = id ? Number(id) : undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const t =
    lang === "vi"
      ? {
          title: "Tin nhắn",
          desc: "Chọn cuộc trò chuyện để xem chi tiết.",
          search: "Tìm kiếm tin nhắn, người...",
          recent: "Tin nhắn gần nhất:",
          noResult: "Không tìm thấy kết quả",
          noMessage: "Chưa có tin nhắn nào",
          dayUnit: "/ngày",
          locale: "vi-VN",
        }
      : {
          title: "Messages",
          desc: "Select a conversation to view details.",
          search: "Search messages, people...",
          recent: "Most recent message:",
          noResult: "No results found",
          noMessage: "No messages yet",
          dayUnit: "/day",
          locale: "en-US",
        };
  const selectedChatId =
    parsedId && Number.isFinite(parsedId) ? parsedId : (CHATS[0]?.id ?? 0);
  const isMobileChatView = Boolean(id);
  const currentUserName = user?.displayName ?? user?.email ?? USER_PROFILE.name;
  const currentUserAvatar = user?.avatarUrl ?? USER_PROFILE.avatar;

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
  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      const newMessage = {
        id: messages.length + 1,
        chatId: selectedChatId,
        content: content.trim(),
        sender: "user" as const,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar,
        timestamp: new Date().toISOString(),
      };

      setMessages([...messages, newMessage]);
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
      content: `🛍️ ${product.image} ${product.name} - $${product.price}${t.dayUnit}`,
      sender: "user" as const,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
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
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <div className="space-y-4">
      <div
        className={`flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border shadow-sm ring-1 md:h-[min(800px,calc(110vh-15rem))] md:min-h-0 md:flex-row ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 ring-white/10"
            : "border-slate-200/90 bg-white ring-slate-900/4"
        }`}
      >
        <div
          className={`w-full flex-col md:flex md:w-[min(100%,20rem)] md:border-r ${
            isMobileChatView ? "hidden" : "flex"
          } ${theme === "dark" ? "border-slate-700" : "border-slate-200/90"}`}
        >
          <div
            className={`px-5 py-4 ${
              theme === "dark"
                ? "border-b border-slate-700"
                : "border-b border-slate-100"
            }`}
          >
            <h2
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {t.title}
            </h2>
            <p
              className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
            >
              {t.desc}
            </p>
            <div className="mt-3">
              <div className="relative">
                <Search
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    theme === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>
          </div>
          {searchTerm && recentMessage && (
            <div
              className={`px-5 py-3 ${
                theme === "dark"
                  ? "border-b border-slate-700 bg-slate-800/70"
                  : "border-b border-slate-100 bg-slate-50/50"
              }`}
            >
              <div
                className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
              >
                <MessageSquare size={12} />
                <span className="font-medium">{t.recent}</span>
              </div>
              <div className="mt-2 flex items-start gap-3">
                {(() => {
                  const recentName =
                    recentMessage.sender === "user"
                      ? currentUserName
                      : recentMessage.senderName;
                  const recentAvatar =
                    recentMessage.sender === "user"
                      ? currentUserAvatar
                      : recentMessage.senderAvatar;
                  const { initials, colorClass } = getAvatarStyle(recentName);
                  const isAvatarUrl =
                    !!recentAvatar &&
                    /^(https?:\/\/|\/)?.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(
                      recentAvatar,
                    );

                  return isAvatarUrl ? (
                    <img
                      src={recentAvatar}
                      alt={recentName}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${colorClass}`}
                    >
                      {recentAvatar || initials}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate text-sm font-medium ${
                        theme === "dark" ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {recentMessage.senderName}
                    </span>
                    <span
                      className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {new Date(recentMessage.timestamp).toLocaleString(
                        t.locale,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  <p
                    className={`mt-1 line-clamp-2 text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                  >
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
                  onSelect={(chatId) => navigate(`/messages/${chatId}`)}
                  searchTerm={searchTerm}
                  messages={messages}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search
                  size={24}
                  className={`mb-2 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
                />
                <p
                  className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                >
                  {searchTerm ? t.noResult : t.noMessage}
                </p>
              </div>
            )}
          </div>
        </div>
        <div
          className={`${isMobileChatView ? "flex" : "hidden"} min-h-0 flex-1 md:flex`}
        >
          <MessagesChatBox
            key={selectedChatId}
            selectedChat={selectedChat}
            selectedChatId={selectedChatId}
            chatMessages={chatMessages}
            filteredMessages={filteredMessages}
            searchTerm={searchTerm}
            onBack={() => navigate("/messages")}
            onSendMessage={handleSendMessage}
            onSendProduct={handleSendProduct}
            onSendLocation={handleSendLocation}
          />
        </div>
      </div>
    </div>
  );
}
