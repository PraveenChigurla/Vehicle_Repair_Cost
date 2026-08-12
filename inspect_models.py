import joblib
import json

try:
    preprocessor = joblib.load('repair_cost_preprocessor.joblib')
    print("Preprocessor type:", type(preprocessor))
    if hasattr(preprocessor, 'steps'):
        print("Preprocessor steps:", preprocessor.steps)
except Exception as e:
    print("Error loading preprocessor:", e)

try:
    xgb_model = joblib.load('repair_cost_xgboost.joblib')
    print("XGB model type:", type(xgb_model))
    if hasattr(xgb_model, 'steps'):
        print("XGB steps:", xgb_model.steps)
except Exception as e:
    print("Error loading XGB model:", e)

with open('repair_cost_config.json', 'r') as f:
    config = json.load(f)
    print("Config:", config)
