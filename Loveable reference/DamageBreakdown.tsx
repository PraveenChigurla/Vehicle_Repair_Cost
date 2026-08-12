import { SEVERITY_COLOR, inr, resolveZone, type DamagePart } from "@/lib/vehicle-damage";

export function DamageBreakdown({ parts }: { parts: DamagePart[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Damage Breakdown
        </span>
        <span className="text-[10px] text-slate-500">{parts.length} parts detected</span>
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
        {parts.map((p, i) => {
          const sev = SEVERITY_COLOR[p.severity];
          return (
            <div
              key={`${p.part}-${i}`}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-slate-100">{p.part}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wide text-slate-500">
                    {resolveZone(p)}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.bg} ${sev.text}`}
                >
                  {p.severity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                <Metric label="Yolo Conf." value={`${p.yoloConf}%`} />
                <Metric label="Severity Conf." value={`${p.severityConf}%`} />
                <Metric label="Area" value={`${p.areaRatio}%`} />
                <Metric label="Est. Repair" value={inr(p.estimate)} accent />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className={`font-mono ${accent ? "text-cyan-300" : "text-slate-200"}`}>{value}</div>
    </div>
  );
}