import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { authUi } from "../styles";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showLeftIcon?: boolean;
}

export function PasswordInput({ showLeftIcon = true, className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Use base input styles, but customize padding for icons
  const baseInputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#00bfa5] focus:ring-2 focus:ring-[#00bfa5]/30 dark:border-slate-700 dark:bg-[#161b22] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#00bfa5] dark:focus:ring-[#00bfa5]/40";
    
  const inputClass = `${baseInputClass} ${showLeftIcon ? "pl-12" : "pl-4"} pr-12 ${className || ""}`;

  return (
    <div className={authUi.inputIconWrapper}>
      {showLeftIcon && <Lock className={authUi.inputIconClass} size={18} />}
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={inputClass}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#00bfa5] dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-[#00bfa5]"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
