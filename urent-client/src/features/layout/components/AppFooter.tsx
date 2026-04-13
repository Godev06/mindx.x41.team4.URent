import { useNavigate } from "react-router-dom";
import { useI18n } from "../../shared/context/LanguageContext";

const currentYear = new Date().getFullYear();

export function AppFooter() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const navGroups = [
    {
      heading: t.footerNavHeading,
      links: [
        { label: t.footerNavHome, path: "/" },
        { label: t.footerNavOrders, path: "/orders" },
        { label: t.footerNavInventory, path: "/inventory" },
        { label: t.footerNavMessages, path: "/messages" },
      ],
    },
    {
      heading: t.footerAccountHeading,
      links: [
        { label: t.footerNavProfile, path: "/profile" },
        { label: t.footerNavSettings, path: "/settings" },
        { label: t.footerNavNotifications, path: "/notifications" },
      ],
    },
  ];

  return (
    <footer className="mt-10 border-t border-slate-200/80 dark:border-white/8 sm:mt-12">
      {/* Main footer body */}
      <div className="bg-slate-50/80 dark:bg-[#080d17]/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand col */}
            <div className="lg:col-span-2">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-900/20">
                  <img
                    src="/urent.png"
                    alt="U-Rent"
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    U-Rent
                  </p>
                  <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    {t.footerWorkspace}
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t.footerDescription}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 dark:border-teal-500/20 dark:bg-teal-500/10">
                <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_6px_var(--color-teal-400)]" />
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {t.footerStatus}
                </span>
              </div>
            </div>

            {/* Link groups */}
            {navGroups.map((group) => (
              <div key={group.heading} className="hidden md:block">
                <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  {group.heading}
                </p>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.path}>
                      <button
                        type="button"
                        onClick={() => navigate(link.path)}
                        className="text-sm text-slate-600 transition-colors hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200/80 bg-white/70 dark:border-white/6 dark:bg-[#060a12]/70 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-3 py-4 sm:flex-row sm:px-4">
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 sm:text-left">
            © {currentYear} {t.footerCopyrightSuffix}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-end sm:gap-x-4">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t.footerPrivacy}
            </span>
            <span className="hidden h-3 w-px bg-slate-300 dark:bg-white/15 sm:block" />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t.footerTerms}
            </span>
            <span className="hidden h-3 w-px bg-slate-300 dark:bg-white/15 sm:block" />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t.footerSupport}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
