from pydantic import BaseModel
from typing import List, Optional

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class DamagePrediction(BaseModel):
    part: str
    severity: str
    yolo_confidence: float
    severity_confidence: float
    damage_area_ratio: float
    repair_cost: float
    bbox: BoundingBox

class AnalysisResponse(BaseModel):
    success: bool
    image_width: int
    image_height: int
    detection_count: int
    predictions: List[DamagePrediction]
    total_repair_cost: float
    annotated_image_url: Optional[str] = None
    message: Optional[str] = None
