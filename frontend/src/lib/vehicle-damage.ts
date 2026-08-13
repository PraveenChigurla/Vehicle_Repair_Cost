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
export const EMPTY_DATA: VehicleDamageData = {
  analysisId: "---",
  timestamp: "--:--",
  vehicle: { make: "---", model: "---", year: 0, plate: "---", mileageKm: 0 },
  parts: [],
  costBreakdown: { parts: 0, labor: 0, paint: 0 },
  confidence: { detection: 0, severity: 0, estimate: 0 },
  scanAccuracy: 0,
  processSeconds: 0,
  isLive: false,
};

export const SEVERITY_COLOR: Record<
  Severity,
  { text: string; bg: string; ring: string; dot: string; hex: number }
> = {
  Minor: {
    text: "text-[#00D6A3]",
    bg: "bg-[#00D6A3]/10",
    ring: "ring-[#00D6A3]/40",
    dot: "#00D6A3",
    hex: 0x00D6A3,
  },
  Moderate: {
    text: "text-[#FFB000]",
    bg: "bg-[#FFB000]/10",
    ring: "ring-[#FFB000]/40",
    dot: "#FFB000",
    hex: 0xFFB000,
  },
  Severe: {
    text: "text-[#FF245C]",
    bg: "bg-[#FF245C]/10",
    ring: "ring-[#FF245C]/40",
    dot: "#FF245C",
    hex: 0xFF245C,
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