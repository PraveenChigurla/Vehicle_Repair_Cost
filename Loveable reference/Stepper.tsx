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
                    ? "bg-emerald-400 text-black"
                    : active
                      ? "bg-violet-500/20 text-violet-300 ring-2 ring-violet-400"
                      : "bg-white/5 text-slate-500"
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
                    ? "font-semibold text-violet-300"
                    : done
                      ? "text-slate-300"
                      : "text-slate-600"
                }`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`h-px w-5 ${i < current ? "bg-emerald-400/60" : "bg-white/10"}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}