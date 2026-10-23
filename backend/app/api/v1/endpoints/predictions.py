"""
predictions.py - Machine Learning Risk Prediction Endpoints
"""
import os
import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from backend.app.services.prediction_service import prediction_service
from backend.app.schemas.dto import RiskPredictionDTO
from backend.app.core.config import settings

router = APIRouter()
REGISTRY_PATH = os.path.join(settings.MODELS_PATH, "model_registry.json")

@router.post("/score", response_model=Dict[str, RiskPredictionDTO])
def score_arbitrary_request(payload: Dict[str, Any]):
    """
    Generate advisory Return Risk and Delay Risk predictions.
    Does not mutate request state or replace authorized human approval.
    """
    return prediction_service.score_request(payload)

@router.get("/registry")
def get_model_registry():
    """
    Exposes model metadata, training timestamps, features used, and evaluation metrics.
    """
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Model registry metadata not found")
