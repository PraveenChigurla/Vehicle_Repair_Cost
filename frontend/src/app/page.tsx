"use client";

import React, { useState } from "react";
import { VehicleDamageDashboard } from "@/components/dashboard/VehicleDamageDashboard";
import { analyzeVehicleImage } from "@/lib/api";
import { DEMO_DATA, VehicleDamageData, DamagePart } from "@/lib/vehicle-damage";

export type PipelineStage = "upload" | "scanning" | "report";

export default function Home() {
  const [stage, setStage] = useState<PipelineStage>("upload");
  const [vehicleData, setVehicleData] = useState<VehicleDamageData>(DEMO_DATA);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setStage("scanning");
    
    // Create a temporary state while scanning starts
    setVehicleData(prev => ({
      ...prev,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      isLive: true,
      parts: [],
    }));

    try {
      const apiData = await analyzeVehicleImage(file);
      const newId = `VD-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Transform API response to Lovable's VehicleDamageData
      const parts: DamagePart[] = apiData.predictions.map(p => {
        // Map severity carefully
        const s = p.severity.toLowerCase();
        let sev: "Minor" | "Moderate" | "Severe" = "Minor";
        if (s.includes("moderate")) sev = "Moderate";
        else if (s.includes("severe")) sev = "Severe";
        
        return {
          part: p.part,
          severity: sev,
          yoloConf: p.yolo_confidence * 100,
          severityConf: p.severity_confidence * 100,
          areaRatio: p.damage_area_ratio * 100,
          estimate: p.repair_cost,
        };
      });

      const totalEstimate = apiData.total_repair_cost;
      const partsCost = totalEstimate * 0.6;
      const laborCost = totalEstimate * 0.3;
      const paintCost = totalEstimate * 0.1;

      const newData: VehicleDamageData = {
        analysisId: newId,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        vehicle: { make: "Uploaded", model: "Vehicle", year: new Date().getFullYear(), plate: "SCAN-01", mileageKm: 0 },
        parts,
        costBreakdown: { parts: partsCost, labor: laborCost, paint: paintCost },
        confidence: { 
          detection: parts.length ? parts.reduce((acc, p) => acc + p.yoloConf, 0) / parts.length : 0, 
          severity: parts.length ? parts.reduce((acc, p) => acc + p.severityConf, 0) / parts.length : 0, 
          estimate: 85
        },
        scanAccuracy: 94.2, // Stubbed metric
        processSeconds: 2.34, // Stubbed metric
        isLive: true,
      };

      setVehicleData(newData);
      setStage("report");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to analyze image");
      } else {
        setError("Failed to analyze image");
      }
      setStage("upload");
      setVehicleData(DEMO_DATA);
    }
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-900/90 border border-rose-500 text-rose-200 px-6 py-3 rounded-lg shadow-2xl backdrop-blur font-mono text-sm max-w-[90vw] text-center">
          <div className="font-bold uppercase tracking-widest text-xs mb-1 opacity-80">System Error</div>
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}
      <VehicleDamageDashboard data={stage === 'upload' ? DEMO_DATA : vehicleData} stage={stage} onUpload={handleUpload} />
    </>
  );
}
