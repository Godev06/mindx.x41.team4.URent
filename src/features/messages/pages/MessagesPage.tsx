import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Search } from "lucide-react";
import { CHATS, MESSAGES, USER_PROFILE } from "../../shared/data";
import { useTheme } from "../../settings/context/ThemeContext.tsx";
import { ChatListItem } from "../components/ChatListItem";
import { MessagesChatBox } from "../components/MessagesChatBox";
import { getAvatarStyle } from "../../shared/utils/avatar";

export function MessagesPage() {
  const { theme } = useTheme();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const parsedId = id ? Number(id) : undefined;
  const [selectedChatId, setSelectedChatId] = useState(
    parsedId ?? CHATS[0]?.id ?? 0,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState(MESSAGES);

  useEffect(() => {
    if (parsedId && Number.isFinite(parsedId)) {
      setSelectedChatId(parsedId);
    }
  }, [parsedId]);

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
  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      const newMessage = {
        id: messages.length + 1,
        chatId: selectedChatId,
        content: content.trim(),
        sender: "user" as const,
        senderName: USER_PROFILE.name,
        senderAvatar: USER_PROFILE.avatar,
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
      content: `🛍️ ${product.image} ${product.name} - $${product.price}/ngày`,
      sender: "user" as const,
      senderName: USER_PROFILE.name,
      senderAvatar: USER_PROFILE.avatar,
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
      senderName: USER_PROFILE.name,
      senderAvatar: USER_PROFILE.avatar,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <div className="space-y-4">
      <div
        className={`flex h-[min(800px,calc(110vh-15rem))] rounded-2xl border shadow-sm ring-1 ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 ring-white/10"
            : "border-slate-200/90 bg-white ring-slate-900/4"
        }`}
      >
        <div
          className={`flex w-full flex-col md:w-[min(100%,20rem)] md:border-r ${
            theme === "dark" ? "border-slate-700" : "border-slate-200/90"
          }`}
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
              Tin nhắn
            </h2>
            <p
              className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
            >
              Chọn cuộc trò chuyện để xem chi tiết.
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
                  placeholder="Tìm kiếm tin nhắn, người..."
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
                  onSelect={setSelectedChatId}
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
                  {searchTerm
                    ? "Không tìm thấy kết quả"
                    : "Chưa có tin nhắn nào"}
                </p>
              </div>
            )}
          </div>
        </div>

        <MessagesChatBox
          selectedChat={selectedChat}
          selectedChatId={selectedChatId}
          chatMessages={chatMessages}
          filteredMessages={filteredMessages}
          searchTerm={searchTerm}
          onSendMessage={handleSendMessage}
          onSendProduct={handleSendProduct}
          onSendLocation={handleSendLocation}
        />
      </div>
    </div>
  );
}
