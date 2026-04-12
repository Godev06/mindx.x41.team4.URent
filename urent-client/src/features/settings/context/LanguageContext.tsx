import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  type Lang,
  type T,
} from "../../shared/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  t: T;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
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

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: Lang = current === "vi" ? "en" : "vi";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, t: translations[lang] as T, setLang, toggleLang }),
    [lang, setLang, toggleLang],
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
