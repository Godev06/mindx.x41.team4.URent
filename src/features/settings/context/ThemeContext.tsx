import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
type Language = "Tiếng Việt" | "English" | "中文";

interface ThemeContextValue {
  theme: Theme;
  isThemeTransitioning: boolean;
  emailNotifications: boolean;
  screenNotifications: boolean;
  language: Language;
  toggleTheme: () => void;
  setEmailNotifications: (enabled: boolean) => void;
  setScreenNotifications: (enabled: boolean) => void;
  setLanguage: (language: Language) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const applyThemeTimerRef = useRef<number | null>(null);
  const finishTransitionTimerRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });
  const [isThemeTransitioning, setIsThemeTransitioning] =
    useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => {
    const savedValue = localStorage.getItem("settings.emailNotifications");
    return savedValue === null ? true : savedValue === "true";
  });
  const [screenNotifications, setScreenNotifications] = useState<boolean>(
    () => {
      const savedValue = localStorage.getItem("settings.screenNotifications");
      return savedValue === null ? true : savedValue === "true";
    },
  );
  const [language, setLanguage] = useState<Language>(() => {
    const savedValue = localStorage.getItem("settings.language");
    return savedValue === "English" || savedValue === "中文"
      ? savedValue
      : "Tiếng Việt";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(
      "settings.emailNotifications",
      String(emailNotifications),
    );
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem(
      "settings.screenNotifications",
      String(screenNotifications),
    );
  }, [screenNotifications]);

  useEffect(() => {
    localStorage.setItem("settings.language", language);
  }, [language]);

  useEffect(() => {
    return () => {
      if (applyThemeTimerRef.current !== null) {
        window.clearTimeout(applyThemeTimerRef.current);
      }

      if (finishTransitionTimerRef.current !== null) {
        window.clearTimeout(finishTransitionTimerRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isThemeTransitioning,
      emailNotifications,
      screenNotifications,
      language,
      toggleTheme: () => {
        if (isThemeTransitioning) {
          return;
        }

        setIsThemeTransitioning(true);

        if (applyThemeTimerRef.current !== null) {
          window.clearTimeout(applyThemeTimerRef.current);
        }

        if (finishTransitionTimerRef.current !== null) {
          window.clearTimeout(finishTransitionTimerRef.current);
        }

        applyThemeTimerRef.current = window.setTimeout(() => {
          setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light",
          );
        }, 120);

        finishTransitionTimerRef.current = window.setTimeout(() => {
          setIsThemeTransitioning(false);
        }, 420);
      },
      setEmailNotifications,
      setScreenNotifications,
      setLanguage,
    }),
    [
      emailNotifications,
      isThemeTransitioning,
      language,
      screenNotifications,
      theme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
