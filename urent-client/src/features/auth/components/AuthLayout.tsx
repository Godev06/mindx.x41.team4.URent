import { useEffect, useState, type PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/authService";
import { normalizeApiError } from "../../../lib/api/apiError";
import { useI18n } from "../../shared/context/LanguageContext";
import { useTheme } from "../../settings/hooks/useTheme";

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  footer?: React.ReactNode;
}

export function AuthLayout({
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [healthMessage, setHealthMessage] = useState(
    "Đang kiểm tra backend...",
  );
  const [healthOk, setHealthOk] = useState(false);

  useEffect(() => {
    let active = true;

    void authService
      .checkHealth()
      .then((result) => {
        if (!active) {
          return;
        }

        setHealthOk(result.ok);
        setHealthMessage(result.message);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setHealthOk(false);
        setHealthMessage(normalizeApiError(error).message);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={`min-h-screen px-4 py-6 antialiased sm:px-6 lg:px-10 ${
        theme === "dark"
          ? "bg-[#0a0c10] text-slate-200"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
          <section className="space-y-5 lg:col-span-6">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-[#00bfa5]/20 bg-[#00bfa5]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#00bfa5]">
                {t.layoutBadge}
              </div>
              <h1
                className={`text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                {t.layoutHeroLine1}
                <br />
                <span className="bg-linear-to-r from-[#00bfa5] to-[#00d4ff] bg-clip-text text-transparent">
                  {t.layoutHeroLine2}
                </span>
              </h1>
              <p
                className={`max-w-lg text-sm leading-6 ${
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {t.layoutSubtitle}
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                theme === "dark"
                  ? "border border-slate-700 bg-slate-900/70 text-slate-300"
                  : "border border-slate-200 bg-white text-slate-600 shadow-sm"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  healthOk ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {healthOk ? t.backendHealthy : healthMessage}
            </div>
          </section>

          <section className="lg:col-span-6">
            <div
              className={`relative rounded-4xl p-px shadow-2xl ${
                theme === "dark"
                  ? "bg-linear-to-b from-slate-700 to-transparent"
                  : "bg-linear-to-b from-slate-300 to-transparent"
              }`}
            >
              <div
                className={`relative overflow-hidden rounded-[31px] p-5 sm:p-6 md:p-8 ${
                  theme === "dark" ? "bg-[#0d1117]" : "bg-white"
                }`}
              >
                <div
                  className={`absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#00bfa5] blur-3xl ${
                    theme === "dark" ? "opacity-[0.05]" : "opacity-[0.08]"
                  }`}
                />

                <div className="mb-6 flex items-center justify-between">
                  <Link to="/" className="inline-flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00bfa5] shadow-lg shadow-[#00bfa5]/20">
                      <span className="text-xl font-black italic text-white">
                        U
                      </span>
                    </div>
                    <span
                      className={`text-xl font-bold tracking-tight ${
                        theme === "dark" ? "text-white" : "text-slate-900"
                      }`}
                    >
                      U-Rent{" "}
                      <span
                        className={`font-normal ${
                          theme === "dark" ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Connect
                      </span>
                    </span>
                  </Link>
                </div>

                <div className="mb-6">
                  <h2
                    className={`mb-2 text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {title}
                  </h2>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {description}
                  </p>
                </div>

                <div>{children}</div>

                {footer ? (
                  <div
                    className={`mt-6 border-t pt-5 text-sm ${
                      theme === "dark"
                        ? "border-slate-800 text-slate-400"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {footer}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
