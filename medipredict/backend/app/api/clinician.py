from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.entities import User, MedicalReport, LabMeasurement, AuditLog
from ..schemas.dto import ReportSummaryDTO, LabMeasurementDTO
from .auth import get_current_user

router = APIRouter(prefix="/clinician", tags=["Clinician Workspace"])

def require_clinician(user: User = Depends(get_current_user)):
    if user.role not in ["clinician", "admin"]:
        raise HTTPException(status_code=403, detail="Clinician or Administrator credentials required")
    return user

@router.get("/queue", response_model=List[ReportSummaryDTO])
def get_clinician_review_queue(
    clinician: User = Depends(require_clinician),
    db: Session = Depends(get_db)
):
    # Returns patient reports needing review or flagged
    reports = db.query(MedicalReport).order_by(MedicalReport.created_at.desc()).limit(50).all()
    results = []
    for r in reports:
        meas = db.query(LabMeasurement).filter(LabMeasurement.report_id == r.id).all()
        results.append(ReportSummaryDTO(
            id=r.id,
            title=r.title,
            original_filename=r.original_filename,
            file_type=r.file_type,
            status=r.status,
            extracted_summary=r.extracted_summary,
            clinical_notes=r.clinical_notes,
            test_date=r.test_date,
            laboratory_name=r.laboratory_name,
            created_at=r.created_at,
            measurements=[LabMeasurementDTO.from_orm(m) for m in meas]
        ))
    return results

@router.post("/reports/{report_id}/verify")
def verify_patient_report(
    report_id: str,
    clinical_notes: str = Body(..., embed=True),
    clinician: User = Depends(require_clinician),
    db: Session = Depends(get_db)
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Medical report not found")

    report.status = "verified"
    report.clinical_notes = clinical_notes

    audit = AuditLog(
        user_id=clinician.id,
        action="CLINICIAN_VERIFIED_REPORT",
        resource_type="MedicalReport",
        resource_id=report.id,
        details={"verified_by": clinician.full_name}
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "report_id": report.id, "clinical_status": "verified"}
