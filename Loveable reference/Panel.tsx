import type { ReactNode } from "react";

export function Panel({
  title,
  icon,
  right,
  className = "",
  bodyClassName = "p-5",
  children,
}: {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-cyan-500/10 bg-[#0a0f1c]/80 backdrop-blur ${className}`}
    >
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2 text-slate-200">
            {icon}
            <span className="text-[13px] font-semibold uppercase tracking-wide">{title}</span>
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
      className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-rose-400"} shadow-[0_0_8px_currentColor]`}
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