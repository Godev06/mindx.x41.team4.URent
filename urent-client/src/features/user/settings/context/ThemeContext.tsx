import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "./ThemeContextObject";

const resolveSystemTheme = (): Theme => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const finishTransitionTimerRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    return resolveSystemTheme();
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
    return () => {
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
      toggleTheme: () => {
        if (isThemeTransitioning) {
          return;
        }

        setIsThemeTransitioning(true);

        if (finishTransitionTimerRef.current !== null) {
          window.clearTimeout(finishTransitionTimerRef.current);
        }

        setTheme((currentTheme) =>
          currentTheme === "light" ? "dark" : "light",
        );

        finishTransitionTimerRef.current = window.setTimeout(() => {
          setIsThemeTransitioning(false);
        }, 220);
      },
      setEmailNotifications,
      setScreenNotifications,
    }),
    [emailNotifications, isThemeTransitioning, screenNotifications, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
