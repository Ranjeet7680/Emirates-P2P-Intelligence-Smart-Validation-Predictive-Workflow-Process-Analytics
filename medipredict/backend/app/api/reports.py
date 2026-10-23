import os, io
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from ..core.database import get_db
from ..models.entities import User, MedicalReport, LabMeasurement, AuditLog
from ..schemas.dto import ReportSummaryDTO, LabMeasurementDTO, MeasurementCorrectionDTO
from ..services.lab_report_parser import lab_parser
from .auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Medical Reports Analyzer"])
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ReportSummaryDTO)
async def upload_medical_report(
    file: UploadFile = File(...),
    title: str = Form(None),
    laboratory_name: str = Form("Quest Diagnostics / Emirates Health"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_filename = f"{current_user.id}_{int(datetime.now().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, clean_filename)
    
    # Save file to disk
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Parse measurements
    raw_text = lab_parser.extract_text_from_file(file_path, file.content_type)
    extracted_measurements, summary = lab_parser.parse_measurements(raw_text)

    # Create report record
    report = MedicalReport(
        user_id=current_user.id,
        title=title or f"Lab Report - {file.filename}",
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        status="verified" if len(extracted_measurements) > 0 else "flagged",
        extracted_summary=summary,
        laboratory_name=laboratory_name,
        test_date=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Save measurements
    saved_measurements = []
    for m in extracted_measurements:
        meas = LabMeasurement(
            report_id=report.id,
            user_id=current_user.id,
            test_name=m.test_name,
            category=m.category,
            value_numeric=m.value_numeric,
            units=m.units,
            ref_low=m.ref_low,
            ref_high=m.ref_high,
            flag=m.flag,
            confidence_score=m.confidence_score,
            interpretation=m.interpretation
        )
        db.add(meas)
        saved_measurements.append(meas)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="REPORT_UPLOADED",
        resource_type="MedicalReport",
        resource_id=report.id,
        details={"measurements_extracted": len(saved_measurements)}
    )
    db.add(audit)
    db.commit()

    return ReportSummaryDTO(
        id=report.id,
        title=report.title,
        original_filename=report.original_filename,
        file_type=report.file_type,
        status=report.status,
        extracted_summary=report.extracted_summary,
        clinical_notes=report.clinical_notes,
        test_date=report.test_date,
        laboratory_name=report.laboratory_name,
        created_at=report.created_at,
        measurements=[LabMeasurementDTO.from_orm(m) for m in saved_measurements]
    )

@router.get("", response_model=List[ReportSummaryDTO])
def list_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).order_by(MedicalReport.created_at.desc()).all()
    results = []
    for r in reports:
        meas = db.query(LabMeasurement).filter(LabMeasurement.report_id == r.id).all()
        dto = ReportSummaryDTO(
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
        )
        results.append(dto)
    return results

@router.get("/{report_id}", response_model=ReportSummaryDTO)
def get_report_detail(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Clinicians can view patient reports; patients can only view their own
    if current_user.role != "clinician" and current_user.role != "admin" and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to medical record")

    meas = db.query(LabMeasurement).filter(LabMeasurement.report_id == report.id).all()
    return ReportSummaryDTO(
        id=report.id,
        title=report.title,
        original_filename=report.original_filename,
        file_type=report.file_type,
        status=report.status,
        extracted_summary=report.extracted_summary,
        clinical_notes=report.clinical_notes,
        test_date=report.test_date,
        laboratory_name=report.laboratory_name,
        created_at=report.created_at,
        measurements=[LabMeasurementDTO.from_orm(m) for m in meas]
    )

@router.patch("/{report_id}/measurements/{measurement_id}")
def correct_measurement(
    report_id: str,
    measurement_id: str,
    correction: MeasurementCorrectionDTO,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meas = db.query(LabMeasurement).filter(LabMeasurement.id == measurement_id, LabMeasurement.report_id == report_id).first()
    if not meas:
        raise HTTPException(status_code=404, detail="Measurement record not found")

    old_val = meas.value_numeric
    meas.value_numeric = correction.value_numeric
    meas.user_corrected = True
    if correction.units:
        meas.units = correction.units
    if correction.ref_low is not None:
        meas.ref_low = correction.ref_low
    if correction.ref_high is not None:
        meas.ref_high = correction.ref_high

    # Re-evaluate flag
    if meas.ref_high is not None and meas.value_numeric > meas.ref_high:
        meas.flag = "HIGH"
    elif meas.ref_low is not None and meas.value_numeric < meas.ref_low:
        meas.flag = "LOW"
    else:
        meas.flag = "NORMAL"

    audit = AuditLog(
        user_id=current_user.id,
        action="MEASUREMENT_CORRECTED",
        resource_type="LabMeasurement",
        resource_id=meas.id,
        details={"old_value": old_val, "new_value": meas.value_numeric}
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "measurement_id": meas.id, "new_flag": meas.flag}

@router.get("/{report_id}/pdf-summary")
def generate_pdf_summary(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    measurements = db.query(LabMeasurement).filter(LabMeasurement.report_id == report_id).all()

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setTitle(f"MediPredict Summary - {report.title}")

    # Header
    p.setFont("Helvetica-Bold", 18)
    p.drawString(50, 750, "MediPredict AI — Clinical Laboratory Summary")
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor("#4b5563"))
    p.drawString(50, 735, f"Report ID: {report.id}  |  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Patient & Specimen Info
    p.setFillColor(colors.black)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 700, "Specimen Information")
    p.setFont("Helvetica", 10)
    p.drawString(50, 680, f"Document: {report.title}")
    p.drawString(50, 665, f"Laboratory: {report.laboratory_name or 'Central Diagnostic Laboratory'}")
    p.drawString(50, 650, f"Collection Date: {report.test_date or 'Recent'}")

    # Table Header
    y = 610
    p.setFillColor(colors.HexColor("#1e293b"))
    p.rect(50, y, 510, 20, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 9)
    p.drawString(60, y + 6, "TEST NAME")
    p.drawString(220, y + 6, "VALUE")
    p.drawString(300, y + 6, "UNITS")
    p.drawString(370, y + 6, "REFERENCE INTERVAL")
    p.drawString(490, y + 6, "FLAG")

    # Table Rows
    p.setFillColor(colors.black)
    p.setFont("Helvetica", 9)
    y -= 18

    for m in measurements:
        if y < 100:
            p.showPage()
            y = 750

        flag_color = colors.black
        if m.flag == "HIGH":
            flag_color = colors.HexColor("#b91c1c")
        elif m.flag == "CRITICAL":
            flag_color = colors.HexColor("#991b1b")
        elif m.flag == "LOW":
            flag_color = colors.HexColor("#c2410c")

        p.setFillColor(colors.black)
        p.drawString(60, y, m.test_name[:32])
        p.drawString(220, y, str(m.value_numeric))
        p.drawString(300, y, m.units)
        ref_text = f"{m.ref_low} - {m.ref_high}" if m.ref_low is not None else "Standard"
        p.drawString(370, y, ref_text)

        p.setFillColor(flag_color)
        p.drawString(490, y, m.flag)
        y -= 16

    # Disclaimer Footer
    p.setFillColor(colors.HexColor("#64748b"))
    p.setFont("Helvetica-Oblique", 8)
    p.drawString(50, 50, "NON-DIAGNOSTIC ADVISORY: Values extracted via automated parsing. Physician verification required.")
    p.drawString(50, 38, "MediPredict AI does not replace licensed medical professional clinical interpretation.")

    p.save()
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()

    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=medipredict_summary_{report_id[:8]}.pdf"
    })
