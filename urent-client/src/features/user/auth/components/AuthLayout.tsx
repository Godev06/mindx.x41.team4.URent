import { useEffect, useState, type PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/authService";
import { normalizeApiError } from "../../../../lib/api/apiError";
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
        console.log(
          `%c[System Status] API is ${result.ok ? "ONLINE" : "DEGRADED"}`,
          `color: ${result.ok ? "#10b981" : "#f59e0b"}; font-weight: bold;`
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setHealthOk(false);
        const msg = normalizeApiError(error).message;
        setHealthMessage(msg);
        console.log(
          `%c[System Status] API is OFFLINE: ${msg}`,
          "color: #ef4444; font-weight: bold;"
        );
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={`min-h-screen px-4 py-6 antialiased sm:px-6 lg:px-10 ${theme === "dark"
          ? "bg-[#0a0c10] text-slate-200"
          : "bg-slate-100 text-slate-700"
        }`}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-[90%] items-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
          <section className="space-y-5 lg:col-span-6">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-[#00bfa5]/20 bg-[#00bfa5]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#00bfa5]">
                {t.layoutBadge}
              </div>
              <h1
                className={`text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl ${theme === "dark" ? "text-white" : "text-slate-900"
                  }`}
              >
                {t.layoutHeroLine1}
                <br />
                <span className="bg-linear-to-r from-[#00bfa5] to-[#00d4ff] bg-clip-text text-transparent">
                  {t.layoutHeroLine2}
                </span>
              </h1>
              <p
                className={`max-w-lg text-sm leading-6 ${theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
              >
                {t.layoutSubtitle}
              </p>
            </div>

            {/* Vùng ẩn trạng thái: Trở nên tàng hình với user thường (opacity-0), chỉ dev biết vị trí rê chuột vào mới hiện lên */}
            <div className="w-fit">
              <div
                className={`group inline-flex cursor-default items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-500 opacity-0 hover:opacity-100 ${
                  theme === "dark"
                    ? "bg-slate-800/40 text-slate-400"
                    : "bg-white/60 text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                }`}
              >
                <div className="relative flex h-2 w-2 items-center justify-center">
                  {healthOk && (
                    <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-emerald-400 opacity-20 duration-1000 group-hover:opacity-40" />
                  )}
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                      healthOk ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </div>
                <span className="tracking-wide select-none">
                  {healthOk ? t.backendHealthy : healthMessage}
                </span>
              </div>
            </div>
          </section>

          <section className="lg:col-span-6">
            <div
              className={`relative rounded-4xl p-px shadow-2xl ${theme === "dark"
                  ? "bg-linear-to-b from-slate-700 to-transparent"
                  : "bg-linear-to-b from-slate-300 to-transparent"
                }`}
            >
              <div
                className={`relative overflow-hidden rounded-[31px] p-5 sm:p-6 md:p-8 ${theme === "dark" ? "bg-[#0d1117]" : "bg-white"
                  }`}
              >
                <div
                  className={`absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#00bfa5] blur-3xl ${theme === "dark" ? "opacity-[0.05]" : "opacity-[0.08]"
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
                      className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    >
                      U-Rent{" "}
                      <span
                        className={`font-normal ${theme === "dark" ? "text-slate-500" : "text-slate-400"
                          }`}
                      >
                        Connect
                      </span>
                    </span>
                  </Link>
                </div>

                <div className="mb-6">
                  <h2
                    className={`mb-2 text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"
                      }`}
                  >
                    {title}
                  </h2>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"
                      }`}
                  >
                    {description}
                  </p>
                </div>

                <div>{children}</div>

                {footer ? (
                  <div
                    className={`mt-6 border-t pt-5 text-sm ${theme === "dark"
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
