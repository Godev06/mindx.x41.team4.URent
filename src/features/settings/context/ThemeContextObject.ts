import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  isThemeTransitioning: boolean;
  emailNotifications: boolean;
  screenNotifications: boolean;
  toggleTheme: () => void;
  setEmailNotifications: (enabled: boolean) => void;
  setScreenNotifications: (enabled: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
