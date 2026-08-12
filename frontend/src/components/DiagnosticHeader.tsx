import React from "react";
import { PipelineStage } from "@/app/page";

interface DiagnosticHeaderProps {
  currentStage: PipelineStage;
  analysisId: string;
  onNewAnalysis: () => void;
}

export default function DiagnosticHeader({ currentStage, analysisId, onNewAnalysis }: DiagnosticHeaderProps) {
  
  return (
    <header className="bg-slate-800 border-b-2 border-slate-900 text-slate-300 px-6 py-3 flex items-center justify-between shrink-0 font-mono">
      
      {/* Left: Brand/Logo */}
      <div className="flex flex-col">
        <h1 className="text-sm font-black tracking-widest text-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
          VEHICLE DAMAGE AI
        </h1>
        <p className="text-[9px] text-slate-400 tracking-widest uppercase mt-0.5">
          AI-POWERED DAMAGE ASSESSMENT & REPAIR ESTIMATION
        </p>
      </div>

      {/* Center: Pipeline Sequence */}
      <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest font-bold">
        <span className={`${currentStage === "upload" ? "text-cyan-400" : "text-slate-500"}`}>UPLOAD</span>
        <span className="text-slate-600">→</span>
        <span className={`${currentStage === "scanning" ? "text-cyan-400 animate-pulse" : "text-slate-500"}`}>SCAN</span>
        <span className="text-slate-600">→</span>
        <span className={`${currentStage === "report" ? "text-cyan-400" : "text-slate-500"}`}>REPORT</span>
      </div>

      {/* Right: Controls & Status */}
      <div className="flex items-center gap-6">
        {analysisId && (
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 border border-slate-700 rounded-sm">
            <span className="text-[9px] text-slate-500 uppercase">ID</span>
            <span className="text-xs text-blue-400 font-bold">{analysisId}</span>
          </div>
        )}
        
        <button 
          onClick={onNewAnalysis}
          className="text-[10px] font-bold tracking-widest uppercase bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 border border-slate-600 hover:border-slate-500 rounded-sm transition-colors active:bg-slate-800"
        >
          NEW SCAN
        </button>
      </div>

    </header>
  );
}
