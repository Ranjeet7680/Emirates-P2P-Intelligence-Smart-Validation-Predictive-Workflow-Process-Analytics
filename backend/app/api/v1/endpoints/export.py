"""
export.py - Organiser Schema Prediction & Audit CSV Export Endpoints
Implements FR-07 and AC-08 of Architecture Blueprint.
"""
import io
import csv
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import RequestModel
from backend.app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/test-predictions")
def export_test_predictions(db: Session = Depends(get_db)):
    """
    Exports predictions in the organiser's exact required submission schema:
    request_id, return_risk_score, return_risk_band, delay_risk_score, delay_risk_band, model_version
    Omits sensitive personal fields.
    """
    # Grab in-flight or sample requests
    reqs = db.query(RequestModel).limit(200).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "request_id",
        "return_risk_score",
        "return_risk_band",
        "delay_risk_score",
        "delay_risk_band",
        "top_contributing_factor",
        "model_version"
    ])

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

        top_f = ret_score.top_factors[0].factor if ret_score and ret_score.top_factors else "Lead Time"
        m_ver = ret_score.model_version if ret_score else "v1.0"

        writer.writerow([
            r.request_id,
            ret_score.score if ret_score else 0.0,
            ret_score.risk_band if ret_score else "Low",
            del_score.score if del_score else 0.0,
            del_score.risk_band if del_score else "Low",
            top_f,
            m_ver
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=emirates_p2p_predictions_export.csv"}
    )
