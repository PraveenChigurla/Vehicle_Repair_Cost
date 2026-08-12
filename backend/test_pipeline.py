import asyncio
import os

from app.config import settings
from app.services.yolo_service import YoloService
from app.services.severity_service import SeverityService
from app.services.cost_service import CostService
from app.services.pipeline_service import PipelineService

def test_pipeline():
    test_image_path = "test_image.jpg"
    
    print("Loading models...")
    yolo_service = YoloService(settings.yolo_model_path)
    severity_service = SeverityService(settings.severity_model_path)
    cost_service = CostService(settings.cost_model_path)
    
    pipeline_service = PipelineService(
        yolo_service, 
        severity_service, 
        cost_service, 
        settings.output_dir
    )
    
    print(f"\n{'=' * 60}")
    print("END-TO-END BACKEND TEST")
    print(f"{'=' * 60}")
    print(f"Image:\n{test_image_path}\n")
    
    response = pipeline_service.run_pipeline(test_image_path, conf_threshold=0.25)
    
    print(f"YOLO detections: {response.detection_count}\n")
    
    for i, pred in enumerate(response.predictions):
        # No redundant prediction needed; pipeline handles it.
        print(f"Damage #{i + 1}")
        print(f"Part: {pred.part}")
        print(f"YOLO confidence: {pred.yolo_confidence:.3f}")
        print(f"Severity: {pred.severity}")
        print(f"Severity confidence: {pred.severity_confidence:.3f}")
        print(f"Damage area ratio: {pred.damage_area_ratio:.4f}")
        print(f"Repair cost: ₹{pred.repair_cost:,.2f}")
        # Note: is_ood is not currently exposed in the DamagePrediction schema so we omit it here.
        print()
        
    print(f"{'-' * 60}")
    print(f"TOTAL ESTIMATED REPAIR COST: ₹{response.total_repair_cost:,.2f}")
    print(f"{'-' * 60}")
    print(f"Annotated image generated at: {response.annotated_image_url}")
    
if __name__ == "__main__":
    test_pipeline()
