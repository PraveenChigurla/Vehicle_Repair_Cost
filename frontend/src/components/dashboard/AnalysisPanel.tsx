import { IndianRupee } from "lucide-react";

import { DamageBreakdown } from "./DamageBreakdown";

import { inr, type VehicleDamageData } from "@/lib/vehicle-damage";

export function AnalysisPanel({ data }: { data: VehicleDamageData }) {
  const totalCost = data.parts.reduce((s, p) => s + p.estimate, 0);

  return (
    <div className="space-y-4">
      <div className="rounded border border-[var(--border)] bg-gradient-to-br from-[#7C3CFF]/10 to-[#00D9FF]/5 p-5 shadow-[0_0_20px_rgba(0,217,255,0.1)] backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9FF]/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00D9FF]">
          <IndianRupee size={12} /> TOTAL ESTIMATED REPAIR COST
        </div>
        <div className="mt-2 text-4xl font-extrabold tracking-tighter text-[#F1F5F9] drop-shadow-[0_0_10px_rgba(0,217,255,0.3)]">
          {inr(totalCost)}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-[#94A3B8] uppercase tracking-wide">
          Model-generated estimate. Actual repair costs may vary by vehicle model, parts availability, labor rates and service provider.
        </p>
      </div>

      <DamageBreakdown parts={data.parts} />
    </div>
  );
}