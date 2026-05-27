import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isError?: boolean;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  isError = false,
}: OtpInputProps) {
  const length = 6;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpValues = Array.from({ length }, (_, i) => value[i] || "");

  // Handle auto-focus behavior when component mounts or changes state
  useEffect(() => {
    // Auto-focus the first box if value is empty and input is enabled
    if (value === "" && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [value, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    const cleanVal = val.replace(/\D/g, "");
    
    if (!cleanVal) {
      // If cleared, update the value
      const newOtpArray = [...otpValues];
      newOtpArray[index] = "";
      onChange(newOtpArray.join(""));
      return;
    }

    // Take the last typed character
    const char = cleanVal[cleanVal.length - 1];
    const newOtpArray = [...otpValues];
    newOtpArray[index] = char;
    const newValue = newOtpArray.join("");
    onChange(newValue);

    // Auto-focus next box if not at the end
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      
      const newOtpArray = [...otpValues];
      
      if (otpValues[index]) {
        // If current box has a value, clear it
        newOtpArray[index] = "";
        onChange(newOtpArray.join(""));
      } else if (index > 0) {
        // If current box is empty, clear the previous box and move focus back
        newOtpArray[index - 1] = "";
        onChange(newOtpArray.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (/^[0-9]$/.test(e.key)) {
      // Overwrite current character and move to next
      e.preventDefault();
      const newOtpArray = [...otpValues];
      newOtpArray[index] = e.key;
      onChange(newOtpArray.join(""));
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    const pastedData = e.clipboardData.getData("text");
    const cleanData = pastedData.replace(/\D/g, "").slice(0, length);
    onChange(cleanData);
    
    // Focus the last filled box or the last box overall
    const targetIndex = Math.min(cleanData.length, length - 1);
    inputRefs.current[targetIndex]?.focus();
  };

  return (
    <div className="flex w-full justify-between items-center gap-2 sm:gap-3 py-2">
      {otpValues.map((char, index) => {
        const isActive = value.length === index || (value.length === length && index === length - 1);
        
        let borderClass = "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600";
        if (isError) {
          borderClass = "border-red-500 bg-red-50/50 dark:border-red-500/50 dark:bg-red-500/10 hover:border-red-600 dark:hover:border-red-400";
        } else if (isActive && !disabled) {
          borderClass = "border-teal-500 ring-4 ring-teal-500/10 dark:border-teal-400 dark:ring-teal-400/10 bg-white dark:bg-slate-900";
        }

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-extrabold text-slate-800 dark:text-white rounded-2xl border outline-none transition-all duration-200 select-none scale-100 focus:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${borderClass}`}
          />
        );
      })}
    </div>
  );
}
