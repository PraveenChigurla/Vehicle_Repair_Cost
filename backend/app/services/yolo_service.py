import os
from ultralytics import YOLO

class YoloService:
    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"YOLO model not found at {model_path}")
        self.model = YOLO(model_path)
        
    def predict(self, image_path: str, conf: float = 0.25):
        # Run inference
        results = self.model.predict(source=image_path, conf=conf, verbose=False)
        result = results[0]
        
        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            yolo_confidence = float(box.conf[0].cpu().numpy())
            class_id = int(box.cls[0].cpu().numpy())
            part_name = self.model.names[class_id]
            
            detections.append({
                "bbox": (int(x1), int(y1), int(x2), int(y2)),
                "confidence": yolo_confidence,
                "class_id": class_id,
                "part": part_name
            })
            
        return detections
