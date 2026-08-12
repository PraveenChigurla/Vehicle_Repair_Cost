import { Download, FileDown, Gauge, Share2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Panel, SimBadge, StatusDot } from "./Panel";

import {
  SEVERITY_COLOR,
  inr,
  type Severity,
  type VehicleDamageData,
} from "@/lib/vehicle-damage";

export function VehicleOverview({ data }: { data: VehicleDamageData }) {
  const rows: [string, string | number][] = [
    ["Make", data.vehicle.make],
    ["Model", data.vehicle.model],
    ["Year", data.vehicle.year],
    ["Plate", data.vehicle.plate],
    ["Mileage", `${data.vehicle.mileageKm.toLocaleString()} km`],
  ];
  return (
    <Panel title="Vehicle Overview">
      <dl className="space-y-3 mt-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-[var(--border)] pb-2 relative">
            <div className="absolute left-0 bottom-[-1px] w-4 h-[1px] bg-[#00D9FF]"></div>
            <dt className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">{k}</dt>
            <dd className="truncate font-mono text-[11px] text-[#F1F5F9]">{v}</dd>
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
    <Panel title="Damage Severity">
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
    <Panel title="Cost Breakdown">
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
    <Panel title="AI Confidence">
      <div className="space-y-4 mt-2">
        {rows.map(([label, val, bar, shadow]) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="font-bold uppercase tracking-widest text-[#94A3B8]">{label}</span>
              <span className="font-mono text-[#F1F5F9]">{val}%</span>
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
  const services = ["AI Vision", "Object Detection", "Severity Model", "Cost Model (v3)", "Database"];
  return (
    <Panel title="System Status">
      <div className="space-y-3 mt-1 text-[10px]">
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
    <Panel title="Inspection Metrics">
      <div className="grid grid-cols-2 gap-3 mt-1">
        {items.map(([label, val]) => (
          <div key={label} className="rounded border border-[var(--border)] bg-[#050914]/50 p-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D9FF]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">
              <Gauge size={12} className="text-[#00D9FF]" /> {label}
            </div>
            <div className="mt-2 text-sm font-mono font-bold text-[#F1F5F9]">{val}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ExportActions() {
  return (
    <Panel title="Export & Actions">
      <div className="grid gap-3 mt-1">
        <button className="flex items-center justify-center gap-2 rounded border border-[var(--border)] bg-[#050914]/50 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#F1F5F9] hover:bg-[#00D9FF]/10 hover:border-[#00D9FF]/50 transition-all">
          <FileDown size={14} /> PDF Export
        </button>
        <button className="flex items-center justify-center gap-2 rounded border border-[var(--border)] bg-[#050914]/50 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#F1F5F9] hover:bg-[#00D9FF]/10 hover:border-[#00D9FF]/50 transition-all">
          <Share2 size={14} /> Share Report
        </button>
        <button className="flex items-center justify-center gap-2 rounded bg-gradient-to-r from-[#00D9FF] via-[#1687FF] to-[#7C3CFF] py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(22,135,255,0.3)] hover:shadow-[0_0_20px_rgba(22,135,255,0.6)] hover:scale-[1.02] transition-all">
          <Download size={14} /> Download Final
        </button>
      </div>
    </Panel>
  );
}