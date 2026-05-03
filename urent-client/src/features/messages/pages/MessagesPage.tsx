import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AtSign, MessageSquare, Search, UserPlus } from "lucide-react";
import { normalizeApiError } from "../../../lib/api/apiError";
import { useTheme } from "../../settings/hooks/useTheme";
import { getAvatarStyle } from "../../shared/utils/avatar";
import { ChatListItem } from "../components/ChatListItem";
import { MessagesChatBox } from "../components/MessagesChatBox";
import { messageService } from "../services/messageService";
import { useI18n } from "../../shared/context/LanguageContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { useConversations } from "../hooks/useConversations";
import { useMessageSearch } from "../hooks/useMessageSearch";
import { useMessages } from "../hooks/useMessages";
import { useSocket } from "../hooks/useSocket";
import type { ApiConversationParticipant, ApiMessage } from "../types";
import {
  CONVERSATION_PREFERENCE_CHANGED_EVENT,
  getConversationPreference,
} from "../utils/conversationPreferences";

export function MessagesPage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { id: conversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  const {
    conversations,
    isLoading: convsLoading,
    error: conversationsError,
    refresh: refreshConversations,
    updateLastMessage,
    incrementUnread,
    resetUnread,
    deleteConversation,
  } = useConversations();

  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    markConversationAsRead,
    prependMessage,
    sendText,
    sendProduct,
    sendLocation,
  } = useMessages(conversationId);

  const {
    results: searchedMessages,
    isSearching,
    error: searchError,
  } = useMessageSearch(conversationId, searchTerm);

  const { socket, joinConversation, leaveConversation } = useSocket();
  const [isCreatingByEmail, setIsCreatingByEmail] = useState(false);
  const [createByEmailError, setCreateByEmailError] = useState<string | null>(
    null,
  );
  const [, forceConversationPreferenceRefresh] = useState(0);
  const [resolvedPeer, setResolvedPeer] =
    useState<ApiConversationParticipant | null>(null);
  const [isResolvingPeer, setIsResolvingPeer] = useState(false);
  const [resolvePeerError, setResolvePeerError] = useState<string | null>(null);
  const [supportsPeerLookup, setSupportsPeerLookup] = useState(true);

  // Join/leave socket room when conversation changes
  useEffect(() => {
    if (!conversationId || !socket) return;

    const joinCurrentConversation = () => {
      joinConversation(conversationId, () => {
        setRealtimeError(t.messagesRealtimeError);
      });
    };

    setRealtimeError(null);
    joinCurrentConversation();
    socket.on("connect", joinCurrentConversation);
    resetUnread(conversationId);

    return () => {
      socket.off("connect", joinCurrentConversation);
      leaveConversation(conversationId);
    };
  }, [
    conversationId,
    joinConversation,
    leaveConversation,
    resetUnread,
    socket,
    t.messagesRealtimeError,
  ]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessageCreated = ({
      conversationId: convId,
      message,
    }: {
      conversationId: string;
      message: ApiMessage;
    }) => {
      if (convId === conversationId) {
        prependMessage(message);
        if (message.senderId !== user?.id) {
          void markConversationAsRead().catch(() => {});
          resetUnread(convId);
        }
      } else {
        incrementUnread(convId);
      }
      const lastText =
        message.messageType === "PRODUCT"
          ? "[Product]"
          : message.messageType === "LOCATION"
            ? "[Location]"
            : (message.content ?? "");
      updateLastMessage(convId, lastText, message.createdAt);
    };

    const handleReadUpdated = ({
      conversationId: convId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (userId === user?.id) {
        resetUnread(convId);
      }
    };

    socket.on("conversation.message.created", handleMessageCreated);
    socket.on("conversation.read.updated", handleReadUpdated);

    return () => {
      socket.off("conversation.message.created", handleMessageCreated);
      socket.off("conversation.read.updated", handleReadUpdated);
    };
  }, [
    conversationId,
    markConversationAsRead,
    resetUnread,
    socket,
    incrementUnread,
    prependMessage,
    updateLastMessage,
    user?.id,
  ]);

  useEffect(() => {
    const handleConversationPreferenceChange = () => {
      forceConversationPreferenceRefresh((value) => value + 1);
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
  }, []);

  const isMobileChatView = Boolean(conversationId);

  const selectedConversation = conversations.find(
    (c) => c.id === conversationId,
  );
  const selectedConversationPreference = conversationId
    ? getConversationPreference(conversationId)
    : {};
  const baseConversationName =
    selectedConversation?.participants[0]?.displayName ??
    selectedConversation?.participants[0]?.email ??
    "Conversation";
  const conversationName =
    selectedConversationPreference.alias?.trim() || baseConversationName;
  const peerName =
    selectedConversationPreference.alias?.trim() ||
    (selectedConversation?.participants[0]?.displayName ??
      selectedConversation?.participants[0]?.email ??
      "Unknown");
  const peerAvatarUrl =
    selectedConversation?.participants[0]?.avatarUrl ?? null;
  const peerEmail = selectedConversation?.participants[0]?.email ?? "";
  const currentUserName = user?.displayName ?? user?.email ?? "You";
  const currentUserAvatarUrl = user?.avatarUrl ?? null;

  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const preference = getConversationPreference(c.id);
    const name = (
      preference.alias?.trim() ??
      c.participants[0]?.displayName ??
      c.participants[0]?.email ??
      ""
    ).toLowerCase();
    return name.includes(q) || (c.lastMessage ?? "").toLowerCase().includes(q);
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isEmailQuery = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedSearch);
  const existingConversationByEmail = conversations.find(
    (conversation) =>
      conversation.participants[0]?.email.toLowerCase() === normalizedSearch,
  );
  const isSelfEmail =
    isEmailQuery && normalizedSearch === (user?.email ?? "").toLowerCase();
  const quickMatchConversations = filteredConversations.slice(0, 4);
  const actionPeer =
    existingConversationByEmail?.participants[0] ?? resolvedPeer;

  useEffect(() => {
    if (
      !supportsPeerLookup ||
      !isEmailQuery ||
      existingConversationByEmail ||
      isSelfEmail
    ) {
      setResolvedPeer(null);
      setResolvePeerError(null);
      setIsResolvingPeer(false);
      return;
    }

    let cancelled = false;

    setIsResolvingPeer(true);
    setResolvePeerError(null);

    const timer = window.setTimeout(() => {
      void messageService
        .getConversationPeerByEmail(normalizedSearch)
        .then((peer) => {
          if (!cancelled) {
            setResolvedPeer(peer);
            setResolvePeerError(null);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            const apiError = normalizeApiError(error);
            const errorCode =
              (apiError.details as { error?: { code?: string } } | undefined)
                ?.error?.code ?? null;

            if (apiError.statusCode === 404 && errorCode !== "USER_NOT_FOUND") {
              setSupportsPeerLookup(false);
              setResolvePeerError(null);
              setResolvedPeer(null);
              return;
            }

            setResolvedPeer(null);
            setResolvePeerError(
              errorCode === "USER_NOT_FOUND"
                ? t.messagesUserNotFoundByEmail
                : apiError.message,
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsResolvingPeer(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    existingConversationByEmail,
    isEmailQuery,
    isSelfEmail,
    normalizedSearch,
    supportsPeerLookup,
    t.messagesUserNotFoundByEmail,
  ]);

  const handleCreateByEmail = async () => {
    if (!isEmailQuery || isCreatingByEmail) {
      return;
    }

    if (existingConversationByEmail) {
      navigate(`/messages/${existingConversationByEmail.id}`);
      return;
    }

    try {
      setCreateByEmailError(null);
      setIsCreatingByEmail(true);

      const conversation =
        await messageService.getConversationPeerByEmail(normalizedSearch).then((peer) =>
          messageService.createConversation(peer.userId),
        );
      refreshConversations();
      navigate(`/messages/${conversation.id}`);
      setSearchTerm("");
    } catch (error) {
      setCreateByEmailError(normalizeApiError(error).message);
    } finally {
      setIsCreatingByEmail(false);
    }
  };

  const handleOpenConversation = (id: string) => {
    navigate(`/messages/${id}`);
    setSearchTerm("");
  };

  const handleDeleteConversation = async (id: string) => {
    await messageService.deleteConversation(id);
    deleteConversation(id);
    if (conversationId === id) {
      navigate("/messages");
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const msg = await sendText(content);
      if (msg) prependMessage(msg);
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const handleSendProduct = async (productId: string, content?: string) => {
    try {
      const msg = await sendProduct(productId, content);
      if (msg) prependMessage(msg);
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const handleSendLocation = async (
    lat: number,
    lng: number,
    address?: string,
  ) => {
    try {
      const msg = await sendLocation(lat, lng, address);
      if (msg) prependMessage(msg);
    } catch (error) {
      throw normalizeApiError(error);
    }
  };

  const activeError =
    realtimeError ??
    messagesError ??
    conversationsError ??
    createByEmailError ??
    (searchTerm.trim() ? searchError : null);

  return (
    <div className="space-y-4">
      <div
        className={`flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border shadow-sm ring-1 md:h-[min(800px,calc(110vh-15rem))] md:min-h-0 md:flex-row ${
          theme === "dark"
            ? "border-slate-700 bg-slate-900 ring-white/10"
            : "border-slate-200/90 bg-white ring-slate-900/4"
        }`}
      >
        {/* Sidebar - conversation list */}
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
              {t.messagesTitle}
            </h2>
            <p
              className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
            >
              {t.messagesDesc}
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
                  placeholder={t.messagesSearch}
                  value={searchTerm}
                  onChange={(e) => {
                    setCreateByEmailError(null);
                    setSearchTerm(e.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;

                    if (existingConversationByEmail) {
                      event.preventDefault();
                      handleOpenConversation(existingConversationByEmail.id);
                      return;
                    }

                    if (isEmailQuery) {
                      event.preventDefault();
                      void handleCreateByEmail();
                      return;
                    }

                    if (quickMatchConversations.length > 0) {
                      event.preventDefault();
                      handleOpenConversation(quickMatchConversations[0].id);
                    }
                  }}
                  className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>
            {searchTerm.trim() ? (
              <div
                className={`mt-3 space-y-3 rounded-xl border p-3 ${
                  theme === "dark"
                    ? "border-slate-700 bg-slate-800/60"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="space-y-1">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {t.messagesQuickAction}
                  </p>

                  {isEmailQuery ? (
                    <button
                      type="button"
                      onClick={() =>
                        existingConversationByEmail
                          ? handleOpenConversation(
                              existingConversationByEmail.id,
                            )
                          : void handleCreateByEmail()
                      }
                      disabled={
                        isCreatingByEmail ||
                        isSelfEmail ||
                        isResolvingPeer ||
                        Boolean(
                          resolvePeerError && !existingConversationByEmail,
                        )
                      }
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                        theme === "dark"
                          ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-teal-500/50 hover:bg-teal-500/10"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {actionPeer ? (
                        (() => {
                          const displayName =
                            actionPeer.displayName ?? actionPeer.email;
                          const avatarUrl = actionPeer.avatarUrl;
                          const { initials, colorClass } =
                            getAvatarStyle(displayName);
                          const isImageUrl =
                            !!avatarUrl &&
                            /^(https?:\/\/|\/).+/.test(avatarUrl);

                          return isImageUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="h-6 w-6 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${colorClass}`}
                            >
                              {initials}
                            </div>
                          );
                        })()
                      ) : existingConversationByEmail ? (
                        <AtSign size={14} className="shrink-0" />
                      ) : (
                        <UserPlus size={14} className="shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {isSelfEmail
                          ? t.messagesSelfEmail
                          : isResolvingPeer
                            ? t.messagesLookingUpEmail
                            : isCreatingByEmail
                              ? t.messagesCreatingByEmail
                              : resolvePeerError && !existingConversationByEmail
                                ? resolvePeerError
                                : existingConversationByEmail
                                  ? `${t.messagesOpenByEmail}: ${actionPeer?.displayName ?? actionPeer?.email ?? normalizedSearch}`
                                  : `${t.messagesCreateByEmail}: ${actionPeer?.displayName ?? actionPeer?.email ?? normalizedSearch}`}
                      </span>
                    </button>
                  ) : (
                    <p
                      className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {t.messagesInvalidEmail}
                    </p>
                  )}

                  {!supportsPeerLookup && isEmailQuery ? (
                    <p
                      className={`text-[11px] ${
                        theme === "dark" ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {t.messagesEmailLookupUnavailable}
                    </p>
                  ) : null}
                </div>

                {quickMatchConversations.length > 0 ? (
                  <div className="space-y-1">
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        theme === "dark" ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {t.messagesQuickResults}
                    </p>
                    {quickMatchConversations.map((conversation) => {
                      const displayName =
                        conversation.participants[0]?.displayName ??
                        conversation.participants[0]?.email ??
                        "Unknown";

                      return (
                        <button
                          key={`quick-${conversation.id}`}
                          type="button"
                          onClick={() =>
                            handleOpenConversation(conversation.id)
                          }
                          className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                            theme === "dark"
                              ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-teal-500/50 hover:bg-teal-500/10"
                              : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                          }`}
                        >
                          <AtSign size={14} className="shrink-0 opacity-70" />
                          <span className="min-w-0 flex-1 truncate">
                            {displayName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {convsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <ChatListItem
                  key={conv.id}
                  conversation={conv}
                  selected={conversationId === conv.id}
                  onSelect={(id) => navigate(`/messages/${id}`)}
                  searchTerm={searchTerm}
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
                  {searchTerm ? t.messagesNoResult : t.messagesNoMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={`${isMobileChatView ? "flex" : "hidden"} min-h-0 flex-1 md:flex`}
        >
          {conversationId ? (
            <MessagesChatBox
              key={conversationId}
              conversationName={conversationName}
              baseConversationName={baseConversationName}
              conversationId={conversationId}
              currentUserId={user?.id ?? ""}
              currentUserName={currentUserName}
              currentUserAvatarUrl={currentUserAvatarUrl}
              peerName={peerName}
              peerAvatarUrl={peerAvatarUrl}
              peerEmail={peerEmail}
              isLoading={messagesLoading}
              isSearching={isSearching}
              errorMessage={activeError}
              messages={messages}
              searchedMessages={searchedMessages}
              searchTerm={searchTerm}
              onBack={() => navigate("/messages")}
              onDeleteConversation={() =>
                handleDeleteConversation(conversationId)
              }
              onSendMessage={handleSendMessage}
              onSendProduct={handleSendProduct}
              onSendLocation={handleSendLocation}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <MessageSquare size={26} strokeWidth={2} />
              </div>
              <p
                className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
              >
                {t.messagesDesc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
