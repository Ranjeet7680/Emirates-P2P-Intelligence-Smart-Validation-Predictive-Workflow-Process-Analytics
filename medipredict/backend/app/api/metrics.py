from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.entities import User, HealthMetric, AuditLog
from ..schemas.dto import MetricCreateDTO, MetricResponseDTO
from .auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["Health Metrics Dashboard"])

@router.get("", response_model=List[MetricResponseDTO])
def get_metrics(
    metric_type: Optional[str] = Query(None),
    limit: int = Query(100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(HealthMetric).filter(HealthMetric.user_id == current_user.id)
    if metric_type:
        q = q.filter(HealthMetric.metric_type == metric_type)
    return q.order_by(HealthMetric.timestamp.desc()).limit(limit).all()

@router.post("", response_model=MetricResponseDTO)
def record_metric(
    dto: MetricCreateDTO,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    metric = HealthMetric(
        user_id=current_user.id,
        metric_type=dto.metric_type,
        value=dto.value,
        unit=dto.unit,
        source="manual",
        notes=dto.notes,
        timestamp=dto.timestamp or datetime.now(timezone.utc)
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)

    audit = AuditLog(
        user_id=current_user.id,
        action="METRIC_RECORDED",
        resource_type="HealthMetric",
        resource_id=metric.id,
        details={"type": metric.metric_type, "value": metric.value}
    )
    db.add(audit)
    db.commit()

    return metric

@router.delete("/{metric_id}")
def delete_metric(
    metric_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    metric = db.query(HealthMetric).filter(HealthMetric.id == metric_id, HealthMetric.user_id == current_user.id).first()
    if not metric:
        raise HTTPException(status_code=404, detail="Metric record not found")

    db.delete(metric)
    db.commit()
    return {"status": "success", "deleted_id": metric_id}

@router.get("/trends")
def get_metrics_trends(
    days: int = Query(30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    metrics = db.query(HealthMetric).filter(
        HealthMetric.user_id == current_user.id
    ).order_by(HealthMetric.timestamp.asc()).all()

    # Format points for charting
    chart_points = []
    by_date = {}
    for m in metrics:
        d_str = m.timestamp.strftime("%Y-%m-%d")
        if d_str not in by_date:
            by_date[d_str] = {"date": d_str}
        by_date[d_str][m.metric_type] = m.value

    return {
        "time_series": list(by_date.values()),
        "summary": {
            "total_entries": len(metrics),
            "tracked_types": list(set(m.metric_type for m in metrics))
        }
    }

@router.get("/export-csv")
def export_metrics_csv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = db.query(HealthMetric).filter(HealthMetric.user_id == current_user.id).order_by(HealthMetric.timestamp.desc()).all()
    
    rows = ["ID,Metric Type,Value,Unit,Source,Timestamp,Notes"]
    for m in metrics:
        rows.append(f"{m.id},{m.metric_type},{m.value},{m.unit},{m.source},{m.timestamp.isoformat()},{m.notes or ''}")
    
    csv_text = "\n".join(rows)
    return Response(content=csv_text, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=medipredict_vitals_{datetime.now().strftime('%Y%m%d')}.csv"
    })
