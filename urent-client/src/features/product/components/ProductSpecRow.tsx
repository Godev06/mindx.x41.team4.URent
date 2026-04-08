import { CheckCircle2 } from "lucide-react";

interface ProductSpecRowProps {
  text: string;
}

export function ProductSpecRow({ text }: ProductSpecRowProps) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={2} />
      <span>{text}</span>
    </li>
  );
}
