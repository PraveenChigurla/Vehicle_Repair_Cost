import { SEVERITY_COLOR, inr, resolveZone, type DamagePart } from "@/lib/vehicle-damage";

export function DamageBreakdown({ parts }: { parts: DamagePart[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
          DAMAGE BREAKDOWN
        </span>
        <span className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-mono">{parts.length} parts detected</span>
      </div>

      <div className="max-h-[350px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {parts.map((p, i) => {
          const sev = SEVERITY_COLOR[p.severity];
          return (
            <div
              key={`${p.part}-${i}`}
              className="group relative overflow-hidden border border-[var(--border)] border-l-2 bg-[var(--panel)]/40 p-3 transition-colors hover:bg-[var(--panel)]"
              style={{ borderLeftColor: sev.dot }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold uppercase tracking-wider text-[#F1F5F9]">{p.part}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wide text-[#94A3B8]">
                    {resolveZone(p)}
                  </div>
                </div>
                <span
                  className={`shrink-0 border border-transparent px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${sev.bg} ${sev.text}`}
                  style={{ borderColor: `${sev.dot}40` }}
                >
                  {p.severity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] sm:grid-cols-4">
                <Metric label="Yolo Conf." value={`${Math.round(p.yoloConf * 100)}%`} />
                <Metric label="Sev. Conf." value={`${Math.round(p.severityConf * 100)}%`} />
                <Metric label="Area" value={`${Math.round(p.areaRatio * 100)}%`} />
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
      <div className="text-[9px] uppercase tracking-widest text-[#94A3B8]">{label}</div>
      <div className={`font-mono text-[10px] mt-0.5 ${accent ? "text-[#00D9FF] font-semibold drop-shadow-[0_0_8px_rgba(0,217,255,0.4)]" : "text-[#F1F5F9]"}`}>{value}</div>
    </div>
  );
}