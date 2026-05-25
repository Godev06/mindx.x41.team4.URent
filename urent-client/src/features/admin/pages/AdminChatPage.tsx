import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";

export function AdminChatPage() {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, isConnected } = useSocket();

  const [conversations, setConversations] = useState<ApiSupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    // Fetch messages through the existing user/client route (admin has permission for type: support)
    messageService
      .getMessages(selectedId, { limit: 50 })
      .then(async (res) => {
        if (!isCancelled) {
          // Messages are returned newest-first, we reverse them to display chronological order in chat
          setMessages([...res.data].reverse());
          
          // Mark conversation as read
          try {
            await messageService.markAsRead(selectedId);
          } catch (e) {
            console.error("Failed to mark conversation as read:", e);
          }

          // Update local conversation unread count
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c))
          );

          // Scroll to bottom
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

  // Listen to incoming messages globally dispatched via window custom event from useSocket.ts
  useEffect(() => {
    const handleMessageCreated = (event: Event) => {
      const { conversationId: convId, message, conversationType } = (event as CustomEvent).detail;

      // Ensure this is a support conversation message
      if (conversationType === "support" || conversations.some((c) => c.id === convId)) {
        // If it's the currently opened conversation, append message to the end of messages list
        if (convId === selectedIdRef.current) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
          setTimeout(scrollToBottom, 50);

          // Auto-mark as read asynchronously
          void messageService.markAsRead(convId).catch(() => {});
        } else {
          // Increment unread count for other support conversations
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

        // Always update lastMessage and lastMessageAt in sidebar conversations list
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === convId);
          if (!exists) {
            // Re-fetch conversation list to grab the new support ticket
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
      
      // Update sidebar
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
          productId: "p1", // Fallback simulation id
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
      // In case product p1 not found on backend (it throws 404), try sending dummy text support
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

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((c) => {
    const clientName = (c.client?.displayName || c.client?.email || "").toLowerCase();
    const lastMsg = (c.lastMessage || "").toLowerCase();
    const q = searchTerm.toLowerCase().trim();
    return clientName.includes(q) || lastMsg.includes(q);
  });

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Support Center</h2>
              <p className="text-xs text-slate-400">
                Handle real-time support requests from clients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
              }`}
            />
            <span className="text-xs font-semibold text-slate-400">
              {isConnected ? "Socket Connected" : "Socket Offline"}
            </span>
          </div>
        </div>

        {/* Outer Grid */}
        <div className="flex flex-1 min-h-0">
          
          {/* Sidebar Area */}
          <div className="flex w-80 flex-col border-r border-slate-800 bg-slate-950">
            {/* Search Input */}
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search client support..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-hidden transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoadingList ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
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
                      onClick={() => setSelectedId(conv.id)}
                      className={`group flex w-full items-center gap-3.5 rounded-xl p-3.5 text-left transition ${
                        isSelected
                          ? "bg-cyan-500/10 border border-cyan-500/20 text-white"
                          : "border border-transparent hover:bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {conv.client?.avatarUrl ? (
                          <img
                            src={conv.client.avatarUrl}
                            alt={clientName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800"
                          />
                        ) : (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-lg ${colorClass}`}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`truncate text-xs font-bold ${isSelected ? "text-cyan-300" : "text-white"}`}>
                            {clientName}
                          </h4>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="truncate mt-0.5 text-[10px] text-slate-400">
                          {clientEmail}
                        </p>
                        <p className={`truncate mt-1 text-[11px] ${isUnread ? "font-semibold text-white" : "text-slate-500"}`}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <MessageSquare size={20} className="mb-2 text-slate-600" />
                  <p className="text-xs">No support channels found</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Box Panel */}
          <div className="flex flex-1 flex-col bg-slate-950">
            {selectedId && selectedConversation ? (
              <>
                {/* Active Chat Header */}
                <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {selectedConversation.client?.avatarUrl ? (
                        <img
                          src={selectedConversation.client.avatarUrl}
                          alt={selectedConversation.client.displayName || ""}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold text-white ${
                            getAvatarStyle(selectedConversation.client?.displayName || "Support").colorClass
                          }`}
                        >
                          {getAvatarStyle(selectedConversation.client?.displayName || "Support").initials}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {selectedConversation.client?.displayName || selectedConversation.client?.email || "Support Session"}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {selectedConversation.client?.email}
                      </p>
                    </div>
                  </div>

                  {/* Quick support buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendSimulatedProduct}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
                    >
                      <Package size={12} />
                      Simulate Product Info
                    </button>
                    <button
                      onClick={handleSendSimulatedLocation}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
                    >
                      <MapPin size={12} />
                      Simulate Location
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                      const isMe = message.senderId === user?.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <div className="shrink-0 mb-1">
                              {selectedConversation.client?.avatarUrl ? (
                                <img
                                  src={selectedConversation.client.avatarUrl}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${
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
                              className={`rounded-2xl px-4 py-3 text-xs shadow-md ${
                                isMe
                                  ? "bg-cyan-500 text-slate-950 font-medium rounded-br-none"
                                  : "bg-slate-900 text-slate-100 rounded-bl-none border border-slate-800"
                              }`}
                            >
                              {/* TEXT TYPE */}
                              {message.messageType === "TEXT" && (
                                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              )}

                              {/* PRODUCT TYPE */}
                              {message.messageType === "PRODUCT" && message.metadata && (
                                <div className="space-y-2 mt-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <Package size={11} />
                                    Product Inquiry
                                  </div>
                                  <div className="flex gap-2 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 min-w-[200px]">
                                    {"snapshot" in message.metadata && (
                                      <>
                                        {message.metadata.snapshot.imageUrl && (
                                          <img
                                            src={message.metadata.snapshot.imageUrl}
                                            alt=""
                                            className="h-12 w-12 rounded object-cover"
                                          />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-xs font-bold text-white">
                                            {message.metadata.snapshot.name}
                                          </p>
                                          <p className="text-[10px] text-slate-400">
                                            Category: {message.metadata.snapshot.category}
                                          </p>
                                          <p className="text-[11px] font-bold text-cyan-400 mt-1 font-mono">
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
                                <div className="space-y-2 mt-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <MapPin size={11} />
                                    Handover Location
                                  </div>
                                  <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 min-w-[200px]">
                                    {"latitude" in message.metadata && (
                                      <>
                                        <p className="text-[11px] font-medium text-white leading-relaxed">
                                          {message.metadata.address || "Coordinates handover location"}
                                        </p>
                                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                          <span>Lat: {message.metadata.latitude.toFixed(4)}</span>
                                          <span>Lng: {message.metadata.longitude.toFixed(4)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <span
                              className={`text-[9px] text-slate-500 mt-1 flex items-center gap-1 ${
                                isMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              <Clock size={10} />
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-500">
                      <Compass size={24} className="mb-2 animate-pulse text-slate-600" />
                      <p className="text-xs">Send a message to start support chat</p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Form Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="h-20 border-t border-slate-800 bg-slate-900/30 px-6 py-4 flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type administrative support message..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-hidden transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/40"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-slate-500">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">No Active Chat Selected</h3>
                <p className="text-xs text-slate-400 max-w-[280px]">
                  Select a support session from the sidebar to chat with client users in real-time
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2 border-t border-red-500/30 bg-red-950/20 px-6 py-2.5 text-xs text-red-400">
            <AlertCircle size={14} />
            <span className="flex-1 truncate">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-[10px] font-bold uppercase hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
