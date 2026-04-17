import { useContext } from "react";
import type { LanguageContextValue } from "./LanguageContext";
import { LanguageContext } from "./LanguageContext";

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }

  return context;
}
