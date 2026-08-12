import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb

# ============================================================
# 1. V3 DATASET GENERATION
# ============================================================
np.random.seed(42)
N_SAMPLES = 8000
LABOR_RATE = 550

PART_PROFILES = {
    "Bumper":     {"parts": (4000, 10000),  "labor_hours": (2.0, 4.0), "paint": True},
    "Fender":     {"parts": (3000, 8000),   "labor_hours": (3.0, 5.0), "paint": True},
    "Door":       {"parts": (8000, 15000),  "labor_hours": (4.0, 6.0), "paint": True},
    "Hood":       {"parts": (10000, 18000), "labor_hours": (3.0, 5.0), "paint": True},
    "Windshield": {"parts": (5000, 12000),  "labor_hours": (2.0, 4.0), "paint": False},
    "Light":      {"parts": (3000, 12000),  "labor_hours": (1.0, 2.5), "paint": False},
    "Headlight":  {"parts": (3000, 12000),  "labor_hours": (1.0, 2.5), "paint": False},
    "Trunk":      {"parts": (10000, 18000), "labor_hours": (3.0, 5.0), "paint": True},
}

parts = list(PART_PROFILES.keys())
severities = ["minor", "moderate", "severe"]
severity_weights = [0.4, 0.4, 0.2]

records = []

for _ in range(N_SAMPLES):
    part = np.random.choice(parts)
    severity = np.random.choice(severities, p=severity_weights)
    profile = PART_PROFILES[part]

    # Dynamically draw area ratio bound by severity
    if severity == "minor":
        area_ratio = np.clip(np.random.normal(0.05, 0.03), 0.01, 0.20)
        replacement_prob = 0.05
    elif severity == "moderate":
        area_ratio = np.clip(np.random.normal(0.25, 0.10), 0.10, 0.50)
        replacement_prob = 0.40
    else: # severe
        area_ratio = np.clip(np.random.normal(0.60, 0.15), 0.30, 0.95)
        replacement_prob = 0.95

    # Randomly determine if part needs full replacement
    needs_replacement = np.random.random() < replacement_prob

    # Draw base values
    base_parts = np.random.uniform(profile["parts"][0], profile["parts"][1])
    base_labor = np.random.uniform(profile["labor_hours"][0], profile["labor_hours"][1])
    base_paint = np.random.uniform(3000, 5000)

    # Calculate actual costs using area as a continuous multiplier
    parts_cost = base_parts * np.random.uniform(0.9, 1.1) if needs_replacement else 0.0
    
    # Labor scales by area heavily
    area_multiplier = 1.0 + (area_ratio * 1.5)
    labor_hours = base_labor * area_multiplier * np.random.uniform(0.8, 1.2)
    labor_cost = labor_hours * LABOR_RATE
    
    paint_cost = 0.0
    if profile["paint"]:
        # Paint also scales with area, small area -> small paint blending cost
        paint_multiplier = 0.5 + (area_ratio * 1.5)
        paint_cost = base_paint * paint_multiplier * np.random.uniform(0.8, 1.2)

    total_cost = parts_cost + labor_cost + paint_cost
    
    # Floor to absolute minimum reasonable price
    total_cost = max(total_cost, 800)

    yolo_confidence = np.random.uniform(0.45, 0.98)
    severity_confidence = np.random.uniform(0.40, 0.98)

    records.append({
        "part": part,
        "severity": severity,
        "damage_area_ratio": round(area_ratio, 4),
        "yolo_confidence": round(yolo_confidence, 4),
        "severity_confidence": round(severity_confidence, 4),
        "parts_cost": parts_cost,
        "labor_cost": labor_cost,
        "paint_cost": paint_cost,
        "total_repair_cost": round(total_cost, 2)
    })

df = pd.DataFrame(records)


# ============================================================
# 2. AUDIT TABLES
# ============================================================
SEP = "=" * 70

print(f"\n{SEP}")
print("A. SUMMARY: part | severity | count | min | median | mean | max (INR)")
print(SEP)
table_a = df.groupby(["part", "severity"])["total_repair_cost"].agg(["count", "min", "median", "mean", "max"]).round(0).astype(int).reset_index()
print(table_a.to_string(index=False))

print(f"\n{SEP}")
print("B. COMPONENTS: part | severity | median parts | labor | paint | total (INR)")
print(SEP)
table_b = df.groupby(["part", "severity"])[["parts_cost", "labor_cost", "paint_cost", "total_repair_cost"]].median().round(0).astype(int).reset_index()
print(table_b.to_string(index=False))

print(f"\n{SEP}")
print("C. AREA DISTRIBUTIONS: severity | min_area | median_area | max_area")
print(SEP)
table_c = df.groupby("severity")["damage_area_ratio"].agg(["min", "median", "max"]).reset_index()
print(table_c.to_string(index=False))

print(f"\n{SEP}")
print("D. PART SUMMARY: part | min_cost | median_cost | mean_cost | max_cost (INR)")
print(SEP)
table_d = df.groupby("part")["total_repair_cost"].agg(["min", "median", "mean", "max"]).round(0).astype(int).reset_index()
print(table_d.to_string(index=False))

print(f"\n{SEP}")
print("8. SPECIFIC LIGHT VALIDATION")
print(SEP)
light_df = df[df["part"] == "Light"]
if not light_df.empty:
    print(light_df.groupby("severity")["total_repair_cost"].agg(["count", "min", "median", "max"]).round(0).astype(int))
    
    print("\nSimulated Light Examples (approximate matches in data):")
    for sev, tgt_area in [("minor", 0.02), ("moderate", 0.10), ("severe", 0.40)]:
        match = light_df[(light_df["severity"] == sev) & (light_df["damage_area_ratio"] > tgt_area - 0.05) & (light_df["damage_area_ratio"] < tgt_area + 0.05)]
        if not match.empty:
            sample = match.iloc[0]
            print(f"  Light + {sev:8s} + area {sample['damage_area_ratio']:.3f} -> INR {sample['total_repair_cost']:.0f}")
        else:
            print(f"  Light + {sev:8s} + area ~{tgt_area} -> No exact match in generated sample")


# ============================================================
# 3. TRAIN MODELS
# ============================================================
FEATURES = ["part", "severity", "damage_area_ratio", "yolo_confidence", "severity_confidence"]
TARGET = "total_repair_cost"

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
y_train_log = np.log1p(y_train)
y_test_log = np.log1p(y_test)

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["part", "severity"]),
        ("passthrough", "passthrough", ["damage_area_ratio", "yolo_confidence", "severity_confidence"])
    ]
)

models = {
    "Linear Regression": Pipeline([
        ("preprocessor", preprocessor),
        ("model", LinearRegression())
    ]),
    "Random Forest": Pipeline([
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(n_estimators=100, random_state=42))
    ]),
    "Standard XGBoost": Pipeline([
        ("preprocessor", preprocessor),
        ("model", xgb.XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42))
    ]),
    "Log-Target XGBoost": Pipeline([
        ("preprocessor", preprocessor),
        ("model", xgb.XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42))
    ])
}

print(f"\n{SEP}")
print("9. MODEL EVALUATION")
print(SEP)

best_model_name = "Log-Target XGBoost"
champion_model = None

for name, pipeline in models.items():
    print(f"\n--- {name} ---")
    if name == "Log-Target XGBoost":
        pipeline.fit(X_train, y_train_log)
        preds_raw = pipeline.predict(X_test)
        preds = np.expm1(preds_raw)
        champion_model = pipeline
    else:
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    
    print(f"MAE:  INR {mae:.2f}")
    print(f"RMSE: INR {rmse:.2f}")
    print(f"R²:   {r2:.4f}")
    print(f"Min Prediction: INR {preds.min():.2f}")
    print(f"Max Prediction: INR {preds.max():.2f}")
    print(f"Negative predictions: {(preds < 0).sum()} ({(preds < 0).mean() * 100:.2f}%)")


# ============================================================
# 4. SAVE ARTIFACTS
# ============================================================
print(f"\n{SEP}")
print("12. SAVING V3 ARTIFACTS")
print(SEP)
os.makedirs("models", exist_ok=True)

joblib.dump(champion_model, "models/repair_cost_xgboost_v3.joblib")
print("Saved models/repair_cost_xgboost_v3.joblib")

# Not saving standalone preprocessor since it's in the pipeline, but we'll export it for completeness if requested.
joblib.dump(preprocessor, "models/repair_cost_preprocessor_v3.joblib")
print("Saved models/repair_cost_preprocessor_v3.joblib")

df.to_csv("models/synthetic_vehicle_repair_costs_v3.csv", index=False)
print("Saved models/synthetic_vehicle_repair_costs_v3.csv")

config = {
    "categorical_features": ["part", "severity"],
    "numeric_features": ["damage_area_ratio", "yolo_confidence", "severity_confidence"],
    "target": "total_repair_cost",
    "target_transform": "log1p",
    "labor_rate_per_hour": LABOR_RATE,
    "severity_classes": ["minor", "moderate", "severe"],
    "version": "v3"
}
with open("models/repair_cost_inference_config_v3.json", "w") as f:
    json.dump(config, f, indent=4)
print("Saved models/repair_cost_inference_config_v3.json")
