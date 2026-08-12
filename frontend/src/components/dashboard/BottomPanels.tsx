import {
  Car,
  Image as ImageIcon,
  Activity,
  Calendar,
  CreditCard,
  Gauge,
  IndianRupee,
  ShieldCheck,
  Server,
  Download,
  Share2,
  FileDown,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Panel, SimBadge, StatusDot } from "./Panel";

import {
  SEVERITY_COLOR,
  inr,
  type Severity,
  type VehicleDamageData,
} from "@/lib/vehicle-damage";

export function AiEvidencePanel({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <Panel 
      title="AI Evidence" 
      icon={<ImageIcon size={16} className="text-[#00E676]" />}
      borderColorClassName="border-[#00E676]"
      shadowClassName="shadow-[0_0_15px_rgba(0,230,118,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#00E676]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="w-full flex-1 flex items-center justify-center rounded border border-[var(--border)] overflow-hidden bg-black/50 p-1 relative group min-h-[140px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {imageUrl ? (
          <img src={imageUrl} alt="Uploaded Vehicle" className="w-full h-full object-contain drop-shadow-md rounded-sm relative z-10" />
        ) : (
          <div className="text-[#94A3B8] text-[9px] font-bold uppercase tracking-widest text-center">
            No Image Uploaded<br/>
            <span className="text-[8px] text-slate-600 font-normal mt-1 block">Awaiting user upload...</span>
          </div>
        )}
      </div>
    </Panel>
  );
}

export function VehicleOverview({ data }: { data: VehicleDamageData }) {
  const rows: [React.ReactNode, string, string | number][] = [
    [<ShieldCheck size={14} className="text-[#0084FF]" key="make"/>, "Make", data.vehicle.make],
    [<Car size={14} className="text-[#0084FF]" key="model"/>, "Model", data.vehicle.model],
    [<Calendar size={14} className="text-[#0084FF]" key="year"/>, "Year", data.vehicle.year],
    [<CreditCard size={14} className="text-[#0084FF]" key="plate"/>, "Plate", data.vehicle.plate],
    [<Gauge size={14} className="text-[#0084FF]" key="mileage"/>, "Mileage", `${data.vehicle.mileageKm.toLocaleString()} km`],
  ];
  return (
    <Panel 
      title="Vehicle Overview" 
      icon={<Car size={16} className="text-[#0084FF]" />}
      borderColorClassName="border-[#0084FF]"
      shadowClassName="shadow-[0_0_15px_rgba(0,132,255,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#0084FF]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <dl className="space-y-3">
        {rows.map(([icon, k, v]) => (
          <div key={k as string} className="flex justify-between items-center gap-2 border-b border-[var(--border)] pb-2 relative">
            <div className="flex items-center gap-2">
              <div className="bg-[#0084FF]/10 p-1.5 rounded-full">{icon}</div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                {k}
              </dt>
            </div>
            <dd className="font-mono text-[11px] text-[#F1F5F9]">{v}</dd>
            <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-[#0084FF]/50 to-transparent w-full"></div>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function SeverityDistribution({ data }: { data: VehicleDamageData }) {
  const counts: Record<Severity, number> = { Minor: 0, Moderate: 0, Severe: 0 };
  data.parts.forEach((p) => (counts[p.severity] += 1));
  const pie = (["Severe", "Moderate", "Minor"] as Severity[])
    .map((s) => ({ name: s, value: counts[s], color: SEVERITY_COLOR[s].dot }))
    .filter((d) => d.value > 0);

  return (
    <Panel 
      title="Damage Severity" 
      icon={<Activity size={16} className="text-[#FF2A55]" />}
      borderColorClassName="border-[#FF2A55]"
      shadowClassName="shadow-[0_0_15px_rgba(255,42,85,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#FF2A55]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[110px] w-[110px] shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pie} dataKey="value" innerRadius={32} outerRadius={50} paddingAngle={3}>
                {pie.map((e) => (
                  <Cell key={e.name} fill={e.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-xl font-mono text-[#00D9FF] drop-shadow-[0_0_8px_rgba(0,217,255,0.6)]">{data.parts.length}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">Total</div>
            </div>
          </div>
        </div>
        <div className="space-y-2 w-full mt-1">
          {pie.map((e) => (
            <div key={e.name} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ background: e.color, color: e.color }} />
                <span className="font-bold uppercase tracking-wider text-[#F1F5F9]">{e.name}</span>
              </div>
              <span className="font-mono text-[#94A3B8]">
                {e.value} <span className="text-[#00D9FF]/70 text-[9px]">({Math.round((e.value / Math.max(1, data.parts.length)) * 100)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function CostBreakdownPanel({ data }: { data: VehicleDamageData }) {
  const pie = [
    { name: "Parts", value: data.costBreakdown.parts, color: "#00D9FF" },
    { name: "Labor", value: data.costBreakdown.labor, color: "#1687FF" },
    { name: "Paint", value: data.costBreakdown.paint, color: "#7C3CFF" },
  ];
  const total = pie.reduce((s, e) => s + e.value, 0);

  return (
    <Panel 
      title="Cost Breakdown" 
      icon={<IndianRupee size={16} className="text-[#9D4EDD]" />}
      borderColorClassName="border-[#9D4EDD]"
      shadowClassName="shadow-[0_0_15px_rgba(157,78,221,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#9D4EDD]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-[110px] w-[110px] shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pie} dataKey="value" innerRadius={32} outerRadius={50} paddingAngle={3}>
                {pie.map((e) => (
                  <Cell key={e.name} fill={e.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">Total</div>
              <div className="text-[10px] font-mono text-[#F1F5F9] mt-0.5">{inr(total)}</div>
            </div>
          </div>
        </div>
        <div className="space-y-2 w-full mt-1">
          {pie.map((e) => (
            <div key={e.name} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ background: e.color, color: e.color }} />
                <span className="font-bold uppercase tracking-wider text-[#F1F5F9]">{e.name}</span>
              </div>
              <span className="font-mono text-[#94A3B8]">{inr(e.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/** Real model confidences only — no synthetic curves. */
export function ConfidencePanel({ data }: { data: VehicleDamageData }) {
  const rows: [string, number, string, string][] = [
    ["Detection", data.confidence.detection, "bg-[#1687FF]", "shadow-[0_0_8px_#1687FF]"],
    ["Severity", data.confidence.severity, "bg-[#7C3CFF]", "shadow-[0_0_8px_#7C3CFF]"],
    ["Estimate", data.confidence.estimate, "bg-[#00D9FF]", "shadow-[0_0_8px_#00D9FF]"],
  ];
  return (
    <Panel 
      title="AI Confidence" 
      icon={<ShieldCheck size={16} className="text-[#FF8C00]" />}
      borderColorClassName="border-[#FF8C00]"
      shadowClassName="shadow-[0_0_15px_rgba(255,140,0,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#FF8C00]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="space-y-4">
        {rows.map(([label, val, bar, shadow]) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="font-bold uppercase tracking-widest text-[#94A3B8]">{label}</span>
              <span className="font-mono text-[#F1F5F9]">{(val as number).toFixed(1)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden bg-[#050914] border border-[var(--border)]">
              <div className={`h-full ${bar} ${shadow}`} style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PipelineStatus({ data }: { data: VehicleDamageData }) {
  const services = ["AI Vision", "Object Detection", "Severity Model", "Cost Model (v3)", "API Gateway"];
  return (
    <Panel 
      title="System Status" 
      icon={<Server size={16} className="text-[#00E5FF]" />}
      borderColorClassName="border-[#00E5FF]"
      shadowClassName="shadow-[0_0_15px_rgba(0,229,255,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#00E5FF]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="space-y-3 text-[10px]">
        {services.map((s) => (
          <div key={s} className="flex items-center justify-between border-b border-[var(--border)] pb-2 relative">
            <div className="absolute left-0 bottom-[-1px] w-2 h-[1px] bg-[#00D9FF]"></div>
            <span className="font-bold uppercase tracking-wider text-[#94A3B8]">{s}</span>
            <span
              className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest ${
                data.isLive ? "text-[#00D6A3] drop-shadow-[0_0_5px_rgba(0,214,163,0.5)]" : "text-[#FF245C]"
              }`}
            >
              <StatusDot ok={!!data.isLive} /> {data.isLive ? "Online" : "Offline"}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function InspectionMetrics({ data }: { data: VehicleDamageData }) {
  const totalArea = data.parts.reduce((s, p) => s + p.areaRatio, 0);
  const maxSeverity = data.parts.some((p) => p.severity === "Severe")
    ? "Severe"
    : data.parts.some((p) => p.severity === "Moderate")
      ? "Moderate"
      : "Minor";

  const items: [string, string | number][] = [
    ["Parts Detected", data.parts.length],
    ["Damage Area", `${totalArea.toFixed(1)}%`],
    ["Max Severity", maxSeverity],
    ["Scan Accuracy", `${data.scanAccuracy}%`],
    ["Process Time", `${data.processSeconds}s`],
  ];

  return (
    <Panel 
      title="Inspection Metrics" 
      icon={<Gauge size={16} className="text-[#FFD600]" />}
      borderColorClassName="border-[#FFD600]"
      shadowClassName="shadow-[0_0_15px_rgba(255,214,0,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#FFD600]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="grid grid-cols-2 gap-3">
        {items.map(([label, val]) => (
          <div key={label} className="rounded border border-[var(--border)] bg-[#050914]/50 p-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D9FF]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
              <Gauge size={10} className="text-[#00D9FF]" /> {label}
            </div>
            <div className="text-lg font-mono font-bold text-[#F1F5F9]">{val}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ExportActions({ data }: { data?: VehicleDamageData }) {
  const handleDownloadFinal = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_${data.analysisId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!data) return;
    const shareText = `Vehicle Analysis ${data.analysisId} - Estimated Cost: ${inr(data.costBreakdown.parts + data.costBreakdown.labor + data.costBreakdown.paint)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vehicle Damage Analysis",
          text: shareText,
        });
      } catch (err) {
        console.log("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Analysis summary copied to clipboard!");
    }
  };

  const handlePdfExport = async () => {
    if (!data) return;
    try {
      // Dynamic import to keep bundle small on initial load
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Vehicle Damage Analysis Report", 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Analysis ID: ${data.analysisId}`, 14, 32);
      doc.text(`Timestamp: ${data.timestamp}`, 14, 38);
      doc.text(`Vehicle: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`, 14, 44);
      doc.text(`License Plate: ${data.vehicle.plate}`, 14, 50);

      const totalCost = data.costBreakdown.parts + data.costBreakdown.labor + data.costBreakdown.paint;
      doc.setFontSize(14);
      doc.setTextColor(0, 150, 0);
      doc.text(`Total Estimated Cost: Rs. ${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 14, 60);

      const tableData = data.parts.map(p => [
        p.part,
        p.severity,
        `${(p.yoloConf).toFixed(1)}%`,
        `${(p.areaRatio).toFixed(1)}%`,
        `Rs. ${p.estimate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Damaged Part', 'Severity', 'AI Confidence', 'Damage Area', 'Est. Cost']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [5, 9, 20] },
      });

      doc.save(`analysis_${data.analysisId}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <Panel 
      title="Export & Actions" 
      icon={<Download size={16} className="text-[#FF007F]" />}
      borderColorClassName="border-[#FF007F]"
      shadowClassName="shadow-[0_0_15px_rgba(255,0,127,0.2)]"
      innerBgClassName="bg-gradient-to-b from-[#FF007F]/15 to-transparent"
      className="h-full flex flex-col"
      bodyClassName="p-4 flex-1 flex flex-col justify-center"
    >
      <div className="grid gap-3 flex-1 content-center">
        <button onClick={handlePdfExport} className="flex items-center justify-center gap-2 rounded border border-[var(--border)] bg-[#050914]/50 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#F1F5F9] hover:bg-[#00D9FF]/10 hover:border-[#00D9FF]/50 transition-all">
          <FileDown size={14} /> PDF Export
        </button>
        <button onClick={handleShare} className="flex items-center justify-center gap-2 rounded border border-[var(--border)] bg-[#050914]/50 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#F1F5F9] hover:bg-[#00D9FF]/10 hover:border-[#00D9FF]/50 transition-all">
          <Share2 size={14} /> Share Report
        </button>
        <button onClick={handleDownloadFinal} className="flex items-center justify-center gap-2 rounded bg-gradient-to-r from-[#00D9FF] via-[#1687FF] to-[#7C3CFF] py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(22,135,255,0.3)] hover:shadow-[0_0_20px_rgba(22,135,255,0.6)] hover:scale-[1.02] transition-all">
          <Download size={14} /> Download Final
        </button>
      </div>
    </Panel>
  );
}