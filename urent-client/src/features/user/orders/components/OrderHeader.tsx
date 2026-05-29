import React from "react";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../shared/context/LanguageContext";
import { useNavigate } from "react-router-dom";

interface OrderHeaderProps {
  title: string;
  subtitle: string;
  statusNow: string;
  statusBadge: string;
  onBack?: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  title,
  subtitle,
  statusNow,
  statusBadge,
  onBack,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/orders");
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/4 sm:p-6 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/10 glass-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{statusNow}</p>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-tight text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {statusBadge}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleBack}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft size={16} />
        {t.orderDetailBack}
      </button>
    </div>
  );
};

export default OrderHeader;
