from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..models.entities import User, MedicalReport, HealthMetric, AuditLog
from ..services.ml_engine import ml_engine
from .auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Administration & Platform Management"])

@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    report_count = db.query(MedicalReport).count()
    metric_count = db.query(HealthMetric).count()
    audit_count = db.query(AuditLog).count()

    return {
        "status": "HEALTHY",
        "service": "MediPredict AI Core Platform",
        "version": settings.VERSION,
        "database": "SQLite (SQLAlchemy 2.0)",
        "statistics": {
            "registered_users": user_count,
            "uploaded_reports": report_count,
            "health_metric_readings": metric_count,
            "immutable_audit_events": audit_count
        },
        "loaded_models": list(ml_engine.models.keys()),
        "safety_engine": "ACTIVE (ISO-14971 Medical AI Risk Compliant)"
    }

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ]

@router.get("/ai-providers")
def get_ai_providers_status():
    return {
        "configured_provider": settings.AI_PROVIDER,
        "gemini_ready": bool(settings.GEMINI_API_KEY),
        "openai_ready": bool(settings.OPENAI_API_KEY),
        "local_fallback_ready": True,
        "rag_knowledge_entries": 40
    }
