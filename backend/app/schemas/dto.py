"""
dto.py - Pydantic Request and Response Schemas
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ValidationFinding(BaseModel):
    rule_id: str
    severity: str  # error, warning, info
    field_name: str
    message: str
    correction_hint: str
    evidence: Optional[str] = None

class ValidationResult(BaseModel):
    valid: bool
    has_blocking_errors: bool
    error_count: int
    warning_count: int
    findings: List[ValidationFinding]
    checked_at: str

class RequestCreateDTO(BaseModel):
    request_type: str
    candidate_id: str
    current_grade: str
    target_grade: str
    destination_position_id: str
    department: str
    cost_center: str
    effective_date: str
    is_safety_critical: Optional[bool] = False
    clearance_reference: Optional[str] = None
    justification_notes: Optional[str] = None
    reporting_position_id: Optional[str] = None

class RequestResponseDTO(BaseModel):
    model_config = {"from_attributes": True}
    request_id: str
    request_type: str
    current_state: str
    submitter_role: str
    candidate_id: str
    current_grade: str
    target_grade: str
    grade_jump: int
    destination_position_id: str
    department: str
    cost_center: str
    is_safety_critical: int
    lead_time_days: int
    effective_date: str
    target_sla_days: float
    total_elapsed_days: float
    current_owner_role: str
    current_owner_team: str
    next_action: str
    initial_error_count: int
    initial_warning_count: int
    is_delayed: int
    was_returned: int
    created_at: Optional[datetime] = None

class WorkflowEventDTO(BaseModel):
    event_id: str
    request_id: str
    stage: str
    actor_role: str
    team: str
    timestamp: str
    duration_hours: float
    outcome: str
    reason_code: Optional[str] = None

class RequestDetailDTO(BaseModel):
    request: RequestResponseDTO
    timeline: List[WorkflowEventDTO]
    latest_validation: Optional[ValidationResult] = None
    delay_prediction: Optional[Dict[str, Any]] = None
    return_prediction: Optional[Dict[str, Any]] = None

class TransitionRequestDTO(BaseModel):
    action: str  # APPROVE, RETURN, CANCEL, RESUBMIT
    actor_role: str
    team: str
    reason_code: Optional[str] = None
    comments: Optional[str] = None

class PredictionFactor(BaseModel):
    factor: str
    importance: float
    direction: Optional[str] = None

class RiskPredictionDTO(BaseModel):
    model_config = {"protected_namespaces": ()}
    prediction_id: str
    request_id: str
    target: str
    score: float
    risk_band: str  # Low, Medium, High
    model_version: str
    generated_at: str
    top_factors: List[PredictionFactor]
    advisory_notice: str
    recommended_review_action: str

class SavingsCalculationRequest(BaseModel):
    monthly_volume: int = Field(default=350, description="Monthly incoming P2P requests")
    avoidable_minutes_per_request: float = Field(default=45.0, description="Avoidable rework minutes saved")
    avoided_returns_share: float = Field(default=0.60, description="Share of returns eliminated via SmartCheck")

class SavingsCalculationResponse(BaseModel):
    scenario: str
    monthly_requests_affected: int
    hours_saved_per_month: float
    fte_capacity_unlocked: float
    annual_hours_saved: float
    assumptions: List[str]
