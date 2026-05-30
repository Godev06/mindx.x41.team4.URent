interface SettingSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function SettingSwitch({
  checked,
  onChange,
  disabled = false,
  id,
}: SettingSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${checked ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
        } ${disabled ? "cursor-wait opacity-70" : "cursor-pointer"}`}
    >
      {/* Visual slide dot */}
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );
}
