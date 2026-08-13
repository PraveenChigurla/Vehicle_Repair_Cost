import React from "react";
import { Boxes, Check, Circle, Loader2, Radar, ScanLine, Sparkles } from "lucide-react";

import { AnalysisPanel } from "./AnalysisPanel";
import {
  AiEvidencePanel,
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

import { ThreeSixtyLogo } from "./ThreeSixtyLogo";
import { Vehicle3D } from "@/components/vehicle/Vehicle3D";
import { EMPTY_DATA, type VehicleDamageData } from "@/lib/vehicle-damage";

const SCAN_STAGES = [
  "Image Uploaded",
  "Vehicle Detected",
  "Parts Identified",
  "Assessing Severity",
  "Calculating Cost",
  "Generating Report",
];

export function VehicleDamageDashboard({ 
  data = EMPTY_DATA, 
  stage = "report",
  imageUrl = null,
  onUpload
}: { 
  data?: VehicleDamageData;
  stage?: "upload" | "scanning" | "report";
  imageUrl?: string | null;
  onUpload?: (file: File) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [scanStep, setScanStep] = React.useState(0);
  React.useEffect(() => {
    if (stage === "scanning") {
      setScanStep(0);
      const interval = setInterval(() => {
        setScanStep(s => Math.min(s + 1, 5));
      }, 800);
      return () => clearInterval(interval);
    } else if (stage === "report") {
      setScanStep(6);
    }
  }, [stage]);

  const getStepperIndex = () => {
    if (stage === "upload") return 0;
    if (stage === "report") return 5;
    switch (scanStep) {
      case 0: return 1;
      case 1:
      case 2: return 1;
      case 3: return 2;
      case 4: return 3;
      case 5: return 4;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background p-4 text-foreground lg:p-6">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUpload?.(e.target.files[0]);
          }
        }} 
      />
      {/* HEADER */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#7C3CFF] shadow-[0_0_15px_rgba(0,217,255,0.3)]">
            <Boxes size={20} className="text-[#050914]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
              CarCheckUp <ThreeSixtyLogo className="h-6 w-auto text-cyan-400 mt-0.5" />
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              AI-powered damage assessment &amp; repair estimation
            </p>
          </div>
        </div>

        <Stepper current={getStepperIndex()} />

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Analysis ID</div>
            <div className="font-mono text-xs text-slate-300">{data.analysisId}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Time</div>
            <div className="font-mono text-xs text-[#F1F5F9]">{data.timestamp}</div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00D9FF] via-[#1687FF] to-[#7C3CFF] px-5 py-2.5 text-[11px] font-bold tracking-wide text-white shadow-[0_0_15px_rgba(22,135,255,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(22,135,255,0.6)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            {stage === "scanning" ? <Loader2 size={14} className="animate-spin relative z-10" /> : <ScanLine size={14} className="relative z-10" />}
            <span className="relative z-10">{stage === "scanning" ? "SCANNING..." : "START NEW INSPECTION"}</span>
          </button>
        </div>
      </header>

      {/* HERO: 3D inspection chamber + analysis */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          bodyClassName="p-3 sm:p-4"
          icon={<Radar size={16} className="text-[#00D9FF]" />}
          title="3D AI Vehicle Inspection"
          borderColorClassName="border-[#00D9FF]"
          shadowClassName="shadow-[0_0_15px_rgba(0,217,255,0.2)]"
        >
          <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[#03060c] h-[50vh] min-h-[350px] sm:h-[55vh] xl:h-[60vh] 2xl:h-[65vh]">
            <Vehicle3D parts={data.parts} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {SCAN_STAGES.map((s, i) => {
              const done = stage === "report" || scanStep > i;
              const active = stage === "scanning" && scanStep === i;
              return (
                <div
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-[11px]"
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-[#00D6A3]/20 text-[#00D6A3]"
                        : active
                          ? "bg-[#7C3CFF]/20 text-[#7C3CFF]"
                          : "bg-white/5 text-[#94A3B8]"
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
                      done ? "text-[#94A3B8]" : active ? "font-medium text-[#00D9FF]" : "text-slate-600"
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
          icon={<Sparkles size={16} className="text-[#0D47A1]" />}
          title="Analysis Complete"
          borderColorClassName="border-[#0D47A1]"
          shadowClassName="shadow-[0_0_15px_rgba(13,71,161,0.2)]"
        >
          <AnalysisPanel data={data} />
        </Panel>
      </div>

      {/* SUPPORTING PANELS */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <VehicleOverview data={data} />
        <AiEvidencePanel imageUrl={imageUrl} />
        <SeverityDistribution data={data} />
        <CostBreakdownPanel data={data} />
        <ConfidencePanel data={data} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <PipelineStatus data={data} />
        </div>
        <div className="lg:col-span-5">
          <InspectionMetrics data={data} />
        </div>
        <div className="lg:col-span-3">
          <ExportActions data={data} />
        </div>
      </div>
    </div>
  );
}