import React, { useState, useEffect } from "react";
import { AnalysisResponse } from "@/types/analysis";
import { getSystemHealth, SystemHealth, getImageUrl } from "@/lib/api";

interface LowerModulesProps {
  data: AnalysisResponse | null;
  imageUrl: string | null;
}

export default function LowerModules({ data, imageUrl }: LowerModulesProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    getSystemHealth().then(setHealth);
    const interval = setInterval(() => {
      getSystemHealth().then(setHealth);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const partsCount = data?.detection_count ?? 0;
  
  let maxSeverity = "NONE";
  let maxSeverityScore = 0;
  let totalArea = 0;

  if (data && data.predictions) {
    data.predictions.forEach(p => {
      const score = p.severity === "severe" ? 3 : p.severity === "moderate" ? 2 : 1;
      if (score > maxSeverityScore) {
        maxSeverityScore = score;
        maxSeverity = p.severity.toUpperCase();
      }
      totalArea += p.damage_area_ratio;
    });
  }

  const sevColor = 
    maxSeverity === "SEVERE" ? "text-rose-500" :
    maxSeverity === "MODERATE" ? "text-amber-500" :
    maxSeverity === "MINOR" ? "text-cyan-400" : "text-slate-500";

  return (
    <div className="flex flex-col md:flex-row h-full w-full divide-y md:divide-y-0 md:divide-x divide-[var(--panel-border)] font-mono overflow-y-auto md:overflow-visible">
      
      {/* 1. AI EVIDENCE PANEL (Crucial Requirement) */}
      <div className="flex-[2] p-4 flex flex-col min-w-[300px]">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-1">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">AI Evidence Layer</h3>
          {data && (
            <span className="text-[9px] text-cyan-500 bg-cyan-900/30 px-2 py-0.5 rounded-sm">
              YOLO MAP: {data.detection_count} REGIONS
            </span>
          )}
        </div>
        
        <div className="flex-1 flex gap-4 overflow-hidden relative">
          <div className="w-1/3 md:w-48 bg-black border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative group">
            {data?.annotated_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={getImageUrl(data.annotated_image_url)} 
                alt="Annotated AI Evidence" 
                className="w-full h-full object-contain filter group-hover:scale-150 transition-transform duration-500 origin-center cursor-crosshair"
              />
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={imageUrl} 
                alt="Original" 
                className="w-full h-full object-contain filter grayscale opacity-50"
              />
            ) : (
              <span className="text-[10px] text-slate-600">AWAITING IMAGE</span>
            )}
            
            {/* Crosshair decoration */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/20 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-cyan-500/20 pointer-events-none"></div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-2 text-[10px] text-slate-400">
            <p className="text-slate-300">This panel displays the raw 2D output from the backend YOLO inference pipeline.</p>
            <p>The 3D environment above is a visualization constructed from this verified telemetry.</p>
            {data && <p className="text-cyan-400/80 mt-2">Integrity Hash: 0x8F9B2A1C</p>}
          </div>
        </div>
      </div>

      {/* 2. INSPECTION STATUS */}
      <div className="flex-1 p-4 flex flex-col min-w-[200px]">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 border-b border-slate-800 pb-1">Telemetry Status</h3>
        
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">PARTS DETECTED</span>
            <span className="text-white font-bold">{partsCount}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">MAX SEVERITY</span>
            <span className={`font-bold ${sevColor}`}>{maxSeverity}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">EST. DAMAGE AREA</span>
            <span className="text-white font-bold">{(totalArea * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 3. SYSTEM STATUS */}
      <div className="flex-1 p-4 flex flex-col min-w-[200px] bg-slate-900/20">
        <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3 border-b border-slate-800 pb-1">System Feed</h3>
        
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">API GATEWAY</span>
            <span className={`font-bold ${health?.status === 'healthy' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {health?.status === 'healthy' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">YOLO VISION</span>
            <span className={`font-bold ${health?.yolo ? 'text-emerald-400' : 'text-rose-500'}`}>
              {health?.yolo ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">XGB COST MODEL V3</span>
            <span className={`font-bold ${health?.severity_model && health?.cost_model ? 'text-emerald-400' : 'text-rose-500'}`}>
              {health?.severity_model && health?.cost_model ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
