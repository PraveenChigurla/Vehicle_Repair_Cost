export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DamagePrediction {
  part: string;
  severity: string;
  yolo_confidence: number;
  severity_confidence: number;
  damage_area_ratio: number;
  repair_cost: number;
  bbox: BoundingBox;
}

export interface AnalysisResponse {
  success: boolean;
  image_width: number;
  image_height: number;
  detection_count: number;
  predictions: DamagePrediction[];
  total_repair_cost: number;
  annotated_image_url?: string;
  message?: string;
}
