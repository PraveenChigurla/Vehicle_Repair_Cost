import type { ReactNode } from "react";

export function Panel({
  title,
  icon,
  right,
  className = "",
  bodyClassName = "p-5",
  innerBgClassName = "bg-[var(--panel-elevated)]",
  borderColorClassName = "border-[var(--border)]",
  shadowClassName = "shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
  children,
}: {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  innerBgClassName?: string;
  borderColorClassName?: string;
  shadowClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative rounded border ${borderColorClassName} ${shadowClassName} overflow-hidden ${className}`}
    >
      <div className={`absolute inset-0 ${innerBgClassName} pointer-events-none`} />
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 bg-[#050914]/40">
          <div className="flex items-center gap-2 text-[#F1F5F9]">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
          </div>
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export function StatusDot({ ok = true }: { ok?: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-[#00D6A3]" : "bg-[#FF245C]"} shadow-[0_0_8px_currentColor]`}
    />
  );
}

export function SimBadge({ label = "Simulated" }: { label?: string }) {
  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
      {label}
    </span>
  );
}