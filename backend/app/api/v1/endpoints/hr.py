"""
hr.py - HR Operations Queue and Triage Handlers
Implements Section 4 & 15 of Blueprint.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import RequestModel
from backend.app.schemas.dto import RequestResponseDTO
from backend.app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/queue", response_model=List[dict])
def get_hr_queue(
    stage: Optional[str] = None,
    risk: Optional[str] = None,  # High, Medium, Low
    department: Optional[str] = None,
    unassigned_only: bool = False,
    limit: int = Query(default=100, le=300),
    db: Session = Depends(get_db)
):
    query = db.query(RequestModel)
    
    # Active queue excludes completed / cancelled
    active_states = [
        "Submitted", "Line Manager Review", "Finance Cost Center Review",
        "HR Ops Validation", "Department Head Approval", "System Processing",
        "Returned for Correction"
    ]
    query = query.filter(RequestModel.current_state.isin(active_states))
    
    if stage:
        query = query.filter(RequestModel.current_state == stage)
    if department:
        query = query.filter(RequestModel.department == department)
    if unassigned_only:
        query = query.filter(RequestModel.current_owner_role.like("%Unassigned%"))

    reqs = query.order_by(RequestModel.created_at.desc()).limit(limit).all()

    # Enrich each queue item with real-time risk predictions
    enriched_queue = []
    for r in reqs:
        req_dict = {
            "request_id": r.request_id,
            "request_type": r.request_type,
            "department": r.department,
            "current_grade": r.current_grade,
            "target_grade": r.target_grade,
            "is_safety_critical": r.is_safety_critical,
            "lead_time_days": r.lead_time_days,
            "initial_error_count": r.initial_error_count,
            "initial_warning_count": r.initial_warning_count
        }
        scores = prediction_service.score_request(req_dict)
        ret_score = scores.get("return_risk")
        del_score = scores.get("delay_risk")

        highest_band = "Low"
        if (ret_score and ret_score.risk_band == "High") or (del_score and del_score.risk_band == "High"):
            highest_band = "High"
        elif (ret_score and ret_score.risk_band == "Medium") or (del_score and del_score.risk_band == "Medium"):
            highest_band = "Medium"

        if risk and highest_band != risk:
            continue

        enriched_queue.append({
            "request_id": r.request_id,
            "request_type": r.request_type,
            "candidate_id": r.candidate_id,
            "department": r.department,
            "current_state": r.current_state,
            "current_owner_role": r.current_owner_role,
            "current_owner_team": r.current_owner_team,
            "next_action": r.next_action,
            "total_elapsed_days": r.total_elapsed_days,
            "lead_time_days": r.lead_time_days,
            "effective_date": r.effective_date,
            "composite_risk_band": highest_band,
            "return_risk_score": ret_score.score if ret_score else 0.0,
            "delay_risk_score": del_score.score if del_score else 0.0,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return enriched_queue
