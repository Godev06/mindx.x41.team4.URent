import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "./ThemeContextObject";
import { getStoredAuthToken } from "../../../../lib/api/tokenStorage";
import { notificationService } from "../../notifications/services/notificationService";
import { apiClient } from "../../../../lib/api/apiClient";

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
    const token = getStoredAuthToken();
    if (!token) return;

    notificationService.getNotificationSettings()
      .then((res) => {
        if (res.data) {
          if (res.data.emailNotifications !== undefined) {
            setEmailNotifications(res.data.emailNotifications);
          }
          if (res.data.screenNotifications !== undefined) {
            setScreenNotifications(res.data.screenNotifications);
          }
          if (res.data.theme !== undefined) {
            setTheme(res.data.theme);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch notification settings from BE:", err);
      });
  }, []);

  const updateEmailNotifications = async (val: boolean) => {
    setEmailNotifications(val);
    const token = getStoredAuthToken();
    if (token) {
      try {
        await notificationService.updateNotificationSettings({ emailNotifications: val });
      } catch (err) {
        console.error("Failed to update email settings:", err);
      }
    }
  };

  const updateScreenNotifications = async (val: boolean) => {
    setScreenNotifications(val);
    const token = getStoredAuthToken();
    if (token) {
      try {
        await notificationService.updateNotificationSettings({ screenNotifications: val });
      } catch (err) {
        console.error("Failed to update screen settings:", err);
      }
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
          const token = getStoredAuthToken();
          if (token) {
            apiClient.patch("/api/v1/settings", { theme: nextTheme }).catch((err) => {
              console.error("Failed to update theme on BE:", err);
            });
          }
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
