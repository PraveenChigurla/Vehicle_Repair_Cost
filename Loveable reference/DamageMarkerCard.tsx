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
      className="pointer-events-none absolute left-0 top-0"
      style={{ willChange: "transform", opacity: 0 }}
    >
      <div
        className={`min-w-[118px] rounded-lg border border-white/10 bg-[#050a13]/95 px-3 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] ring-1 ${sev.ring}`}
      >
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-100">
          {part.part}
        </div>
        <div className={`text-[10px] font-semibold uppercase ${sev.text}`}>{part.severity}</div>
        <div className="mt-0.5 font-mono text-[11px] text-cyan-300">{inr(part.estimate)}</div>
      </div>
    </div>
  );
}