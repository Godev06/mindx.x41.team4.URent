import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "../layout/AdminLayout";
import { useSocket } from "../../user/messages/hooks/useSocket";
import { messageService } from "../../user/messages/services/messageService";
import { getAvatarStyle } from "../../user/shared/utils/avatar";
import { useAuth } from "../../user/auth/hooks/useAuth";
import { normalizeApiError } from "../../../lib/api/apiError";
import type { ApiSupportConversation, ApiMessage } from "../../user/messages/types";
import {
  MessageSquare,
  Search,
  Send,
  MapPin,
  Clock,
  Compass,
  AlertCircle,
  Package,
  Activity,
  Sparkles,
  User,
  Filter,
  CheckCheck,
  CornerDownLeft,
  X,
  MessageCircle,
} from "lucide-react";

export function AdminChatPage() {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, isConnected } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdParam = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<ApiSupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(conversationIdParam);
  const [messages, setMessages] = useState<ApiMessage[]>([]);

  // Sync URL conversationIdParam to selectedId state
  useEffect(() => {
    if (conversationIdParam) {
      setSelectedId(conversationIdParam);
    }
  }, [conversationIdParam]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setSearchParams({ conversationId: id });
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "open">("all");
  
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);

  // Keep track of the active selected ID in ref to prevent closure capture in socket listener
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Fetch support conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingList(true);
      setError(null);
      const res = await messageService.listAllSupportConversations({ limit: 50 });
      setConversations(res.data);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Fetch messages when selected support channel changes
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingMessages(true);

    messageService
      .getMessages(selectedId, { limit: 50 })
      .then(async (res) => {
        if (!isCancelled) {
          setMessages([...res.data].reverse());
          
          try {
            await messageService.markAsRead(selectedId);
          } catch (e) {
            console.error("Failed to mark conversation as read:", e);
          }

          setConversations((prev) =>
            prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c))
          );

          setTimeout(scrollToBottom, 100);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(normalizeApiError(err).message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedId, scrollToBottom]);

  // Join socket room for real-time updates
  useEffect(() => {
    if (!selectedId) return;

    joinConversation(selectedId, (errCode) => {
      console.warn(`[AdminChat] Failed to join conversation socket room: ${errCode}`);
    });

    return () => {
      leaveConversation(selectedId);
    };
  }, [selectedId, joinConversation, leaveConversation]);

  // Listen to incoming messages globally dispatched
  useEffect(() => {
    const handleMessageCreated = (event: Event) => {
      const { conversationId: convId, message, conversationType } = (event as CustomEvent).detail;

      if (conversationType === "support" || conversations.some((c) => c.id === convId)) {
        if (convId === selectedIdRef.current) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
          setTimeout(scrollToBottom, 50);
          void messageService.markAsRead(convId).catch(() => {});
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    unreadCount: (c.unreadCount ?? 0) + 1,
                    lastMessage: message.content || (message.messageType === "PRODUCT" ? "[Product]" : "[Location]"),
                    lastMessageAt: message.createdAt,
                  }
                : c
            )
          );
        }

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === convId);
          if (!exists) {
            void loadConversations();
            return prev;
          }

          return prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: message.content || (message.messageType === "PRODUCT" ? "[Product]" : "[Location]"),
                  lastMessageAt: message.createdAt,
                  updatedAt: message.createdAt,
                }
              : c
          ).sort((a, b) => new Date(b.updatedAt || b.lastMessageAt || 0).getTime() - new Date(a.updatedAt || a.lastMessageAt || 0).getTime());
        });
      }
    };

    const handleReadUpdated = (event: Event) => {
      const { conversationId: convId, userId } = (event as CustomEvent).detail;
      if (userId === user?.id) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    };

    window.addEventListener("conversation.message.created", handleMessageCreated);
    window.addEventListener("conversation.read.updated", handleReadUpdated);

    return () => {
      window.removeEventListener("conversation.message.created", handleMessageCreated);
      window.removeEventListener("conversation.read.updated", handleReadUpdated);
    };
  }, [conversations, loadConversations, scrollToBottom, user?.id]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedId || !inputText.trim()) return;

    const content = inputText.trim();
    setInputText("");

    try {
      const message = await messageService.sendMessage(selectedId, {
        messageType: "TEXT",
        content,
      });

      setMessages((prev) => [...prev, message]);
      
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, lastMessage: content, lastMessageAt: message.createdAt, updatedAt: message.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  // Quick Action: Send simulated Location message
  const handleSendSimulatedLocation = async () => {
    if (!selectedId) return;

    try {
      const message = await messageService.sendMessage(selectedId, {
        messageType: "LOCATION",
        metadata: {
          latitude: 21.0285,
          longitude: 105.8542,
          address: "Hoan Kiem Lake, Hanoi, Vietnam (Support Assistant)",
        },
      });

      setMessages((prev) => [...prev, message]);
      
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, lastMessage: "[Location]", lastMessageAt: message.createdAt, updatedAt: message.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  // Quick Action: Send simulated Product message
  const handleSendSimulatedProduct = async () => {
    if (!selectedId) return;

    try {
      const message = await messageService.sendMessage(selectedId, {
        messageType: "PRODUCT",
        metadata: {
          productId: "p1",
        },
      });

      setMessages((prev) => [...prev, message]);

      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, lastMessage: "[Product]", lastMessageAt: message.createdAt, updatedAt: message.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      try {
        const dummyMsg = await messageService.sendMessage(selectedId, {
          messageType: "TEXT",
          content: "Xin chào, tôi có thể hỗ trợ gì về sản phẩm cho bạn không?",
        });
        setMessages((prev) => [...prev, dummyMsg]);
        setTimeout(scrollToBottom, 50);
      } catch {
        setError(normalizeApiError(err).message);
      }
    }
  };

  // Quick reply presets
  const handleSendPresetMessage = async (text: string) => {
    if (!selectedId) return;
    setInputText("");
    try {
      const message = await messageService.sendMessage(selectedId, {
        messageType: "TEXT",
        content: text,
      });
      setMessages((prev) => [...prev, message]);
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, lastMessage: text, lastMessageAt: message.createdAt, updatedAt: message.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  // Filter conversations based on tab & search term
  const filteredConversations = conversations.filter((c) => {
    const clientName = (c.client?.displayName || c.client?.email || "").toLowerCase();
    const lastMsg = (c.lastMessage || "").toLowerCase();
    const q = searchTerm.toLowerCase().trim();
    
    // Search match
    const matchesSearch = clientName.includes(q) || lastMsg.includes(q);
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === "unread") {
      return (c.unreadCount ?? 0) > 0;
    }
    if (activeTab === "open") {
      // Simulate open channels (non-empty last message/recent)
      return !!c.lastMessageAt;
    }
    return true;
  });

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl dark:border-zinc-800/50 dark:bg-zinc-950/70 backdrop-blur-2xl transition-all duration-300">
        
        {/* TOP BAR / HEADER */}
        <div className="flex h-20 items-center justify-between border-b border-zinc-150/90 bg-zinc-50/50 px-6 dark:border-zinc-800/60 dark:bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 shadow-inner">
              <MessageSquare className="h-5 w-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 dark:border-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Concierge Support
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
                  <Activity className="h-2.5 w-2.5" />
                  Live Desk
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage communications and coordinate support requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator badge */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-200/60 bg-white/80 px-3.5 py-1.5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60">
              <span className="relative flex h-2 w-2">
                {isConnected ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </>
                ) : (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                )}
              </span>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                {isConnected ? "Agent Connected" : "Agent Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex flex-1 min-h-0 bg-zinc-50/20 dark:bg-zinc-950/20">
          
          {/* SIDEBAR */}
          <div className="flex w-[22rem] shrink-0 flex-col border-r border-zinc-150/90 bg-white dark:border-zinc-800/60 dark:bg-zinc-950/40">
            
            {/* SEARCH & FILTERS */}
            <div className="p-4 space-y-3 border-b border-zinc-150/90 dark:border-zinc-800/60">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-indigo-500" />
                <input
                  type="text"
                  placeholder="Filter users or contents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-xs text-zinc-900 placeholder-zinc-400 transition-all duration-200 ease-out outline-none hover:border-zinc-300 focus:border-indigo-500/80 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder-zinc-500 dark:hover:border-zinc-700 dark:focus:border-indigo-500 dark:focus:bg-zinc-900/60"
                />
              </div>

              {/* FILTER SEGMENTS */}
              <div className="flex items-center gap-1 rounded-xl bg-zinc-100/80 p-1 dark:bg-zinc-900/50">
                {(["all", "unread", "open"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-[11px] font-medium py-1.5 capitalize rounded-lg transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* CONVERSATION LIST */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {isLoadingList ? (
                // SKELETON LIST LOADERS
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3.5 rounded-2xl p-3.5 border border-transparent bg-zinc-50/60 dark:bg-zinc-900/20 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex justify-between">
                          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                          <div className="h-2 w-8 bg-zinc-100 dark:bg-zinc-900 rounded" />
                        </div>
                        <div className="h-2 w-16 bg-zinc-100 dark:bg-zinc-900 rounded" />
                        <div className="h-2 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const clientName = conv.client?.displayName || conv.client?.email || "Support Client";
                  const clientEmail = conv.client?.email || "";
                  const isSelected = selectedId === conv.id;
                  const { initials, colorClass } = getAvatarStyle(clientName);
                  const isUnread = (conv.unreadCount ?? 0) > 0;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`group flex w-full items-start gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-200 ease-out active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 ${
                        isSelected
                          ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-950 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-zinc-50"
                          : "border border-transparent hover:bg-zinc-100/60 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {/* Avatar container */}
                      <div className="relative shrink-0 mt-0.5">
                        {conv.client?.avatarUrl ? (
                          <img
                            src={conv.client.avatarUrl}
                            alt={clientName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                          />
                        ) : (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${colorClass}`}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                      </div>

                      {/* Conversation details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`truncate text-xs font-semibold tracking-tight ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                            {clientName}
                          </h4>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-tighter">
                              {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {clientEmail}
                        </p>
                        <p className={`truncate text-xs mt-1.5 ${isUnread ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"}`}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>

                      {/* Unread Pill indicator */}
                      {isUnread && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white shadow-sm dark:bg-indigo-600">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400 dark:text-zinc-500">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100/80 text-zinc-400 dark:bg-zinc-900/50 dark:text-zinc-600 mb-3">
                    <Filter className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium">No results found</p>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] mx-auto">
                    Try modifying search parameters or selected filters.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MAIN CHAT WINDOW */}
          <div className="flex flex-1 flex-col bg-zinc-50/50 dark:bg-zinc-950/20">
            {selectedId && selectedConversation ? (
              <>
                {/* ACTIVE CHAT TITLE HEADER */}
                <div className="flex h-20 items-center justify-between border-b border-zinc-150/90 bg-white px-6 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {selectedConversation.client?.avatarUrl ? (
                        <img
                          src={selectedConversation.client.avatarUrl}
                          alt={selectedConversation.client.displayName || ""}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                            getAvatarStyle(selectedConversation.client?.displayName || "Support").colorClass
                          }`}
                        >
                          {getAvatarStyle(selectedConversation.client?.displayName || "Support").initials}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                        {selectedConversation.client?.displayName || selectedConversation.client?.email || "Support Session"}
                      </h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                        {selectedConversation.client?.email}
                      </p>
                    </div>
                  </div>

                  {/* QUICK DEMO UTILITY BUTTONS */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleSendSimulatedProduct}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>Attach Product</span>
                    </button>
                    <button
                      onClick={handleSendSimulatedLocation}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Share Location</span>
                    </button>
                  </div>
                </div>

                {/* MESSAGES THREAD PANELS */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                  {isLoadingMessages ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span className="text-xs text-zinc-400 font-medium">Securing communication history...</span>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                      const isMe = message.senderId === user?.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {/* Client Avatar left profile */}
                          {!isMe && (
                            <div className="shrink-0 mb-1">
                              {selectedConversation.client?.avatarUrl ? (
                                <img
                                  src={selectedConversation.client.avatarUrl}
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/50"
                                />
                              ) : (
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs ${
                                    getAvatarStyle(selectedConversation.client?.displayName || "Support").colorClass
                                  }`}
                                >
                                  {getAvatarStyle(selectedConversation.client?.displayName || "Support").initials}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col max-w-[70%]">
                            <div
                              className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all duration-200 border ${
                                isMe
                                  ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-medium rounded-br-none border-indigo-600/30 dark:from-indigo-600 dark:to-indigo-500"
                                  : "bg-white text-zinc-800 rounded-bl-none border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800/80"
                              }`}
                            >
                              {/* TEXT TYPE */}
                              {message.messageType === "TEXT" && (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              )}

                              {/* PRODUCT TYPE */}
                              {message.messageType === "PRODUCT" && message.metadata && (
                                <div className="space-y-3 mt-1.5">
                                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-indigo-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                                    <Package className="h-3 w-3" />
                                    <span>Product Inquiry Reference</span>
                                  </div>
                                  
                                  <div className="flex gap-3.5 rounded-xl bg-zinc-50/90 p-3 border border-zinc-200/60 dark:bg-zinc-950/60 dark:border-zinc-800/70 min-w-[240px] group transition-all hover:shadow-md">
                                    {"snapshot" in message.metadata && (
                                      <>
                                        {message.metadata.snapshot.imageUrl && (
                                          <img
                                            src={message.metadata.snapshot.imageUrl}
                                            alt=""
                                            className="h-14 w-14 rounded-lg object-cover ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 transition-transform duration-200 group-hover:scale-105"
                                          />
                                        )}
                                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                                          <div>
                                            <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                                              {message.metadata.snapshot.name}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                              {message.metadata.snapshot.category}
                                            </p>
                                          </div>
                                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1.5 font-mono">
                                            ${message.metadata.snapshot.pricePerDay}/day
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* LOCATION TYPE */}
                              {message.messageType === "LOCATION" && message.metadata && (
                                <div className="space-y-3 mt-1.5">
                                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-indigo-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                                    <MapPin className="h-3 w-3" />
                                    <span>Meeting Handover Spot</span>
                                  </div>

                                  <div className="rounded-xl bg-zinc-50/90 p-3 border border-zinc-200/60 dark:bg-zinc-950/60 dark:border-zinc-800/70 min-w-[240px] hover:shadow-md transition-all">
                                    {"latitude" in message.metadata && (
                                      <>
                                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed flex items-start gap-1">
                                          <Compass className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500" />
                                          <span>{message.metadata.address || "Meeting Handover Location"}</span>
                                        </p>
                                        
                                        <div className="mt-3 flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 font-mono border-t border-zinc-200/40 pt-2 dark:border-zinc-800/40">
                                          <span>LAT: {message.metadata.latitude.toFixed(5)}</span>
                                          <span>LNG: {message.metadata.longitude.toFixed(5)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Timestamp indicator */}
                            <span
                              className={`text-[9px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1 ${
                                isMe ? "justify-end pr-1" : "justify-start pl-1"
                              }`}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              <span className="font-mono tracking-tighter">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMe && <CheckCheck className="h-3 w-3 text-indigo-500/80 ml-0.5" />}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-900/50 dark:text-zinc-600 animate-bounce">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">Secure Chat Initiated</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-[200px] mt-1 text-center">
                        Introduce yourself to start providing premium support assistance.
                      </p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* FORM REPLY AREA */}
                <div className="border-t border-zinc-150/90 bg-white px-6 py-4 dark:border-zinc-800/60 dark:bg-zinc-950/40">
                  {/* PRESET CHIPS BAR */}
                  <div className="flex gap-2 overflow-x-auto pb-3.5 scrollbar-none items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase shrink-0 flex items-center gap-1 pr-1 select-none">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Presets:
                    </span>
                    {[
                      "Xin chào! Tôi có thể hỗ trợ gì cho bạn?",
                      "Chúng tôi đã tiếp nhận thông tin yêu cầu của bạn.",
                      "Bạn vui lòng kiểm tra lại vị trí giao nhận xe giúp tôi nhé.",
                      "Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendPresetMessage(preset)}
                        className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-[11px] text-zinc-600 hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-700 active:scale-[0.98] transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* FORM INPUT WRAPPER */}
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-3"
                  >
                    <div className="relative flex-1 group">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Compose administrative support message..."
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-16 text-xs text-zinc-900 placeholder-zinc-400 transition-all duration-200 ease-out outline-none hover:border-zinc-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:hover:border-zinc-700 dark:focus:border-indigo-500 dark:focus:bg-zinc-950"
                      />
                      
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 select-none text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        <kbd className="px-1 rounded bg-zinc-100 dark:bg-zinc-850 font-sans border border-zinc-200/50 dark:border-zinc-800">Enter</kbd>
                        <CornerDownLeft className="h-3 w-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.96] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 hover:shadow-md hover:shadow-indigo-500/15"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // EMPTY STATE CHAT WINDOW
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center bg-zinc-50/20 dark:bg-zinc-950/20">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 blur-xl dark:bg-indigo-400/5" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-zinc-200 shadow-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
                    <MessageSquare className="h-8 w-8 text-indigo-500" />
                  </div>
                </div>
                
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-1.5 tracking-tight">
                  No Support Channel Selected
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[280px] leading-relaxed">
                  Select a live support thread from the left list pane to begin chatting with clients in real-time.
                </p>
                
                <div className="mt-8 flex flex-col gap-2.5 items-center w-full max-w-[240px]">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Client queue is fully automated</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COMPREHENSIVE ERROR POPUP BANNER */}
        {error && (
          <div className="flex items-center gap-3 border-t border-red-200 bg-red-50/90 px-6 py-3.5 text-xs text-red-700 animate-slide-up dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="flex-1 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="rounded-full p-1 text-red-500 hover:bg-red-100 hover:text-red-800 active:scale-90 transition dark:hover:bg-red-900/30 dark:hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
