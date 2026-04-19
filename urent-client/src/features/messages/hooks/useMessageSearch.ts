import { useEffect, useState } from "react";
import { normalizeApiError } from "../../../lib/api/apiError";
import { messageService } from "../services/messageService";
import type { ApiMessage } from "../types";

export function useMessageSearch(
  conversationId: string | undefined,
  query: string,
) {
  const [results, setResults] = useState<ApiMessage[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!conversationId || !trimmedQuery) {
      setResults(null);
      setError(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    setIsSearching(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void messageService
        .searchMessages({
          q: trimmedQuery,
          conversationId,
          limit: 50,
        })
        .then((response) => {
          if (!cancelled) {
            setResults(response.data);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setResults([]);
            setError(normalizeApiError(error).message);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [conversationId, query]);

  return { results, isSearching, error };
}