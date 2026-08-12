import os
import joblib
import pandas as pd
import numpy as np
import json

class CostService:
    def __init__(self, model_path: str = "models/repair_cost_xgboost_v3.joblib"):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Cost model not found at {model_path}")
        
        self.model = joblib.load(model_path)
        
        config_path = "models/repair_cost_inference_config_v3.json"
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                self.config = json.load(f)
        else:
            self.config = {}
        
    def predict(self, part: str, severity: str, damage_area_ratio: float, yolo_confidence: float, severity_confidence: float) -> tuple[float, bool]:
        input_df = pd.DataFrame([{
            "part": part,
            "severity": severity,
            "damage_area_ratio": damage_area_ratio,
            "yolo_confidence": yolo_confidence,
            "severity_confidence": severity_confidence
        }])
        
        # OOD check
        is_ood = False
        if severity == "severe" and damage_area_ratio < 0.15:
            is_ood = True
        elif severity == "minor" and damage_area_ratio > 0.40:
            is_ood = True
            
        # Pipeline handles all preprocessing
        raw_log_prediction = self.model.predict(input_df)[0]
        
        # Convert log1p prediction back to raw cost
        raw_prediction = np.expm1(raw_log_prediction)
        
        print("\n--- COST MODEL DEBUG ---")
        print("Input DataFrame:")
        print(input_df)
        print(f"Log prediction: {raw_log_prediction:.4f}")
        print(f"Raw un-clamped cost: ₹{raw_prediction:.2f}")
        if is_ood:
            print("WARNING: Low-confidence estimate / Unusual damage profile (OOD)")
        print("------------------------\n")
        
        # Clamp negative predictions to zero (safety net)
        predicted_cost = max(0.0, float(raw_prediction))
        
        return predicted_cost, is_ood
