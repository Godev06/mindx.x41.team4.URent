import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { translations, type Lang, type T } from "../i18n/translations";
import { getStoredAuthToken } from "../../../../lib/api/tokenStorage";
import { apiClient } from "../../../../lib/api/apiClient";

export interface LanguageContextValue {
  lang: Lang;
  t: T;
  isLanguageTransitioning: boolean;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "i18n_lang";

const resolveStoredLang = (): Lang => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "vi" || saved === "en") {
    return saved;
  }

  const legacySaved = localStorage.getItem("settings.language");
  if (legacySaved === "English") {
    return "en";
  }

  return "vi";
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(resolveStoredLang);
  const [isLanguageTransitioning, setIsLanguageTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  const startTransition = useCallback(() => {
    setIsLanguageTransitioning(true);

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setIsLanguageTransitioning(false);
      transitionTimerRef.current = null;
    }, 380);
  }, []);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) return;

    apiClient.get("/api/v1/settings")
      .then((res: any) => {
        const settings = res.data?.data || res.data;
        if (settings && settings.language) {
          setLangState(settings.language);
          localStorage.setItem(STORAGE_KEY, settings.language);
        }
      })
      .catch((err) => {
        console.error("Failed to load settings in LanguageContext:", err);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const setLang = useCallback(
    (nextLang: Lang) => {
      setLangState((current) => {
        if (current === nextLang) {
          return current;
        }

        startTransition();
        localStorage.setItem(STORAGE_KEY, nextLang);
        const token = getStoredAuthToken();
        if (token) {
          apiClient.patch("/api/v1/settings", { language: nextLang }).catch((err) => {
            console.error("Failed to update language on BE:", err);
          });
        }
        return nextLang;
      });
    },
    [startTransition],
  );

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: Lang = current === "vi" ? "en" : "vi";
      startTransition();
      localStorage.setItem(STORAGE_KEY, next);
      const token = getStoredAuthToken();
      if (token) {
        apiClient.patch("/api/v1/settings", { language: next }).catch((err) => {
          console.error("Failed to update language on BE:", err);
        });
      }
      return next;
    });
  }, [startTransition]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: translations[lang] as T,
      isLanguageTransitioning,
      setLang,
      toggleLang,
    }),
    [lang, isLanguageTransitioning, setLang, toggleLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }

  return context;
}
