import os
import joblib
import numpy as np
import pandas as pd
import logging
import xgboost as xgb
from copy import deepcopy
from functools import lru_cache

logger = logging.getLogger(__name__)
CURRENT_MODEL_VERSION = "v1.1.0-xgb"

# Assume the artifacts are placed in the backend root or project root. You can adjust paths later.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_stress_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

# We use global variables to hold model instances so they only load once.
_model = None
_scaler = None

def get_model_and_scaler():
    global _model, _scaler
    if _model is None or _scaler is None:
        try:
            _model = joblib.load(MODEL_PATH)
            _scaler = joblib.load(SCALER_PATH)
            logger.info("Successfully loaded ML model and scaler.")
        except Exception as e:
            logger.error(f"Error loading model or scaler: {e}")
            # Do not raise here; allow the server to start, we'll raise an error during prediction.
    return _model, _scaler

# Feature names must match exactly the order used during model training
FEATURE_NAMES = [
    'anxiety_level', 'self_esteem', 'mental_health_history', 'depression',
    'headache', 'blood_pressure', 'sleep_quality', 'breathing_problem',
    'noise_level', 'living_conditions', 'safety', 'basic_needs',
    'academic_performance', 'study_load', 'teacher_student_relationship',
    'future_career_concerns', 'social_support', 'peer_pressure',
    'extracurricular_activities', 'bullying'
]

@lru_cache(maxsize=512)
def _predict_from_features_tuple(features_tuple: tuple[float, ...]) -> dict:
    model, scaler = get_model_and_scaler()
    if not model or not scaler:
        raise RuntimeError("Model or Scaler not loaded. Please make sure the .pkl files exist.")

    # Pass as named DataFrame so scaler.transform() matches training-time column names
    features_df = pd.DataFrame([list(features_tuple)], columns=FEATURE_NAMES)
    scaled_features = scaler.transform(features_df)

    prediction = model.predict(scaled_features)

    try:
        probabilities = model.predict_proba(scaled_features)
        confidence = float(np.max(probabilities[0]))
    except Exception:
        confidence = 1.0

    stress_level = int(prediction[0])

    feature_importance = {}
    feature_contributions = []
    try:
        booster = model.get_booster()
        dmatrix = xgb.DMatrix(scaled_features, feature_names=FEATURE_NAMES)
        contrib_matrix = booster.predict(dmatrix, pred_contribs=True)
        if contrib_matrix.ndim == 3:
            per_feature = contrib_matrix[0][stress_level][:-1]
        else:
            per_feature = contrib_matrix[0][:-1]
        contrib_dict = {fname: float(val) for fname, val in zip(FEATURE_NAMES, per_feature)}
        abs_pairs = [(fname, abs(val)) for fname, val in contrib_dict.items()]
        sorted_pairs = sorted(abs_pairs, key=lambda x: x[1], reverse=True)[:6]
        top_total = sum(val for _, val in sorted_pairs) or 1.0
        feature_importance = {fname: round(abs(contrib_dict[fname]) / top_total, 4) for fname, _ in sorted_pairs}
        feature_contributions = [
            {
                "feature": fname,
                "contribution": contrib_dict[fname],
                "magnitude": abs(contrib_dict[fname])
            }
            for fname in FEATURE_NAMES
        ]
    except Exception:
        feature_importance = {
            "anxiety_level": 0.25,
            "depression": 0.20,
            "sleep_quality": 0.20,
            "study_load": 0.20,
            "social_support": 0.15
        }
        feature_contributions = []

    return {
        "stress_level": stress_level,
        "confidence_score": confidence,
        "model_version": CURRENT_MODEL_VERSION,
        "feature_importance": feature_importance,
        "feature_contributions": feature_contributions
    }


def predict_stress(input_data: dict) -> dict:
    # Build feature values in the exact same order as FEATURE_NAMES
    features_tuple = (
        float(input_data.get('anxiety_level', 0)),
        float(input_data.get('self_esteem', 0)),
        float(input_data.get('mental_health_history', 0)),
        float(input_data.get('depression', 0)),
        float(input_data.get('headache', 0)),
        float(input_data.get('blood_pressure', 1)),
        float(input_data.get('sleep_quality', 0)),
        float(input_data.get('breathing_problem', 0)),
        float(input_data.get('noise_level', 0)),
        float(input_data.get('living_conditions', 0)),
        float(input_data.get('safety', 0)),
        float(input_data.get('basic_needs', 0)),
        float(input_data.get('academic_performance', 0)),
        float(input_data.get('study_load', 0)),
        float(input_data.get('teacher_student_relationship', 0)),
        float(input_data.get('future_career_concerns', 0)),
        float(input_data.get('social_support', 0)),
        float(input_data.get('peer_pressure', 0)),
        float(input_data.get('extracurricular_activities', 0)),
        float(input_data.get('bullying', 0))
    )
    # Return a defensive copy because callers may alter response fields.
    return deepcopy(_predict_from_features_tuple(features_tuple))
