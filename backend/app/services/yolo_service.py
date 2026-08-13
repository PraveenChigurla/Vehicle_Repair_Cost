import os
import cv2
import numpy as np
import onnxruntime as ort

class YoloService:
    NAMES = {0: 'Bonnet', 1: 'Bumper', 2: 'Dickey', 3: 'Door', 4: 'Fender', 5: 'Light', 6: 'Windshield'}

    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"YOLO model not found at {model_path}")
        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        self.input_shape = self.session.get_inputs()[0].shape
        self.img_size = self.input_shape[2]

    def predict(self, image_path: str, conf: float = 0.25):
        img0 = cv2.imread(image_path)
        if img0 is None:
            return []
            
        # Letterbox padding
        h0, w0 = img0.shape[:2]
        r = min(self.img_size / h0, self.img_size / w0)
        new_unpad = int(round(w0 * r)), int(round(h0 * r))
        dw, dh = (self.img_size - new_unpad[0]) / 2, (self.img_size - new_unpad[1]) / 2
        
        img = cv2.resize(img0, new_unpad, interpolation=cv2.INTER_LINEAR)
        
        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))
        
        # HWC to CHW, BGR to RGB
        img = img.transpose((2, 0, 1))[::-1]
        img = np.ascontiguousarray(img)
        img = img.astype(np.float32) / 255.0
        if len(img.shape) == 3:
            img = img[None]
            
        # Run ONNX inference
        outputs = self.session.run(None, {self.input_name: img})[0]
        outputs = np.transpose(outputs[0])
        
        boxes = []
        scores = []
        class_ids = []
        
        for row in outputs:
            classes_scores = row[4:]
            class_id = np.argmax(classes_scores)
            score = classes_scores[class_id]
            
            if score > conf:
                cx, cy, w, h = row[0:4]
                # Map back to original image dimensions
                cx = (cx - dw) / r
                cy = (cy - dh) / r
                w = w / r
                h = h / r
                
                x1 = int(cx - w / 2)
                y1 = int(cy - h / 2)
                width = int(w)
                height = int(h)
                
                boxes.append([x1, y1, width, height])
                scores.append(float(score))
                class_ids.append(int(class_id))
                
        detections = []
        if not boxes:
            return detections
            
        indices = cv2.dnn.NMSBoxes(boxes, scores, score_threshold=conf, nms_threshold=0.45)
        
        for i in indices:
            idx = i if isinstance(i, (int, np.integer)) else i[0]
            box = boxes[idx]
            x1, y1, w, h = box
            
            detections.append({
                "bbox": (int(x1), int(y1), int(x1+w), int(y1+h)),
                "confidence": scores[idx],
                "class_id": class_ids[idx],
                "part": self.NAMES[class_ids[idx]]
            })
            
        return detections
