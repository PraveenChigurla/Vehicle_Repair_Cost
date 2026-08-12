import xgboost as xgb
import joblib

try:
    xgb_model = xgb.XGBRegressor()
    xgb_model.load_model('repair_cost_xgboost.joblib')
    print("XGB model type (XGBRegressor):", type(xgb_model))
except Exception as e:
    print("Error loading XGB model via xgb.XGBRegressor().load_model():", e)

try:
    booster = xgb.Booster()
    booster.load_model('repair_cost_xgboost.joblib')
    print("XGB model type (Booster):", type(booster))
except Exception as e:
    print("Error loading XGB model via xgb.Booster().load_model():", e)
