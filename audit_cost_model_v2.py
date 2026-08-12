"""
COST MODEL V2 AUDIT SCRIPT
===========================
Runs the exact V2 data generation logic and produces a full analysis report.
No model is saved. Only audit data is produced.
"""

import numpy as np
import pandas as pd

np.random.seed(42)
N_SAMPLES = 8000

BASE_COSTS = {
    "Bumper":     {"parts": 12000, "labor_hours": 3},
    "Fender":     {"parts": 8000,  "labor_hours": 4},
    "Door":       {"parts": 15000, "labor_hours": 5},
    "Hood":       {"parts": 18000, "labor_hours": 3},
    "Headlight":  {"parts": 25000, "labor_hours": 2},
    "Windshield": {"parts": 12000, "labor_hours": 4},
    "Grille":     {"parts": 6000,  "labor_hours": 1.5},
    "Mirror":     {"parts": 4000,  "labor_hours": 1},
    "Trunk":      {"parts": 16000, "labor_hours": 4},
}

NO_PAINT_PARTS = {"Windshield", "Headlight", "Mirror"}

parts = list(BASE_COSTS.keys())
severities = ["minor", "moderate", "severe"]
severity_weights = [0.4, 0.4, 0.2]
LABOR_RATE = 550

records = []

for _ in range(N_SAMPLES):
    part = np.random.choice(parts)
    severity = np.random.choice(severities, p=severity_weights)
    base = BASE_COSTS[part]

    if severity == "minor":
        area_ratio = np.random.uniform(0.01, 0.15)
        parts_factor = 0.05
        labor_factor = 0.5
        paint_base = 2500
    elif severity == "moderate":
        area_ratio = np.random.uniform(0.15, 0.45)
        parts_factor = 0.4
        labor_factor = 1.0
        paint_base = 4500
    else:
        area_ratio = np.random.uniform(0.40, 0.95)
        parts_factor = 1.0
        labor_factor = 1.5
        paint_base = 6500

    yolo_confidence = np.random.uniform(0.45, 0.98)
    severity_confidence = np.random.uniform(0.40, 0.98)

    parts_cost = base["parts"] * parts_factor * np.random.uniform(0.9, 1.1)
    area_scalar = 1.0 + (area_ratio * 1.5)
    labor_hours = base["labor_hours"] * labor_factor * area_scalar * np.random.uniform(0.8, 1.2)
    labor_cost = labor_hours * LABOR_RATE
    paint_cost = paint_base * area_scalar * np.random.uniform(0.8, 1.2)
    if part in NO_PAINT_PARTS:
        paint_cost = 0

    total_cost = parts_cost + labor_cost + paint_cost
    total_cost = max(total_cost, 800)

    records.append({
        "part": part,
        "severity": severity,
        "damage_area_ratio": round(area_ratio, 4),
        "yolo_confidence": round(yolo_confidence, 4),
        "severity_confidence": round(severity_confidence, 4),
        "parts_cost": round(parts_cost, 2),
        "labor_hours": round(labor_hours, 2),
        "labor_cost": round(labor_cost, 2),
        "paint_cost": round(paint_cost, 2),
        "total_repair_cost": round(total_cost, 2)
    })

df = pd.DataFrame(records)

SEP = "=" * 78

# ============================================================
# 1. FORMULA
# ============================================================
print(f"\n{SEP}")
print("V2 COST GENERATION FORMULA")
print(SEP)
print("""
  parts_cost   = base_parts * severity_parts_factor * U(0.9, 1.1)
  area_scalar  = 1.0 + damage_area_ratio * 1.5

  labor_hours  = base_labor_hours * severity_labor_factor * area_scalar * U(0.8, 1.2)
  labor_cost   = labor_hours * 550

  paint_cost   = paint_base * area_scalar * U(0.8, 1.2)
               = 0  [Windshield, Headlight, Mirror]

  total_cost   = parts_cost + labor_cost + paint_cost
               >= 800 (floor)

  Severity Factors:
    minor:    parts_factor=0.05, labor_factor=0.5,  paint_base=2500
    moderate: parts_factor=0.40, labor_factor=1.0,  paint_base=4500
    severe:   parts_factor=1.00, labor_factor=1.50, paint_base=6500

  Area Ranges (tied to severity):
    minor:    [0.01, 0.15]
    moderate: [0.15, 0.45]
    severe:   [0.40, 0.95]

  NOTE: yolo_confidence and severity_confidence are NOT part
        of the cost formula. They are stored only as features.
""")

# ============================================================
# 2. PART × SEVERITY COST TABLE
# ============================================================
print(f"\n{SEP}")
print("SUMMARY TABLE: part | severity | min | median | mean | max cost (INR)")
print(SEP)
summary = (
    df.groupby(["part", "severity"])["total_repair_cost"]
    .agg(["min", "median", "mean", "max"])
    .round(0)
    .astype(int)
    .reset_index()
)
print(summary.to_string(index=False))

# ============================================================
# 3. COMPONENT BREAKDOWN TABLE
# ============================================================
print(f"\n{SEP}")
print("MEDIAN COST COMPONENTS: part | severity | parts | labor | paint | total (INR)")
print(SEP)
breakdown = (
    df.groupby(["part", "severity"])
    [["parts_cost", "labor_cost", "paint_cost", "total_repair_cost"]]
    .median()
    .round(0)
    .astype(int)
    .reset_index()
)
print(breakdown.to_string(index=False))

# ============================================================
# 4. HEADLIGHT / LIGHT SEVERE DEEP DIVE
# ============================================================
print(f"\n{SEP}")
print("DEEP DIVE: Headlight | severe")
print(SEP)

hl_severe = df[(df["part"] == "Headlight") & (df["severity"] == "severe")]
print(f"Sample count: {len(hl_severe)}")
print(f"\nCost stats:")
print(hl_severe[["parts_cost","labor_cost","paint_cost","total_repair_cost","damage_area_ratio"]].describe().round(0).to_string())

# Simulate the exact real inference case:
# Headlight | severe | damage_area_ratio = 0.016
print(f"\n{SEP}")
print("EXACT SIMULATION: Headlight | severe | area_ratio=0.016")
print(SEP)
area_ratio = 0.016
area_scalar = 1.0 + (area_ratio * 1.5)
parts_cost_min = BASE_COSTS["Headlight"]["parts"] * 1.0 * 0.9
parts_cost_max = BASE_COSTS["Headlight"]["parts"] * 1.0 * 1.1
labor_hours_min = BASE_COSTS["Headlight"]["labor_hours"] * 1.5 * area_scalar * 0.8
labor_hours_max = BASE_COSTS["Headlight"]["labor_hours"] * 1.5 * area_scalar * 1.2
labor_cost_min = labor_hours_min * LABOR_RATE
labor_cost_max = labor_hours_max * LABOR_RATE
# Headlight: paint_cost = 0

print(f"  area_ratio = {area_ratio}")
print(f"  area_scalar = 1.0 + ({area_ratio} * 1.5) = {area_scalar:.4f}")
print()
print(f"  parts_cost:")
print(f"    = 25000 * 1.0 * U(0.9, 1.1)")
print(f"    range: [{parts_cost_min:.0f}, {parts_cost_max:.0f}]")
print(f"    midpoint: {(parts_cost_min + parts_cost_max)/2:.0f}")
print()
print(f"  labor_hours:")
print(f"    = 2 * 1.5 * {area_scalar:.4f} * U(0.8, 1.2)")
print(f"    range: [{labor_hours_min:.2f}, {labor_hours_max:.2f}]")
print(f"  labor_cost:")
print(f"    = labor_hours * 550")
print(f"    range: [{labor_cost_min:.0f}, {labor_cost_max:.0f}]")
print()
print(f"  paint_cost = 0  (Headlight has no paint)")
print()
total_min = parts_cost_min + labor_cost_min
total_max = parts_cost_max + labor_cost_max
total_mid = (total_min + total_max) / 2
print(f"  TOTAL range: [{total_min:.0f}, {total_max:.0f}]")
print(f"  TOTAL midpoint: {total_mid:.0f}")
print()
print("FINDING:")
print(f"  At area_ratio=0.016, Headlight severe produces ~INR {total_mid:.0f}.")
print(f"  This is high because the BASE PARTS COST is INR 25,000 and")
print(f"  severe severity forces parts_factor=1.0 (full replacement).")
print(f"  The area_ratio barely affects cost because area_scalar = {area_scalar:.4f}")
print(f"  which has almost no effect when area_ratio is tiny (0.016).")
print()
print("ROOT CAUSE IDENTIFIED:")
print("  The Headlight severe cost is dominated by the base parts cost (INR 25,000)")
print("  regardless of how small the damage area is.")
print("  A Headlight categorized as 'severe' always triggers full replacement cost.")
print("  This is the design flaw: severity is an independent axis from area in the data.")
print("  When YOLO+EfficientNet says 'Headlight severe' the model correctly applies")
print("  full replacement cost regardless of bounding box size.")

# ============================================================
# 5. FENDER SEVERE ANALYSIS
# ============================================================
print(f"\n{SEP}")
print("EXACT SIMULATION: Fender | severe | area_ratio=0.138")
print(SEP)
area_ratio = 0.138
area_scalar = 1.0 + (area_ratio * 1.5)
parts_cost_mid = BASE_COSTS["Fender"]["parts"] * 1.0 * 1.0
labor_hours_mid = BASE_COSTS["Fender"]["labor_hours"] * 1.5 * area_scalar * 1.0
labor_cost_mid = labor_hours_mid * LABOR_RATE
paint_cost_mid = 6500 * area_scalar * 1.0

print(f"  area_scalar = {area_scalar:.4f}")
print(f"  parts_cost  = 8000 * 1.0 = {parts_cost_mid:.0f}")
print(f"  labor_hours = 4 * 1.5 * {area_scalar:.4f} = {4*1.5*area_scalar:.2f}")
print(f"  labor_cost  = {labor_cost_mid:.0f}")
print(f"  paint_cost  = 6500 * {area_scalar:.4f} = {paint_cost_mid:.0f}")
total_mid = parts_cost_mid + labor_cost_mid + paint_cost_mid
print(f"  TOTAL mid   = {total_mid:.0f}")
