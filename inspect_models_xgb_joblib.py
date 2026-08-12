import joblib
import xgboost as xgb
import pickle

print("Attempting to load XGB with joblib...")
try:
    xgb_model = joblib.load('repair_cost_xgboost.joblib')
    print("XGB model type (joblib):", type(xgb_model))
    if hasattr(xgb_model, 'steps'):
        print("XGB steps (Pipeline):", xgb_model.steps)
except Exception as e:
    print("Error loading XGB model via joblib:", type(e).__name__, e)

print("Attempting to load XGB with pickle...")
try:
    with open('repair_cost_xgboost.joblib', 'rb') as f:
        xgb_model = pickle.load(f)
    print("XGB model type (pickle):", type(xgb_model))
except Exception as e:
    print("Error loading XGB model via pickle:", type(e).__name__, e)

