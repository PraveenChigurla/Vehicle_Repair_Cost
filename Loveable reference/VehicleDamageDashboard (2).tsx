import { Boxes, Check, Circle, Loader2, Radar, ScanLine, Sparkles } from "lucide-react";

import { AnalysisPanel } from "./AnalysisPanel";
import {
  ConfidencePanel,
  CostBreakdownPanel,
  ExportActions,
  InspectionMetrics,
  PipelineStatus,
  SeverityDistribution,
  VehicleOverview,
} from "./BottomPanels";
import { Panel, SimBadge } from "./Panel";
import { Stepper } from "./Stepper";

import { Vehicle3D } from "@/components/vehicle/Vehicle3D";
import { DEMO_DATA, type VehicleDamageData } from "@/lib/vehicle-damage";

const SCAN_STAGES = [
  "Image Uploaded",
  "Vehicle Detected",
  "Parts Identified",
  "Assessing Severity",
  "Calculating Cost",
  "Generating Report",
];

export function VehicleDamageDashboard({ data = DEMO_DATA }: { data?: VehicleDamageData }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#05070d] p-4 text-slate-200 lg:p-6">
      {/* HEADER */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0a0f1c]/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/30">
            <Boxes size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">
              VEHICLE <span className="text-cyan-400">DAMAGE AI</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              AI-powered damage assessment &amp; repair estimation
            </p>
          </div>
        </div>

        <Stepper current={3} />

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Analysis ID</div>
            <div className="font-mono text-xs text-slate-300">{data.analysisId}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Time</div>
            <div className="font-mono text-xs text-slate-300">{data.timestamp}</div>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110">
            <Sparkles size={14} /> New Analysis
          </button>
        </div>
      </header>

      {/* HERO: 3D inspection chamber + analysis */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          bodyClassName="p-3 sm:p-4"
          icon={<Radar size={15} className="text-cyan-400" />}
          title="3D AI Vehicle Inspection"
          right={
            data.isLive ? undefined : <SimBadge label="Demo scan" />
          }
        >
          <div className="relative w-full overflow-hidden rounded-xl border border-cyan-500/10 bg-[#03060c] h-[52vh] min-h-[380px] sm:h-[58vh] xl:h-[66vh]">
            <Vehicle3D parts={data.parts} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {SCAN_STAGES.map((s, i) => {
              const done = i < 3;
              const active = i === 3;
              return (
                <div
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-[11px]"
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-emerald-400/20 text-emerald-400"
                        : active
                          ? "bg-violet-400/20 text-violet-300"
                          : "bg-white/5 text-slate-600"
                    }`}
                  >
                    {done ? (
                      <Check size={10} />
                    ) : active ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Circle size={5} fill="currentColor" />
                    )}
                  </div>
                  <span
                    className={`truncate ${
                      done ? "text-slate-400" : active ? "font-medium text-violet-300" : "text-slate-600"
                    }`}
                  >
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          className="xl:col-span-4"
          icon={<ScanLine size={15} className="text-emerald-400" />}
          title="Analysis Complete"
        >
          <AnalysisPanel data={data} />
        </Panel>
      </div>

      {/* SUPPORTING PANELS */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <VehicleOverview data={data} />
        <SeverityDistribution data={data} />
        <CostBreakdownPanel data={data} />
        <ConfidencePanel data={data} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <PipelineStatus data={data} />
        <InspectionMetrics data={data} />
        <ExportActions />
      </div>
    </div>
  );
}