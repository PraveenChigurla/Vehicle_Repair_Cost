import { Check, Circle, Loader2 } from "lucide-react";
import { Fragment } from "react";

export const STEPS = ["Upload", "Detect", "Severity", "Estimate", "Report"] as const;

export function Stepper({ current = 3 }: { current?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  done
                    ? "bg-[#00D9FF]/20 text-[#00D9FF] shadow-[0_0_10px_rgba(0,217,255,0.4)]"
                    : active
                      ? "bg-[#7C3CFF]/20 text-[#7C3CFF] ring-1 ring-[#7C3CFF] shadow-[0_0_15px_rgba(124,60,255,0.6)] animate-glow-pulse"
                      : "bg-white/5 text-[#94A3B8]"
                }`}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} />
                ) : active ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Circle size={6} fill="currentColor" />
                )}
              </div>
              <span
                className={`text-[11px] uppercase tracking-wide ${
                  active
                    ? "font-semibold text-[#7C3CFF]"
                    : done
                      ? "text-[#00D9FF]"
                      : "text-[#94A3B8]"
                }`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`h-px w-6 ${i < current ? "bg-[#00D9FF] shadow-[0_0_8px_rgba(0,217,255,0.6)]" : "bg-[#94A3B8]/20"}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}