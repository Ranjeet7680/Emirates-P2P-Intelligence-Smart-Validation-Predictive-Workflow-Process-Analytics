from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.entities import User, AuditLog
from ..schemas.dto import RiskPredictionInputDTO, RiskPredictionOutputDTO, ModelCardDTO
from ..services.ml_engine import ml_engine
from .auth import get_current_user

router = APIRouter(prefix="/risk-lab", tags=["AI Disease Risk Research Lab"])

@router.get("/models", response_model=List[ModelCardDTO])
def get_available_models():
    return ml_engine.get_available_models()

@router.post("/predict", response_model=RiskPredictionOutputDTO)
def predict_disease_risk(
    dto: RiskPredictionInputDTO,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = ml_engine.predict_risk(dto.model_id, dto.features)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="RISK_MODEL_INFERENCE",
        resource_type="MLModel",
        resource_id=dto.model_id,
        details={
            "risk_prob": result.risk_probability,
            "category": result.risk_category
        }
    )
    db.add(audit)
    db.commit()

    return result
