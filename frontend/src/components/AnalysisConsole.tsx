import React from "react";
import { AnalysisResponse } from "@/types/analysis";
import { PipelineStage } from "@/app/page";

interface AnalysisConsoleProps {
  stage: PipelineStage;
  data: AnalysisResponse | null;
}

export default function AnalysisConsole({ stage, data }: AnalysisConsoleProps) {
  
  if (stage !== "report" || !data) {
    return (
      <div className="h-full flex items-center justify-center font-mono">
        <div className="text-center p-6 border border-slate-800/50 w-3/4 rounded bg-slate-900/40">
          <p className="text-cyan-500/50 text-[10px] uppercase tracking-[0.2em] mb-2">Diagnostic Terminal</p>
          <p className="text-slate-500 text-[9px] uppercase tracking-widest">
            {stage === "scanning" ? "Synchronizing 3D Telemetry..." : "Awaiting Vehicle Scan"}
          </p>
          {stage === "scanning" && (
            <div className="mt-4 flex flex-col items-center gap-1 w-full px-4">
              <div className="w-full h-0.5 bg-slate-800 overflow-hidden rounded-full">
                <div className="h-full bg-cyan-500 w-1/3 animate-[pulse_1s_ease-in-out_infinite]"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 font-mono text-slate-300">
      
      {/* Console Header */}
      <div className="border-b border-[var(--panel-border)] pb-4 mb-6">
        <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Analysis Complete
        </h2>
        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
          {data.detection_count} damage region{data.detection_count === 1 ? '' : 's'} mapped
        </p>
      </div>

      {/* Stylized Cost Volume */}
      <div className="relative mb-8 py-10 flex flex-col items-center justify-center border border-[var(--panel-border)] bg-blue-900/5 rounded-lg overflow-hidden">
        
        {/* Holographic 3D glowing currency visualization */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none cost-cylinder-wrap opacity-50">
           <div className="absolute w-40 h-40 cost-cylinder-ring spin-ring"></div>
           <div className="absolute w-32 h-32 cost-cylinder-ring spin-ring" style={{ animationDirection: 'reverse', animationDuration: '15s', transform: 'rotateX(75deg) translateZ(20px)' }}></div>
           <div className="absolute w-40 h-40 cost-cylinder-ring spin-ring" style={{ transform: 'rotateX(75deg) translateZ(-20px)' }}></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="text-[10px] text-cyan-500/80 tracking-widest uppercase mb-2 font-bold">Total Estimated Repair Cost</div>
          <div className="text-4xl md:text-5xl font-black text-white text-glow-cyan tracking-tighter">
            ₹{data.total_repair_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Damage Breakdown List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
          Damage Breakdown
        </div>

        <div className="flex flex-col gap-3">
          {data.predictions.map((pred, idx) => {
            const isSevere = pred.severity === "severe";
            const isModerate = pred.severity === "moderate";
            
            const accentColor = isSevere 
              ? "text-rose-500 border-rose-500/40 bg-rose-500/5" 
              : isModerate 
                ? "text-amber-500 border-amber-500/40 bg-amber-500/5" 
                : "text-cyan-400 border-cyan-400/40 bg-cyan-400/5";

            return (
              <div key={idx} className={`border ${accentColor} p-3 rounded text-[10px]`}>
                
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit">
                  <span className="font-bold text-slate-200 tracking-wider text-xs">{pred.part.toUpperCase()}</span>
                  <span className={`font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm border border-current bg-black/20 ${accentColor.split(' ')[0]}`}>
                    {pred.severity}
                  </span>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 gap-y-2 text-slate-400 mt-3">
                  <div className="flex flex-col pr-3 border-r border-slate-700/50">
                    <span className="opacity-60 text-[8px] uppercase">Yolo Conf</span>
                    <span className="font-bold text-slate-300">{(pred.yolo_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col pl-3">
                    <span className="opacity-60 text-[8px] uppercase">Severity Conf</span>
                    <span className="font-bold text-slate-300">{(pred.severity_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col pr-3 border-r border-slate-700/50 mt-1">
                    <span className="opacity-60 text-[8px] uppercase">Area Ratio</span>
                    <span className="font-bold text-slate-300">{(pred.damage_area_ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col pl-3 mt-1">
                    <span className="opacity-60 text-[8px] uppercase text-cyan-400">Estimate</span>
                    <span className="text-cyan-400 font-bold tracking-wider">₹{pred.repair_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
