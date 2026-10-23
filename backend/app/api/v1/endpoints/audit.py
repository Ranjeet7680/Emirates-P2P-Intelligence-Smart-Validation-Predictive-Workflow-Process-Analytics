"""
audit.py - Append-Only Governance and Audit Trail Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import AuditEventModel

router = APIRouter()

@router.get("")
def list_audit_events(
    object_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEventModel)
    if object_id:
        query = query.filter(AuditEventModel.object_id == object_id)
    if action:
        query = query.filter(AuditEventModel.action.like(f"%{action}%"))
    return query.order_by(AuditEventModel.timestamp.desc()).limit(limit).all()
