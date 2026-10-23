"""
entities.py - SQLAlchemy Database Models
Implements Appendix A (Suggested Database Tables) of Blueprint.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from backend.app.core.database import Base

class RequestModel(Base):
    __tablename__ = "requests"
    
    request_id = Column(String(50), primary_key=True, index=True)
    request_type = Column(String(100), nullable=False, index=True)
    current_state = Column(String(50), nullable=False, index=True, default="Draft")
    submitter_role = Column(String(50), nullable=False, default="Line Manager")
    candidate_id = Column(String(50), nullable=False)
    current_grade = Column(String(20), nullable=False)
    target_grade = Column(String(20), nullable=False)
    grade_jump = Column(Integer, default=0)
    destination_position_id = Column(String(50), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    cost_center = Column(String(50), nullable=False)
    is_safety_critical = Column(Integer, default=0)
    lead_time_days = Column(Integer, default=14)
    effective_date = Column(String(50), nullable=False)
    target_sla_days = Column(Float, default=5.0)
    total_elapsed_days = Column(Float, default=0.0)
    current_owner_role = Column(String(50), default="Line Manager")
    current_owner_team = Column(String(100), default="Operations")
    next_action = Column(String(255), default="Submit request for initial review")
    initial_error_count = Column(Integer, default=0)
    initial_warning_count = Column(Integer, default=0)
    is_delayed = Column(Integer, default=0)
    was_returned = Column(Integer, default=0)
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowEventModel(Base):
    __tablename__ = "workflow_events"
    
    event_id = Column(String(50), primary_key=True, index=True)
    request_id = Column(String(50), index=True, nullable=False)
    stage = Column(String(100), nullable=False)
    actor_role = Column(String(100), nullable=False)
    team = Column(String(100), nullable=False)
    timestamp = Column(String(50), nullable=False)
    duration_hours = Column(Float, default=0.0)
    outcome = Column(String(50), nullable=False)
    reason_code = Column(String(255), nullable=True)


class ValidationRunModel(Base):
    __tablename__ = "validation_runs"
    
    run_id = Column(String(50), primary_key=True, index=True)
    request_id = Column(String(50), index=True, nullable=False)
    rule_version = Column(String(20), default="1.0")
    checked_at = Column(DateTime, default=datetime.utcnow)
    result = Column(Boolean, nullable=False)
    findings_json = Column(Text, nullable=False)


class PredictionModel(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(String(50), primary_key=True, index=True)
    request_id = Column(String(50), index=True, nullable=False)
    target = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    risk_band = Column(String(20), nullable=False)  # Low, Medium, High
    model_version = Column(String(50), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    explanation_json = Column(Text, nullable=True)


class AuditEventModel(Base):
    __tablename__ = "audit_events"
    
    audit_id = Column(String(50), primary_key=True, index=True)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    object_type = Column(String(50), nullable=False)
    object_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    correlation_id = Column(String(50), nullable=False)
    details_json = Column(Text, nullable=True)
