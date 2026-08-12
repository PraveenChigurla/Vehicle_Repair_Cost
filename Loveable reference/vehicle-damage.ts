/* ---------------------------------------------------------------------
 * Vehicle damage data model.
 *
 * This mirrors the shape returned by the FastAPI `/analyze` endpoint.
 * `vehicleZone` is the semantic 3D location used by the inspection scene;
 * `anchor` (legacy 600x300 2D map coords) is optional and only kept for
 * backwards compatibility with older backend payloads.
 * ------------------------------------------------------------------ */

export type Severity = "Minor" | "Moderate" | "Severe";

/** Semantic locations on the vehicle. Mapped to real 3D points in VEHICLE_ZONES. */
export type VehicleZone =
  | "windshield"
  | "roof"
  | "hood"
  | "front-bumper"
  | "grille"
  | "rear-bumper"
  | "trunk"
  | "rear-glass"
  | "front-left-fender"
  | "front-right-fender"
  | "front-left-headlight"
  | "front-right-headlight"
  | "rear-left-taillight"
  | "rear-right-taillight"
  | "front-left-door"
  | "front-right-door"
  | "rear-left-door"
  | "rear-right-door"
  | "left-mirror"
  | "right-mirror"
  | "rear-left-quarter"
  | "rear-right-quarter";

export interface DamagePart {
  part: string;
  severity: Severity;
  /** YOLO detection confidence, 0-100 */
  yoloConf: number;
  /** Severity classifier confidence, 0-100 */
  severityConf: number;
  /** Damaged area as % of vehicle surface */
  areaRatio: number;
  /** Repair estimate in INR */
  estimate: number;
  /** Semantic 3D location on the vehicle */
  vehicleZone?: VehicleZone;
  /** @deprecated legacy 2D map anchor (600x300 space) */
  anchor?: { x: number; y: number };
}

export interface VehicleDamageData {
  analysisId: string;
  timestamp: string;
  vehicle: { make: string; model: string; year: number; plate: string; mileageKm: number };
  parts: DamagePart[];
  costBreakdown: { parts: number; labor: number; paint: number };
  confidence: { detection: number; severity: number; estimate: number };
  scanAccuracy: number;
  processSeconds: number;
  /** True when values come from a real model run instead of local demo data. */
  isLive?: boolean;
}

/* ------------------------------------------------------------------
 * DEMO DATA — local development fallback only. Never presented as a
 * real model output (`isLive` stays false, UI labels it as simulated).
 * ------------------------------------------------------------------ */
export const DEMO_DATA: VehicleDamageData = {
  analysisId: "VD-250525-001",
  timestamp: "02:48:25 PM",
  vehicle: { make: "Generic", model: "Sedan", year: 2018, plate: "ASB042", mileageKm: 87312 },
  parts: [
    {
      part: "Windshield",
      severity: "Moderate",
      yoloConf: 78.5,
      severityConf: 63.7,
      areaRatio: 12.5,
      estimate: 3692.41,
      vehicleZone: "windshield",
    },
    {
      part: "Fender",
      severity: "Severe",
      yoloConf: 37.3,
      severityConf: 88.6,
      areaRatio: 13.8,
      estimate: 9551.98,
      vehicleZone: "front-right-fender",
    },
    {
      part: "Light",
      severity: "Severe",
      yoloConf: 34.9,
      severityConf: 95.9,
      areaRatio: 1.6,
      estimate: 3295.37,
      vehicleZone: "front-right-headlight",
    },
  ],
  costBreakdown: { parts: 10420.5, labor: 4980.2, paint: 1139.06 },
  confidence: { detection: 62, severity: 81, estimate: 75 },
  scanAccuracy: 92.4,
  processSeconds: 8.42,
  isLive: false,
};

export const SEVERITY_COLOR: Record<
  Severity,
  { text: string; bg: string; ring: string; dot: string; hex: number }
> = {
  Minor: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    ring: "ring-emerald-400/40",
    dot: "#34d399",
    hex: 0x34d399,
  },
  Moderate: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    ring: "ring-amber-400/40",
    dot: "#fbbf24",
    hex: 0xfbbf24,
  },
  Severe: {
    text: "text-rose-400",
    bg: "bg-rose-400/10",
    ring: "ring-rose-400/40",
    dot: "#fb7185",
    hex: 0xfb7185,
  },
};

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

/** Fallback mapping from a loose backend part name to a semantic zone. */
const PART_NAME_TO_ZONE: Record<string, VehicleZone> = {
  windshield: "windshield",
  windscreen: "windshield",
  glass: "windshield",
  roof: "roof",
  hood: "hood",
  bonnet: "hood",
  bumper: "front-bumper",
  "front-bumper": "front-bumper",
  "rear-bumper": "rear-bumper",
  grille: "grille",
  trunk: "trunk",
  boot: "trunk",
  fender: "front-right-fender",
  quarter: "rear-right-quarter",
  light: "front-right-headlight",
  headlight: "front-right-headlight",
  taillight: "rear-right-taillight",
  door: "front-right-door",
  mirror: "right-mirror",
};

export function resolveZone(part: DamagePart): VehicleZone {
  if (part.vehicleZone) return part.vehicleZone;
  const key = part.part.trim().toLowerCase().replace(/\s+/g, "-");
  return PART_NAME_TO_ZONE[key] ?? PART_NAME_TO_ZONE[key.split("-").pop() ?? ""] ?? "hood";
}