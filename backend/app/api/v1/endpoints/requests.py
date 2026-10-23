"""
requests.py - Request Management, SmartCheck Validation, and Workflow Handlers
"""
import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import RequestModel, WorkflowEventModel, ValidationRunModel, AuditEventModel
from backend.app.schemas.dto import (
    RequestCreateDTO, RequestResponseDTO, RequestDetailDTO,
    ValidationResult, TransitionRequestDTO, WorkflowEventDTO
)
from backend.app.rules.smart_check import smart_check_engine
from backend.app.services.workflow_service import workflow_service
from backend.app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("", response_model=List[RequestResponseDTO])
def list_requests(
    stage: Optional[str] = None,
    department: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(RequestModel)
    if stage:
        query = query.filter(RequestModel.current_state == stage)
    if department:
        query = query.filter(RequestModel.department == department)
    reqs = query.order_by(RequestModel.created_at.desc()).limit(limit).all()
    return reqs

@router.post("/validate", response_model=ValidationResult)
def validate_transient_request(payload: RequestCreateDTO):
    """
    Client-side/Pre-submission SmartCheck validation endpoint.
    Deterministic evaluation of rules P2P-REQ-001 through P2P-REQ-008.
    """
    dict_payload = payload.dict()
    return smart_check_engine.validate_request(dict_payload)

@router.post("", response_model=RequestResponseDTO)
def create_request(payload: RequestCreateDTO, db: Session = Depends(get_db)):
    """
    Authoritative server-side submission.
    Runs SmartCheck validation; rejects submission if blocking errors exist.
    """
    dict_payload = payload.dict()
    validation = smart_check_engine.validate_request(dict_payload)
    
    if validation.has_blocking_errors:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Submission blocked by SmartCheck validation rules.",
                "findings": [f.dict() for f in validation.findings if f.severity == "error"]
            }
        )

    # Generate unique canonical request ID
    req_count = db.query(RequestModel).count() + 1
    req_id = f"P2P-2026-{req_count:05d}"
    
    # Calculate grade jump
    try:
        curr_g = int(payload.current_grade.replace("EK-", ""))
        tgt_g = int(payload.target_grade.replace("EK-", ""))
        grade_jump = max(0, tgt_g - curr_g)
    except Exception:
        grade_jump = 0

    # Calculate lead time
    try:
        eff_d = datetime.strptime(payload.effective_date[:10], "%Y-%m-%d").date()
        lead_time_days = max(1, (eff_d - datetime.utcnow().date()).days)
    except Exception:
        lead_time_days = 14

    new_req = RequestModel(
        request_id=req_id,
        request_type=payload.request_type,
        current_state="Submitted",
        submitter_role="Line Manager",
        candidate_id=payload.candidate_id,
        current_grade=payload.current_grade,
        target_grade=payload.target_grade,
        grade_jump=grade_jump,
        destination_position_id=payload.destination_position_id,
        department=payload.department,
        cost_center=payload.cost_center,
        is_safety_critical=1 if payload.is_safety_critical else 0,
        lead_time_days=lead_time_days,
        effective_date=payload.effective_date,
        target_sla_days=5.0,
        total_elapsed_days=0.0,
        current_owner_role="HR Operations Specialist",
        current_owner_team="HR Operations",
        next_action="Awaiting initial HR validation & clearance check",
        initial_error_count=validation.error_count,
        initial_warning_count=validation.warning_count,
        is_delayed=0,
        was_returned=0,
        payload_json=json.dumps(dict_payload),
        created_at=datetime.utcnow()
    )
    db.add(new_req)

    # Record validation run
    v_run = ValidationRunModel(
        run_id=f"VRUN-{uuid.uuid4().hex[:8].upper()}",
        request_id=req_id,
        rule_version="1.0",
        checked_at=datetime.utcnow(),
        result=validation.valid,
        findings_json=json.dumps([f.dict() for f in validation.findings])
    )
    db.add(v_run)

    # Initial Submitted event
    init_event = WorkflowEventModel(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        request_id=req_id,
        stage="Submitted",
        actor_role="Line Manager",
        team=payload.department,
        timestamp=datetime.utcnow().isoformat(),
        duration_hours=0.1,
        outcome="SUBMITTED",
        reason_code="Initial manager submission"
    )
    db.add(init_event)

    # Audit event
    audit = AuditEventModel(
        audit_id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        actor="Line Manager",
        action="REQUEST_SUBMITTED",
        object_type="REQUEST",
        object_id=req_id,
        timestamp=datetime.utcnow(),
        correlation_id=f"CORR-{uuid.uuid4().hex[:6]}",
        details_json=f"Request {req_id} submitted for candidate {payload.candidate_id} to position {payload.destination_position_id}"
    )
    db.add(audit)

    db.commit()
    db.refresh(new_req)
    return new_req

@router.get("/{request_id}", response_model=RequestDetailDTO)
def get_request_detail(request_id: str, db: Session = Depends(get_db)):
    req = db.query(RequestModel).filter(RequestModel.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    timeline = workflow_service.get_timeline(db, request_id)

    # Latest validation run
    v_run = db.query(ValidationRunModel).filter(
        ValidationRunModel.request_id == request_id
    ).order_by(ValidationRunModel.checked_at.desc()).first()

    latest_val = None
    if v_run:
        try:
            findings_data = json.loads(v_run.findings_json)
            latest_val = ValidationResult(
                valid=v_run.result,
                has_blocking_errors=not v_run.result,
                error_count=len([f for f in findings_data if f.get("severity") == "error"]),
                warning_count=len([f for f in findings_data if f.get("severity") == "warning"]),
                findings=findings_data,
                checked_at=v_run.checked_at.isoformat()
            )
        except Exception:
            pass

    # Predictive risk scoring
    req_dict = {
        "request_id": req.request_id,
        "request_type": req.request_type,
        "department": req.department,
        "current_grade": req.current_grade,
        "target_grade": req.target_grade,
        "is_safety_critical": req.is_safety_critical,
        "lead_time_days": req.lead_time_days,
        "initial_error_count": req.initial_error_count,
        "initial_warning_count": req.initial_warning_count
    }
    preds = prediction_service.score_request(req_dict)

    return RequestDetailDTO(
        request=req,
        timeline=timeline,
        latest_validation=latest_val,
        delay_prediction=preds.get("delay_risk").dict() if "delay_risk" in preds else None,
        return_prediction=preds.get("return_risk").dict() if "return_risk" in preds else None
    )

@router.post("/{request_id}/transition", response_model=RequestResponseDTO)
def transition_request(
    request_id: str,
    payload: TransitionRequestDTO,
    db: Session = Depends(get_db)
):
    try:
        updated_req = workflow_service.transition_state(db, request_id, payload)
        return updated_req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{request_id}/timeline", response_model=List[WorkflowEventDTO])
def get_request_timeline(request_id: str, db: Session = Depends(get_db)):
    return workflow_service.get_timeline(db, request_id)
