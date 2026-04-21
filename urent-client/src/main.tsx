import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { ThemeProvider } from "./features/settings/context/ThemeContext";
import { ToastProvider } from "./features/shared/components/ToastProvider";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { LanguageProvider } from "./features/shared/context/LanguageContext.ts";
import "./index.css";
import App from "./App.tsx";

if (import.meta.env.PROD && !window.location.hash) {
  const { pathname, search } = window.location;
  if (pathname && pathname !== "/") {
    const hashPath = `#${pathname}${search}`;
    window.history.replaceState(
      null,
      "",
      `${window.location.origin}/${hashPath}`,
    );
  }
}

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  </StrictMode>,
);
