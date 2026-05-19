import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, KeyboardEvent, FormEvent } from "react";
import { ChevronLeft, MessageSquare, Timer, RefreshCw } from "lucide-react";

/**
 * Định nghĩa Props cho AuthLayout
 */
interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  theme?: "dark" | "light";
}

/**
 * Giả lập AuthLayout với TypeScript
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  description,
  children,
  footer,
  theme = "dark",
}) => (
  <div
    className={`min-h-screen px-4 py-6 antialiased ${theme === "dark" ? "bg-[#0a0c10] text-slate-200" : "bg-slate-100 text-slate-700"}`}
  >
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
        <section className="space-y-5 lg:col-span-6 hidden lg:block">
          <div className="space-y-3">
            <h1 className="text-5xl font-extrabold text-white">
              Xác thực <br />
              <span className="bg-gradient-to-r from-[#00bfa5] to-[#00d4ff] bg-clip-text text-transparent">
                Tài khoản
              </span>
            </h1>
            <p className="text-slate-400">
              Vui lòng nhập mã bảo mật 6 chữ số đã được gửi đến thiết bị của bạn
              để tiếp tục.
            </p>
          </div>
        </section>
        <section className="lg:col-span-6 w-full">
          <div
            className={`relative rounded-[32px] p-px ${theme === "dark" ? "bg-gradient-to-b from-slate-700 to-transparent" : "bg-gradient-to-b from-slate-300 to-transparent"}`}
          >
            <div
              className={`relative overflow-hidden rounded-[31px] p-6 sm:p-8 ${theme === "dark" ? "bg-[#0d1117]" : "bg-white"}`}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-sm text-slate-400">{description}</p>
              </div>
              {children}
              {footer && (
                <div className="mt-6 border-t border-slate-800 pt-5 text-sm">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default function App() {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<number>(59);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Xử lý đếm ngược gửi lại mã
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendTimer]);

  // Focus vào ô tiếp theo mỗi khi activeOtpIndex thay đổi
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeOtpIndex]);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    const newOtp: string[] = [...otp];

    // Chỉ lấy ký tự cuối cùng nhập vào
    newOtp[activeOtpIndex] = value.substring(value.length - 1);

    if (!value) {
      // Nếu xóa, quay lại ô trước
      setActiveOtpIndex(activeOtpIndex - 1 >= 0 ? activeOtpIndex - 1 : 0);
    } else {
      // Nếu nhập, chuyển sang ô sau
      setActiveOtpIndex(activeOtpIndex + 1 < 6 ? activeOtpIndex + 1 : 5);
    }

    setOtp(newOtp);
  };

  const handleOnKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ): void => {
    if (e.key === "Backspace" && !otp[index]) {
      setActiveOtpIndex(index - 1 >= 0 ? index - 1 : 0);
    }
  };

  const handleVerify = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsSubmitting(true);

    const otpValue = otp.join("");
    // Giả lập gọi API
    setTimeout(() => {
      setIsSubmitting(false);
      console.log("OTP Submitted:", otpValue);
    }, 2000);
  };

  const handleResend = (): void => {
    if (resendTimer === 0) {
      setResendTimer(59);
      // Logic gửi lại mã ở đây
    }
  };

  return (
    <AuthLayout
      title="Nhập mã xác thực"
      description="Chúng tôi đã gửi mã OTP gồm 6 chữ số đến số điện thoại của bạn (***-***-88). Mã có hiệu lực trong 5 phút."
      footer={
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className={`flex items-center gap-2 font-medium transition-colors ${
              resendTimer > 0
                ? "text-slate-500 cursor-not-allowed"
                : "text-[#00bfa5] hover:text-[#00d4ff]"
            }`}
          >
            {resendTimer > 0 ? (
              <>
                <Timer className="w-4 h-4" />
                Gửi lại mã sau {resendTimer}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Gửi lại mã ngay
              </>
            )}
          </button>

          <button
            type="button"
            className="text-slate-500 hover:text-white flex items-center gap-1 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Thay đổi số điện thoại
          </button>
        </div>
      }
    >
      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-between gap-2 sm:gap-4">
          {otp.map((_, index) => (
            <input
              key={index}
              ref={index === activeOtpIndex ? inputRef : null}
              type="number"
              className={`w-full h-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none 
                ${
                  activeOtpIndex === index
                    ? "border-[#00bfa5] bg-[#00bfa5]/5 text-white shadow-[0_0_15px_rgba(0,191,165,0.2)]"
                    : "border-slate-800 bg-slate-900/50 text-slate-300"
                } 
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              onChange={handleOnChange}
              onKeyDown={(e) => handleOnKeyDown(e, index)}
              value={otp[index]}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || otp.some((v) => !v)}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
            ${
              isSubmitting || otp.some((v) => !v)
                ? "bg-slate-700 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-[#00bfa5] to-[#00d4ff] hover:shadow-lg hover:shadow-[#00bfa5]/20"
            }`}
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Xác nhận mã OTP"
          )}
        </button>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
          <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Lưu ý: Không chia sẻ mã xác thực này với bất kỳ ai, kể cả nhân viên
            hỗ trợ của U-Rent.
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
