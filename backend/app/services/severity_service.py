import os
import numpy as np
import tensorflow as tf
from tensorflow import keras

class SeverityService:
    SEVERITY_CLASSES = {
        0: "minor",
        1: "moderate",
        2: "severe"
    }

    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Severity model not found at {model_path}")
        self.model = keras.models.load_model(model_path)
        
    def predict(self, crop_input):
        # crop_input should already be preprocessed (224x224 RGB, expanded dims)
        probabilities = self.model.predict(crop_input, verbose=0)[0]
        severity_id = int(np.argmax(probabilities))
        severity = self.SEVERITY_CLASSES[severity_id]
        severity_confidence = float(probabilities[severity_id])
        
        return {
            "severity": severity,
            "severity_confidence": severity_confidence,
            "probabilities": probabilities.tolist()
        }
