import { IndianRupee } from "lucide-react";

import { DamageBreakdown } from "./DamageBreakdown";

import { inr, type VehicleDamageData } from "@/lib/vehicle-damage";

export function AnalysisPanel({ data }: { data: VehicleDamageData }) {
  const totalCost = data.parts.reduce((s, p) => s + p.estimate, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-400/5 p-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400">
          <IndianRupee size={11} /> Total Estimated Repair Cost
        </div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight text-white">
          {inr(totalCost)}
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
          {data.isLive
            ? "Model-generated estimate. Actual repair costs may vary by vehicle model, parts availability, labor rates and service provider."
            : "Demo estimate from local sample data — not a live model run. Actual repair costs vary by vehicle model, parts, labor rates and service provider."}
        </p>
      </div>

      <DamageBreakdown parts={data.parts} />
    </div>
  );
}