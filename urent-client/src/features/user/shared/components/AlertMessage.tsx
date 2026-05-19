interface AlertMessageProps {
  title?: string;
  message: string;
  variant?: "error" | "success" | "info";
}

const styles = {
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/60 dark:text-red-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/60 dark:text-emerald-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/60 dark:text-sky-300",
};

export function AlertMessage({
  title,
  message,
  variant = "error",
}: AlertMessageProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className={title ? "mt-1" : ""}>{message}</p>
    </div>
  );
}
