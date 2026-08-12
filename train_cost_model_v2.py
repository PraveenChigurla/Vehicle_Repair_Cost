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
import xgboost as xgb

# 1. Dataset Generation
np.random.seed(42)
N_SAMPLES = 8000

# Base realistic costs and hours
BASE_COSTS = {
    "Bumper": {"parts": 12000, "labor_hours": 3},
    "Fender": {"parts": 8000, "labor_hours": 4},
    "Door": {"parts": 15000, "labor_hours": 5},
    "Hood": {"parts": 18000, "labor_hours": 3},
    "Headlight": {"parts": 25000, "labor_hours": 2},
    "Windshield": {"parts": 12000, "labor_hours": 4},
    "Grille": {"parts": 6000, "labor_hours": 1.5},
    "Mirror": {"parts": 4000, "labor_hours": 1},
    "Trunk": {"parts": 16000, "labor_hours": 4}
}

parts = list(BASE_COSTS.keys())
severities = ["minor", "moderate", "severe"]
severity_weights = [0.4, 0.4, 0.2]
LABOR_RATE = 550  # per hour

records = []

for _ in range(N_SAMPLES):
    part = np.random.choice(parts)
    severity = np.random.choice(severities, p=severity_weights)
    base = BASE_COSTS[part]
    
    # Severity specific scaling
    if severity == "minor":
        area_ratio = np.random.uniform(0.01, 0.15)
        parts_factor = 0.05 # Rarely fully replace, mostly repair/paint
        labor_factor = 0.5
        paint_base = 2500
    elif severity == "moderate":
        area_ratio = np.random.uniform(0.15, 0.45)
        parts_factor = 0.4  # Sometimes replace, sometimes heavy repair
        labor_factor = 1.0
        paint_base = 4500
    else: # severe
        area_ratio = np.random.uniform(0.40, 0.95)
        parts_factor = 1.0  # Full replacement
        labor_factor = 1.5
        paint_base = 6500

    yolo_confidence = np.random.uniform(0.45, 0.98)
    severity_confidence = np.random.uniform(0.40, 0.98)

    # Calculate actual costs
    parts_cost = base["parts"] * parts_factor * np.random.uniform(0.9, 1.1)
    
    # Damage area strongly impacts labor and paint
    area_scalar = 1.0 + (area_ratio * 1.5)
    
    labor_hours = base["labor_hours"] * labor_factor * area_scalar * np.random.uniform(0.8, 1.2)
    labor_cost = labor_hours * LABOR_RATE
    
    paint_cost = paint_base * area_scalar * np.random.uniform(0.8, 1.2)
    if part in ["Windshield", "Headlight", "Mirror"]:
        paint_cost = 0  # No paint for these parts
        
    total_cost = parts_cost + labor_cost + paint_cost
    
    # Floor to absolute minimum reasonable price
    total_cost = max(total_cost, 800)

    records.append({
        "part": part,
        "severity": severity,
        "damage_area_ratio": round(area_ratio, 4),
        "yolo_confidence": round(yolo_confidence, 4),
        "severity_confidence": round(severity_confidence, 4),
        "total_repair_cost": round(total_cost, 2)
    })

df = pd.DataFrame(records)
print("Synthetic Dataset Generated. Sample:")
print(df.head())
print("\nCost Description:")
print(df["total_repair_cost"].describe())

# 2. Train Models
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

# Standard XGBoost
xgb_standard = Pipeline([
    ("preprocessor", preprocessor),
    ("model", xgb.XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42))
])

# Log-Target XGBoost
xgb_log = Pipeline([
    ("preprocessor", preprocessor),
    ("model", xgb.XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42))
])

print("\nTraining Standard XGBoost...")
xgb_standard.fit(X_train, y_train)

print("Training Log-Target XGBoost...")
xgb_log.fit(X_train, y_train_log)

# 3. Validation
print("\n" + "="*60)
print("VALIDATION RESULTS")
print("="*60)

# Standard
std_preds = xgb_standard.predict(X_test)
print("--- Standard XGBoost ---")
print(f"MAE:  INR {mean_absolute_error(y_test, std_preds):.2f}")
print(f"RMSE: INR {np.sqrt(mean_squared_error(y_test, std_preds)):.2f}")
print(f"R²:   {r2_score(y_test, std_preds):.4f}")
print(f"Min Prediction: INR {std_preds.min():.2f}")
print(f"Max Prediction: INR {std_preds.max():.2f}")
print(f"% Negative:     {(std_preds < 0).mean() * 100:.2f}%")

# Log
log_preds_raw = xgb_log.predict(X_test)
log_preds = np.expm1(log_preds_raw)
print("\n--- Log-Target XGBoost ---")
print(f"MAE:  INR {mean_absolute_error(y_test, log_preds):.2f}")
print(f"RMSE: INR {np.sqrt(mean_squared_error(y_test, log_preds)):.2f}")
print(f"R²:   {r2_score(y_test, log_preds):.4f}")
print(f"Min Prediction: INR {log_preds.min():.2f}")
print(f"Max Prediction: INR {log_preds.max():.2f}")
print(f"% Negative:     {(log_preds < 0).mean() * 100:.2f}%")

# 4. Save Final Model
output_path = "models/repair_cost_xgboost.joblib"
joblib.dump(xgb_log, output_path)
print(f"\nSaved new Log-Target model to {output_path}")

# Config
config = {
    "categorical_features": ["part", "severity"],
    "numeric_features": ["damage_area_ratio", "yolo_confidence", "severity_confidence"],
    "target": "total_repair_cost",
    "target_transform": "log1p",
    "labor_rate_per_hour": LABOR_RATE,
    "severity_classes": ["minor", "moderate", "severe"]
}
with open("models/repair_cost_config.json", "w") as f:
    json.dump(config, f, indent=4)
print("Saved config")
