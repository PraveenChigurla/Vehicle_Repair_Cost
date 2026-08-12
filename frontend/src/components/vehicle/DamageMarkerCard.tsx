import { SEVERITY_COLOR, inr, type DamagePart } from "@/lib/vehicle-damage";

/** Floating information card for a damage marker. Positioned every frame
 *  from the projected 3D anchor by Vehicle3D. */
export function DamageMarkerCard({
  part,
  cardRef,
}: {
  part: DamagePart;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const sev = SEVERITY_COLOR[part.severity];
  return (
    <div
      ref={cardRef}
      data-damage-card=""
      className="group pointer-events-none absolute left-0 top-0"
      style={{ willChange: "transform", opacity: 0 }}
    >
      <div
        className={`min-w-[130px] rounded border border-[var(--border)] border-l-2 bg-[var(--panel)]/90 px-3 py-2 shadow-lg backdrop-blur-md`}
        style={{ borderLeftColor: sev.dot }}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#F1F5F9]">
            {part.part}
          </div>
          <div className="text-[9px] text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity">
            {Math.round(part.yoloConf * 100)}%
          </div>
        </div>
        <div className={`text-[9px] font-semibold uppercase tracking-widest ${sev.text}`}>
          {part.severity}
        </div>
        <div className="mt-1 font-mono text-[12px] font-medium text-[#F1F5F9]">
          {inr(part.estimate)}
        </div>
      </div>
    </div>
  );
}