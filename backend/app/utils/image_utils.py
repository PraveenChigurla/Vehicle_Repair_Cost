import cv2
import numpy as np
from typing import Tuple

SEVERITY_COLORS = {
    "minor": (0, 255, 0),       # Green
    "moderate": (0, 165, 255),  # Orange
    "severe": (0, 0, 255)       # Red
}

def preprocess_for_severity(crop: np.ndarray) -> np.ndarray:
    """
    Resizes to 224x224, converts BGR to RGB, and expands dims for EfficientNet.
    """
    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    crop_resized = cv2.resize(crop_rgb, (224, 224))
    crop_input = np.expand_dims(crop_resized.astype(np.float32), axis=0)
    return crop_input

def calculate_damage_area_ratio(bbox: Tuple[int, int, int, int], image_width: int, image_height: int) -> float:
    x1, y1, x2, y2 = bbox
    box_width = x2 - x1
    box_height = y2 - y1
    box_area = box_width * box_height
    image_area = image_width * image_height
    return float(box_area / image_area) if image_area > 0 else 0.0

def draw_detection(image: np.ndarray, bbox: Tuple[int, int, int, int], part: str, severity: str, severity_confidence: float) -> np.ndarray:
    x1, y1, x2, y2 = bbox
    color = SEVERITY_COLORS.get(severity, (255, 255, 255))
    
    # Draw bounding box
    cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
    
    # Draw label
    label = f"{part} | {severity} ({severity_confidence:.2f})"
    
    # Get text size
    (text_width, text_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
    
    # Draw label background
    cv2.rectangle(image, (x1, y1 - text_height - 10), (x1 + text_width, y1), color, -1)
    
    # Draw text
    cv2.putText(image, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0) if severity in ['minor', 'moderate'] else (255, 255, 255), 1)
    
    return image
