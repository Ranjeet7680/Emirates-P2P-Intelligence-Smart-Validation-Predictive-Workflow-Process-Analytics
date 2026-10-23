"""
recommendations.py - Improvement Engine Recommendations and ROI Calculator Endpoints
"""
from typing import List, Dict, Any
from fastapi import APIRouter
from backend.app.services.recommendation_service import recommendation_service
from backend.app.schemas.dto import SavingsCalculationRequest, SavingsCalculationResponse

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
def get_recommendations():
    return recommendation_service.get_ranked_recommendations()

@router.post("/calculate-savings", response_model=Dict[str, SavingsCalculationResponse])
def calculate_savings(payload: SavingsCalculationRequest):
    return recommendation_service.calculate_savings(payload)
