import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  Search,
  FileDown,
  X,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  MapPin,
  Globe,
  Check,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  User,
  KeyRound,
  Sliders,
  Shield,
  Clock,
  Trash2
} from "lucide-react";
import { SETTINGS_TOKENS } from "../utils/styleTokens";
import { useToast } from "../../shared/hooks/useToast";
import { settingsService } from "../services/settingsService";
import { PageLoader } from "../../shared/components/PageLoader";

interface ActivityLogsSectionProps {
  t: Record<string, string>;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export function ActivityLogsSection({
  t,
}: ActivityLogsSectionProps) {
  const { showToast } = showToastFromHook();

  // Helper to safely access useToast since its interface might return showing directly
  function showToastFromHook() {
    try {
      const toast = useToast();
      return { showToast: toast.showToast };
    } catch {
      return { showToast: () => {} };
    }
  }

  // Database activity logs and active device sessions states
  const [logs, setLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  
  // Loading & Action states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);

  // UI Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch activities and sessions dynamically from backend on mount
  const loadDashboardData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setIsLoadingData(true);
    }
    try {
      const [fetchedLogs, fetchedSessions] = await Promise.all([
        settingsService.getActivities(),
        settingsService.getSessions(),
      ]);
      setLogs(fetchedLogs);
      setSessions(fetchedSessions);
    } catch (err) {
      console.error("Failed to load activity logs from backend:", err);
      showToast({
        title: "Lỗi máy chủ",
        description: "Không thể lấy nhật ký hoạt động từ backend.",
        variant: "error",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void loadDashboardData(true);
  }, []);

  // Filter pills categories definition
  const filterPills = useMemo(() => [
    { key: "all", label: t.settingsActivityFilterAll ?? "Tất cả" },
    { key: "login", label: t.settingsActivityFilterLogin ?? "Đăng nhập" },
    { key: "password_change", label: t.settingsActivityFilterSecurity ?? "Bảo mật & Mật khẩu" },
    { key: "settings_change", label: t.settingsActivityFilterSettings ?? "Cài đặt" },
    { key: "profile_update", label: t.settingsActivityFilterProfile ?? "Hồ sơ" },
  ], [t]);

  // Log Type Icon Mapper
  const getLogIcon = (type: string) => {
    switch (type) {
      case "login":
        return <Globe size={16} className="text-emerald-500" />;
      case "password_change":
        return <KeyRound size={16} className="text-amber-500" />;
      case "settings_change":
        return <Sliders size={16} className="text-indigo-500" />;
      case "profile_update":
        return <User size={16} className="text-sky-500" />;
      default:
        return <Activity size={16} className="text-teal-500" />;
    }
  };

  // Log Risk Color Mapper
  const getRiskBadge = (level?: string) => {
    const defaultLevel = level || "safe";
    switch (defaultLevel) {
      case "safe":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <Check size={10} /> {t.settingsActivityRiskSafe ?? "An toàn"}
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
            <ShieldCheck size={10} /> {t.settingsActivityRiskLow ?? "Rủi ro thấp"}
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle size={10} /> {t.settingsActivityRiskMedium ?? "Cần chú ý"}
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
            <Shield size={10} /> {t.settingsActivityRiskHigh ?? "Nguy hiểm"}
          </span>
        );
      default:
        return null;
    }
  };

  // Live filter & search processing
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesFilter = selectedFilter === "all" || log.type === selectedFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term) ||
        (log.ip && log.ip.includes(term)) ||
        (log.location && log.location.toLowerCase().includes(term)) ||
        (log.device && log.device.toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [logs, selectedFilter, searchQuery]);

  // Export logs to JSON
  const handleExportLogs = async () => {
    setIsExporting(true);
    // Simulate premium visual compile delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `urent_activity_logs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast({
        title: t.settingsActivityExportSuccess ?? "Xuất báo cáo thành công!",
        description: `Đã xuất ${filteredLogs.length} sự kiện hoạt động ra file JSON.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Export logs error:", err);
      showToast({
        title: "Lỗi xuất báo cáo",
        description: "Không thể khởi tạo tệp báo cáo lúc này.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Revoke other device sessions bulk
  const handleRevokeAllOthers = async () => {
    setIsRevokingAll(true);
    setShowRevokeAllConfirm(false);
    try {
      await settingsService.revokeAllOtherSessions();
      // Re-fetch backend sessions and activities (to include logout event!)
      await loadDashboardData(false);
      showToast({
        title: t.settingsActivitySignOutSuccess ?? "Đăng xuất thành công!",
        description: "Đã hủy tất cả các phiên đăng nhập khác an toàn.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to revoke other sessions:", err);
      showToast({
        title: "Lỗi đăng xuất thiết bị",
        description: "Không thể đăng xuất khỏi các thiết bị khác.",
        variant: "error",
      });
    } finally {
      setIsRevokingAll(false);
    }
  };

  // Revoke single device session
  const handleRevokeSingle = async (id: string, deviceName: string) => {
    setRevokingId(id);
    try {
      await settingsService.revokeSession(id);
      // Re-fetch backend sessions and activities (to include logout event!)
      await loadDashboardData(false);
      showToast({
        title: t.settingsActivityRevokeSuccess ?? "Đã đăng xuất thiết bị!",
        description: `Phiên đăng nhập trên ${deviceName} đã bị thu hồi.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to revoke session:", err);
      showToast({
        title: "Lỗi thu hồi phiên",
        description: "Không thể đăng xuất từ xa thiết bị này.",
        variant: "error",
      });
    } finally {
      setRevokingId(null);
    }
  };

  // Clear all database activities
  const handleClearLogs = async () => {
    if (!window.confirm(t.settingsActivityClearConfirm ?? "Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động bảo mật không?")) {
      return;
    }
    setIsClearing(true);
    try {
      await settingsService.clearActivities();
      // Re-fetch (this will fetch and record the "Xóa nhật ký" activity event!)
      await loadDashboardData(false);
      showToast({
        title: "Đã xóa lịch sử",
        description: "Toàn bộ lịch sử bảo mật đã được xóa sạch và ghi nhận.",
        variant: "success",
      });
    } catch (err) {
      console.error("Clear logs error:", err);
      showToast({
        title: "Lỗi xóa nhật ký",
        description: "Không thể làm sạch lịch sử hoạt động bảo mật.",
        variant: "error",
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="py-24 flex flex-col justify-center items-center">
        <PageLoader inline label="Đang tải dữ liệu lịch sử hoạt động..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Active Device Sessions Management Board */}
      <div className={SETTINGS_TOKENS.card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              <Monitor size={12} />
              Session Monitor
            </div>
            <h3 className={`mt-3 text-lg font-semibold ${SETTINGS_TOKENS.text.strong}`}>
              {t.settingsActivitySessionsTitle ?? "Thiết bị đang hoạt động"}
            </h3>
            <p className={`mt-1 text-sm ${SETTINGS_TOKENS.text.muted}`}>
              {t.settingsActivitySessionsDesc ?? "Quản lý các trình duyệt và thiết bị đang đăng nhập vào tài khoản của bạn."}
            </p>
          </div>

          {sessions.filter(s => !s.isCurrent).length > 0 && (
            <button
              type="button"
              disabled={isRevokingAll}
              onClick={() => setShowRevokeAllConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isRevokingAll ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-rose-600" />
              ) : (
                <LogOut size={14} />
              )}
              {t.settingsActivitySignOutOthers ?? "Đăng xuất khỏi thiết bị khác"}
            </button>
          )}
        </div>

        {/* Sessions Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                session.isCurrent
                  ? "border-teal-500 bg-teal-50/10 shadow-xs dark:bg-teal-500/5"
                  : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/30 dark:border-slate-800/80 dark:bg-slate-900/25 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      session.isCurrent
                        ? "bg-teal-100 text-teal-700 ring-teal-200/50 dark:bg-teal-500/20 dark:text-teal-300 dark:ring-teal-500/30"
                        : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
                    }`}
                  >
                    {session.device.toLowerCase().includes("iphone") || session.device.toLowerCase().includes("mobile") ? (
                      <Smartphone size={18} />
                    ) : (
                      <Monitor size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                      {session.device}
                    </h4>
                    <p className={`text-xs ${SETTINGS_TOKENS.text.muted}`}>{session.browser}</p>
                  </div>
                </div>

                {session.isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                    {t.settingsCurrent ?? "Current"}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={revokingId === session.id}
                    onClick={() => handleRevokeSingle(session.id, session.device)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer disabled:cursor-not-allowed"
                    title={t.settingsCancel ?? "Log out"}
                  >
                    {revokingId === session.id ? (
                      <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500" />
                    ) : (
                      <LogOut size={14} />
                    )}
                  </button>
                )}
              </div>

              {/* Technical location & IP metrics */}
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{session.location}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-mono">{session.ip}</span>
                  {!session.isCurrent && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} />
                      {session.lastActive}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Modal confirmation popup inside container */}
        {showRevokeAllConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/20 dark:bg-slate-900/40 rounded-3xl transition duration-300 animate-fade-in">
            <div className="max-w-md w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-700/80 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertTriangle size={22} />
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                {t.settingsActivitySignOutOthers ?? "Đăng xuất khỏi thiết bị khác?"}
              </h4>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t.settingsActivitySignOutOthersConfirm ?? "Bạn có chắc chắn muốn đăng xuất tài khoản khỏi toàn bộ các thiết bị khác không?"}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRevokeAllConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  {t.commonCancel ?? "Hủy"}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAllOthers}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
                >
                  {t.settingsActivitySignOutOthers ?? "Đăng xuất"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Activity Logs timeline list */}
      <div className={SETTINGS_TOKENS.card}>
        
        {/* Header containing the actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${SETTINGS_TOKENS.text.muted}`}>
              {t.settingsTabActivity ?? "Activity"}
            </p>
            <h3 className={`mt-2 text-lg font-semibold ${SETTINGS_TOKENS.text.strong}`}>
              {t.settingsActivityTitle ?? "Lịch sử hoạt động"}
            </h3>
            <p className={`mt-1 text-sm leading-6 ${SETTINGS_TOKENS.text.muted}`}>
              {t.settingsActivityDesc ?? "Monitor logs of security changes and active logins."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearLogs}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:border-rose-500/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                title="Xóa lịch sử"
              >
                {isClearing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-rose-500" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span>{t.settingsActivityClearLogs ?? "Xóa lịch sử"}</span>
              </button>
            )}

            <button
              type="button"
              disabled={isExporting || filteredLogs.length === 0}
              onClick={handleExportLogs}
              className={`${SETTINGS_TOKENS.interactive.buttonSecondary} inline-flex items-center gap-2 px-4 py-2.5 cursor-pointer disabled:cursor-not-allowed`}
            >
              {isExporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500" />
              ) : (
                <FileDown size={15} />
              )}
              <span>{t.settingsActivityExportBtn ?? "Xuất lịch sử"}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Pill row */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-t border-slate-100 pt-6 dark:border-slate-800/80">
          
          {/* Pills filters list */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setSelectedFilter(pill.key)}
                className={`inline-flex shrink-0 items-center justify-center rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedFilter === pill.key
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700/60"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search bar input container */}
          <div className="relative w-full lg:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.settingsActivitySearchPlaceholder ?? "Tìm hành động, địa điểm, IP..."}
              className="w-full rounded-xl border border-slate-200 bg-white/40 pl-9 pr-8 py-2 text-xs text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/5 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-200 dark:focus:border-teal-500 dark:focus:bg-slate-900/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Log elements lists */}
        {filteredLogs.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600">
              <Activity size={20} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Không tìm thấy hoạt động nào
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn.
            </p>
          </div>
        ) : (
          <div className="relative mt-8 pl-4 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-slate-200/60 dark:before:bg-slate-800/60">
            <div className="space-y-5">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log._id;

                // Format timestamp nicely for UI
                const dateObj = new Date(log.timestamp);
                const timeStr = isNaN(dateObj.getTime())
                  ? log.timestamp
                  : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;

                return (
                  <div key={log._id || log.id} className="relative transition-all duration-300">
                    
                    {/* Floating circular node icon */}
                    <div className="absolute -left-[27px] top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-xs ring-1 ring-slate-200 dark:ring-slate-800 transition duration-300 hover:scale-110">
                      {getLogIcon(log.type)}
                    </div>

                    {/* Timeline card containing core item data */}
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : (log._id || log.id))}
                      className={`rounded-2xl border p-4 transition-all duration-200 cursor-pointer hover:border-slate-300/80 hover:bg-slate-100/10 dark:hover:border-slate-700/80 dark:hover:bg-slate-800/10 ${
                        isExpanded
                          ? "border-teal-500/40 bg-teal-50/5 dark:border-teal-500/20 dark:bg-teal-500/5 shadow-xs"
                          : "border-slate-200/70 bg-slate-50/40 dark:border-slate-800/50 dark:bg-slate-900/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-semibold ${SETTINGS_TOKENS.text.strong}`}>
                              {log.action}
                            </h4>
                            {log.device && (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {log.device.split(" / ")[0]}
                              </span>
                            )}
                            {getRiskBadge(log.riskLevel)}
                          </div>
                          <p className={`mt-1 text-xs leading-relaxed ${SETTINGS_TOKENS.text.muted}`}>
                            {log.description}
                          </p>
                          <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                            {timeStr}
                          </p>
                        </div>

                        <div className="text-slate-400 dark:text-slate-500">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Expandable technical details accordion drawer */}
                      {isExpanded && (
                        <div
                          className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800/80 grid gap-3 sm:grid-cols-2 text-xs animate-fade-in"
                          onClick={(e) => e.stopPropagation()} // Prevent bubble closure
                        >
                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                IP Address
                              </span>
                              <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                                {log.ip || "127.0.0.1"}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Location (Estimated)
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                                <MapPin size={11} className="text-teal-500" />
                                {log.location || "Unknown"}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Browser User Agent Signature
                            </span>
                            <div className="mt-1 rounded-lg bg-slate-100 p-2 font-mono text-[9px] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400 break-all leading-normal border border-slate-200/50 dark:border-slate-800/50">
                              {log.userAgent || "Mozilla/5.0"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ActivityLogsSection;
