import os
import cv2
import uuid
from typing import Tuple

from app.schemas import AnalysisResponse, DamagePrediction, BoundingBox
from app.services.yolo_service import YoloService
from app.services.severity_service import SeverityService
from app.services.cost_service import CostService
from app.utils.image_utils import preprocess_for_severity, calculate_damage_area_ratio, draw_detection

class PipelineService:
    def __init__(self, yolo_service: YoloService, severity_service: SeverityService, cost_service: CostService, output_dir: str):
        self.yolo_service = yolo_service
        self.severity_service = severity_service
        self.cost_service = cost_service
        self.output_dir = output_dir
        
        os.makedirs(self.output_dir, exist_ok=True)
        
    def run_pipeline(self, image_path: str, conf_threshold: float = 0.25) -> AnalysisResponse:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image at {image_path}")
            
        image_height, image_width = image.shape[:2]
        output_image = image.copy()
        
        detections = self.yolo_service.predict(image_path, conf=conf_threshold)
        
        if not detections:
            return AnalysisResponse(
                success=True,
                image_width=image_width,
                image_height=image_height,
                detection_count=0,
                predictions=[],
                total_repair_cost=0.0,
                annotated_image_url=None,
                message="No damaged vehicle parts detected."
            )
            
        predictions = []
        total_cost = 0.0
        
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            part = det["part"]
            yolo_confidence = det["confidence"]
            
            # Clip to image boundaries
            x1 = max(0, min(int(x1), image_width - 1))
            y1 = max(0, min(int(y1), image_height - 1))
            x2 = max(0, min(int(x2), image_width))
            y2 = max(0, min(int(y2), image_height))
            
            if x2 <= x1 or y2 <= y1:
                continue
                
            crop = image[y1:y2, x1:x2]
            if crop.size == 0:
                continue
                
            crop_input = preprocess_for_severity(crop)
            severity_res = self.severity_service.predict(crop_input)
            severity = severity_res["severity"]
            severity_confidence = severity_res["severity_confidence"]
            
            damage_area_ratio = calculate_damage_area_ratio((x1, y1, x2, y2), image_width, image_height)
            
            repair_cost, is_ood = self.cost_service.predict(
                part=part,
                severity=severity,
                damage_area_ratio=damage_area_ratio,
                yolo_confidence=yolo_confidence,
                severity_confidence=severity_confidence
            )
            
            total_cost += repair_cost
            
            predictions.append(DamagePrediction(
                part=part,
                severity=severity,
                yolo_confidence=yolo_confidence,
                severity_confidence=severity_confidence,
                damage_area_ratio=damage_area_ratio,
                repair_cost=repair_cost,
                bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
            ))
            
            output_image = draw_detection(output_image, (x1, y1, x2, y2), part, severity, severity_confidence)
            
        filename = f"analysis_{uuid.uuid4().hex}.jpg"
        output_path = os.path.join(self.output_dir, filename)
        cv2.imwrite(output_path, output_image)
        
        return AnalysisResponse(
            success=True,
            image_width=image_width,
            image_height=image_height,
            detection_count=len(predictions),
            predictions=predictions,
            total_repair_cost=total_cost,
            annotated_image_url=f"/outputs/{filename}",
            message="Analysis completed successfully."
        )
