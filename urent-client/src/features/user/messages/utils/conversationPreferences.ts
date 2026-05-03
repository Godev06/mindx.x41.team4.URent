export interface ConversationPreference {
  alias?: string;
  muted?: boolean;
}

const STORAGE_KEY = "message_conversation_preferences";
export const CONVERSATION_PREFERENCE_CHANGED_EVENT =
  "conversationPreferenceChanged";

type PreferenceStore = Record<string, ConversationPreference>;

function readStore(): PreferenceStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as PreferenceStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: PreferenceStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function emitPreferenceChange(
  conversationId: string,
  preference: ConversationPreference,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CONVERSATION_PREFERENCE_CHANGED_EVENT, {
      detail: { conversationId, preference },
    }),
  );
}

export function getConversationPreference(
  conversationId: string,
): ConversationPreference {
  return readStore()[conversationId] ?? {};
}

export function saveConversationPreference(
  conversationId: string,
  nextPreference: ConversationPreference,
) {
  const store = readStore();
  const cleanedPreference: ConversationPreference = {
    alias: nextPreference.alias?.trim() || undefined,
    muted: nextPreference.muted ? true : undefined,
  };

  if (!cleanedPreference.alias && !cleanedPreference.muted) {
    delete store[conversationId];
  } else {
    store[conversationId] = cleanedPreference;
  }

  writeStore(store);
  emitPreferenceChange(conversationId, cleanedPreference);
  return cleanedPreference;
}

export function setConversationAlias(conversationId: string, alias: string) {
  const currentPreference = getConversationPreference(conversationId);
  return saveConversationPreference(conversationId, {
    ...currentPreference,
    alias,
  });
}

export function clearConversationAlias(conversationId: string) {
  const currentPreference = getConversationPreference(conversationId);
  return saveConversationPreference(conversationId, {
    ...currentPreference,
    alias: undefined,
  });
}

export function toggleConversationMuted(conversationId: string) {
  const currentPreference = getConversationPreference(conversationId);
  return saveConversationPreference(conversationId, {
    ...currentPreference,
    muted: !currentPreference.muted,
  });
}
