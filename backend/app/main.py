import os
import shutil
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import AnalysisResponse
from app.services.yolo_service import YoloService
from app.services.severity_service import SeverityService
from app.services.cost_service import CostService
from app.services.pipeline_service import PipelineService

# Global service references
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        yolo_service = YoloService(settings.yolo_model_path)
        services["yolo"] = yolo_service
    except Exception as e:
        print(f"Failed to load YOLO model: {e}")
        services["yolo_error"] = str(e)
        
    try:
        severity_service = SeverityService(settings.severity_model_path)
        services["severity"] = severity_service
    except Exception as e:
        print(f"Failed to load Severity model: {e}")
        services["severity_error"] = str(e)
        
    try:
        cost_service = CostService(settings.cost_model_path)
        services["cost"] = cost_service
    except Exception as e:
        print(f"Failed to load Cost model: {e}")
        services["cost_error"] = str(e)
        
    if "yolo" in services and "severity" in services and "cost" in services:
        services["pipeline"] = PipelineService(
            services["yolo"], 
            services["severity"], 
            services["cost"], 
            settings.output_dir
        )
        
    yield
    # Shutdown
    services.clear()

app = FastAPI(title="Vehicle Damage Assessment API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.output_dir, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=settings.output_dir), name="outputs")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Vehicle Damage Assessment API"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if "pipeline" in services else "unhealthy",
        "yolo": "yolo" in services,
        "yolo_error": services.get("yolo_error"),
        "severity_model": "severity" in services,
        "severity_error": services.get("severity_error"),
        "cost_model": "cost" in services,
        "cost_error": services.get("cost_error")
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    if "pipeline" not in services:
        raise HTTPException(status_code=503, detail="Pipeline services are not ready")
        
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG and JPEG are supported.")
        
    # Save uploaded file temporarily
    temp_dir = os.path.join(settings.project_root, "backend", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}_{file.filename}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        pipeline_service: PipelineService = services["pipeline"]
        response = pipeline_service.run_pipeline(temp_path, conf_threshold=settings.yolo_conf_threshold)
        return response
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during image analysis.")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
