import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "./ThemeContextObject";
import { settingsService } from "../services/settingsService";
import { useAuth } from "../../auth/hooks/useAuth";

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
  const { isAuthenticated } = useAuth();
  
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
    if (!isAuthenticated) return;

    settingsService.getFullSettings()
      .then((settings) => {
        if (settings.emailNotifications !== undefined) {
          setEmailNotifications(settings.emailNotifications);
        }
        if (settings.screenNotifications !== undefined) {
          setScreenNotifications(settings.screenNotifications);
        }
        if (settings.theme) {
          setTheme(settings.theme);
        }
      })
      .catch((err) => {
        console.error("[ThemeContext] Failed to fetch settings from BE:", err);
      });
  }, [isAuthenticated]);

  const updateEmailNotifications = async (val: boolean) => {
    setEmailNotifications(val);
    try {
      await settingsService.updateSettings({ emailNotifications: val });
    } catch (err) {
      console.error("[ThemeContext] Failed to update emailNotifications:", err);
    }
  };

  const updateScreenNotifications = async (val: boolean) => {
    setScreenNotifications(val);
    try {
      await settingsService.updateSettings({ screenNotifications: val });
    } catch (err) {
      console.error("[ThemeContext] Failed to update screenNotifications:", err);
    }
  };

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

        setTheme((currentTheme) => {
          const nextTheme = currentTheme === "light" ? "dark" : "light";
          settingsService.updateTheme(nextTheme).catch((err) => {
            console.error("[ThemeContext] Failed to update theme on BE:", err);
          });
          return nextTheme;
        });

        finishTransitionTimerRef.current = window.setTimeout(() => {
          setIsThemeTransitioning(false);
        }, 220);
      },
      setEmailNotifications: updateEmailNotifications,
      setScreenNotifications: updateScreenNotifications,
    }),
    [emailNotifications, isThemeTransitioning, screenNotifications, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
