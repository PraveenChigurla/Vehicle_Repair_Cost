import os
import numpy as np

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow as tf
    tflite = tf.lite

class SeverityService:
    SEVERITY_CLASSES = {
        0: "minor",
        1: "moderate",
        2: "severe"
    }

    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Severity model not found at {model_path}")
        self.interpreter = tflite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        
    def predict(self, crop_input):
        # crop_input should already be preprocessed (224x224 RGB, expanded dims)
        crop_input = crop_input.astype(np.float32)
        
        self.interpreter.set_tensor(self.input_details[0]['index'], crop_input)
        self.interpreter.invoke()
        probabilities = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        
        severity_id = int(np.argmax(probabilities))
        severity = self.SEVERITY_CLASSES[severity_id]
        severity_confidence = float(probabilities[severity_id])
        
        return {
            "severity": severity,
            "severity_confidence": severity_confidence,
            "probabilities": probabilities.tolist()
        }
