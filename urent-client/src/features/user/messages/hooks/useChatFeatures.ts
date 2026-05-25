import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONVERSATION_PREFERENCE_CHANGED_EVENT,
  getConversationPreference,
  toggleConversationMuted,
  type ConversationPreference,
} from "../utils/conversationPreferences";

/**
 * Custom Hook: useChatDrafts
 * Safely synchronizes message draft changes between internal state and localStorage.
 * Avoids any direct global side-effects by keeping clean event listener unsubscriptions.
 */
export function useChatDrafts(conversationId: string) {
  const [messageInput, setMessageInput] = useState<string>(() => {
    try {
      return localStorage.getItem(`message_draft_${conversationId}`) ?? "";
    } catch {
      return "";
    }
  });

  // Sync draft and state whenever conversation transitions
  useEffect(() => {
    try {
      const activeDraft = localStorage.getItem(`message_draft_${conversationId}`) ?? "";
      setMessageInput(activeDraft);
    } catch {
      setMessageInput("");
    }
  }, [conversationId]);

  const handleInputChange = useCallback(
    (value: string) => {
      setMessageInput(value);

      try {
        if (value.trim()) {
          localStorage.setItem(`message_draft_${conversationId}`, value);
        } else {
          localStorage.removeItem(`message_draft_${conversationId}`);
        }
      } catch (e) {
        console.warn("[DraftStorage] LocalStorage write failed:", e);
      }

      // Safe window event dispatch to synchronize list items
      window.dispatchEvent(
        new CustomEvent("draftMessageChanged", {
          detail: { chatId: conversationId, message: value },
        })
      );
    },
    [conversationId]
  );

  const clearDraft = useCallback(() => {
    setMessageInput("");
    try {
      localStorage.removeItem(`message_draft_${conversationId}`);
    } catch (e) {
      console.warn("[DraftStorage] LocalStorage clear failed:", e);
    }
    window.dispatchEvent(
      new CustomEvent("draftMessageChanged", {
        detail: { chatId: conversationId, message: "" },
      })
    );
  }, [conversationId]);

  return {
    messageInput,
    handleInputChange,
    clearDraft,
  };
}

/**
 * Custom Hook: useChatPreferences
 * Enforces declarative synchronization of conversation settings,
 * preventing memory leaks by strictly cleaning up event bindings.
 */
export function useChatPreferences(conversationId: string, defaultToastMsg: { muted: string; unmuted: string }) {
  const [conversationPreference, setConversationPreference] = useState<ConversationPreference>(() =>
    getConversationPreference(conversationId)
  );
  const [preferenceFeedback, setPreferenceFeedback] = useState<string | null>(null);

  // Re-sync preferences on chat switch
  useEffect(() => {
    setConversationPreference(getConversationPreference(conversationId));
    setPreferenceFeedback(null);
  }, [conversationId]);

  // Synchronize dynamic updates via external preference mutations
  useEffect(() => {
    const handlePreferenceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string;
        preference: ConversationPreference;
      }>;

      if (customEvent.detail?.conversationId === conversationId) {
        setConversationPreference(customEvent.detail.preference);
      }
    };

    window.addEventListener(CONVERSATION_PREFERENCE_CHANGED_EVENT, handlePreferenceUpdate);
    return () => {
      window.removeEventListener(CONVERSATION_PREFERENCE_CHANGED_EVENT, handlePreferenceUpdate);
    };
  }, [conversationId]);

  const toggleMuted = useCallback(() => {
    const nextPref = toggleConversationMuted(conversationId);
    setConversationPreference(nextPref);
    setPreferenceFeedback(nextPref.muted ? defaultToastMsg.muted : defaultToastMsg.unmuted);
  }, [conversationId, defaultToastMsg]);

  return {
    conversationPreference,
    preferenceFeedback,
    setPreferenceFeedback,
    toggleMuted,
  };
}

/**
 * Custom Hook: useAutoresizeTextarea
 * Decouples the imperative height transitions of textarea elements from visual rendering layers.
 */
export function useAutoresizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`; // Enforced max boundary (128px)
    }
  }, [value]);

  return textareaRef;
}

/**
 * Custom Hook: useScrollToBottom
 * Smoothly synchronizes list views scroll offset when new content items arrive or load.
 */
export function useScrollToBottom(conversationId: string, messageCount: number) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }, []);

  // Instant scroll on active chat swap
  useEffect(() => {
    scrollToBottom("auto");
  }, [conversationId, scrollToBottom]);

  // Smooth scroll transitions for arriving messages
  useEffect(() => {
    const timer = window.setTimeout(() => {
      scrollToBottom("smooth");
    }, 50);

    return () => window.clearTimeout(timer);
  }, [messageCount, scrollToBottom]);

  return {
    messagesEndRef,
    scrollToBottom,
  };
}
