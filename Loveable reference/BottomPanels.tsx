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
      <dl className="space-y-2 text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">{k}</dt>
            <dd className="truncate font-mono text-slate-200">{v}</dd>
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
              <div className="text-lg font-extrabold text-white">{data.parts.length}</div>
              <div className="text-[8px] uppercase text-slate-500">Total</div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5 text-[11px]">
          {pie.map((e) => (
            <div key={e.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
              <span className="text-slate-300">{e.name}</span>
              <span className="ml-auto font-mono text-slate-500">
                {e.value} ({Math.round((e.value / Math.max(1, data.parts.length)) * 100)}%)
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
    { name: "Parts Cost", value: data.costBreakdown.parts, color: "#a78bfa" },
    { name: "Labor Cost", value: data.costBreakdown.labor, color: "#38bdf8" },
    { name: "Paint & Materials", value: data.costBreakdown.paint, color: "#fb923c" },
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
              <div className="text-[9px] uppercase text-slate-500">Total</div>
              <div className="text-[11px] font-extrabold text-white">{inr(total)}</div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5 text-[10.5px]">
          {pie.map((e) => (
            <div key={e.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
              <span className="text-slate-300">{e.name}</span>
              <span className="ml-auto font-mono text-slate-500">{inr(e.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/** Real model confidences only — no synthetic curves. */
export function ConfidencePanel({ data }: { data: VehicleDamageData }) {
  const rows: [string, number, string][] = [
    ["Detection", data.confidence.detection, "bg-violet-400"],
    ["Severity", data.confidence.severity, "bg-cyan-400"],
    ["Estimate", data.confidence.estimate, "bg-emerald-400"],
  ];
  return (
    <Panel title="AI Confidence" right={data.isLive ? undefined : <SimBadge label="Demo data" />}>
      <div className="space-y-3">
        {rows.map(([label, val, bar]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="uppercase tracking-wide text-slate-400">{label}</span>
              <span className="font-mono text-slate-200">{val}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full ${bar}`} style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Values reported by the detection, severity and cost models for this analysis.
      </p>
    </Panel>
  );
}

export function PipelineStatus({ data }: { data: VehicleDamageData }) {
  const services = ["AI Vision", "Object Detection", "Severity Model", "Cost Model (v3)", "Database"];
  return (
    <Panel
      title="Pipeline Status"
      right={data.isLive ? undefined : <SimBadge label="Not connected" />}
    >
      <div className="space-y-2 text-[11px]">
        {services.map((s) => (
          <div key={s} className="flex items-center justify-between">
            <span className="text-slate-400">{s}</span>
            <span
              className={`flex items-center gap-1.5 font-mono text-[10px] uppercase ${
                data.isLive ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              <StatusDot ok={!!data.isLive} /> {data.isLive ? "Online" : "Offline"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Reflects the backend services actually reachable by this session.
      </p>
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
      <div className="grid grid-cols-2 gap-3">
        {items.map(([label, val]) => (
          <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-[9px] uppercase text-slate-500">
              <Gauge size={13} /> {label}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-100">{val}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ExportActions() {
  return (
    <Panel title="Export & Actions">
      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        Generate a detailed report with analysis, images and recommendations.
      </p>
      <div className="grid gap-2">
        <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
          <FileDown size={14} /> PDF Export
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
          <Share2 size={14} /> Share Report
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 py-2.5 text-xs font-bold text-black hover:brightness-110">
          <Download size={14} /> Download Full Report
        </button>
      </div>
    </Panel>
  );
}