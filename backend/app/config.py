import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_url: str = "http://localhost:8000"
    project_root: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    
    yolo_model_path: str = os.path.join(project_root, "models", "yolo_best.pt")
    severity_model_path: str = os.path.join(project_root, "models", "severity_efficientnet_v4.keras")
    cost_model_path: str = os.path.join(project_root, "models", "repair_cost_xgboost_v3.joblib")
    
    output_dir: str = os.path.join(project_root, "backend", "outputs")
    
    yolo_conf_threshold: float = 0.25
    
    class Config:
        env_file = ".env"

settings = Settings()
