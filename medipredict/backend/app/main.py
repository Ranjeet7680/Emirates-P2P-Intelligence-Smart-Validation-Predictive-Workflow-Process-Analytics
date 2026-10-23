import os
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .models.entities import User, MedicalReport, LabMeasurement, HealthMetric, AuditLog
from .api import auth, assistant, reports, metrics, diseases, genetics, research, risk_lab, clinician, admin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if users already seeded
        if db.query(User).count() == 0:
            print("[MediPredict Seed] Seeding demo users and initial clinical cohort...")

            # 1. Users
            patient = User(
                email="patient@medipredict.internal",
                hashed_password=pwd_context.hash("patient123"),
                full_name="John Doe",
                role="patient"
            )
            clinician_user = User(
                email="dr.jenkins@medipredict.internal",
                hashed_password=pwd_context.hash("clinician123"),
                full_name="Dr. Sarah Jenkins, MD",
                role="clinician"
            )
            researcher_user = User(
                email="dr.rahman@medipredict.internal",
                hashed_password=pwd_context.hash("research123"),
                full_name="Dr. A. Rahman, PhD",
                role="researcher"
            )
            admin_user = User(
                email="admin@medipredict.internal",
                hashed_password=pwd_context.hash("admin123"),
                full_name="MediPredict Systems Administrator",
                role="admin"
            )
            db.add_all([patient, clinician_user, researcher_user, admin_user])
            db.commit()
            db.refresh(patient)

            # 2. Seed 30 days of Vitals for Patient
            base_time = datetime.now(timezone.utc) - timedelta(days=30)
            sample_metrics = []
            for day in range(30):
                t = base_time + timedelta(days=day)
                # Blood pressure systolic
                sample_metrics.append(HealthMetric(
                    user_id=patient.id,
                    metric_type="blood_pressure_systolic",
                    value=round(124 + (day % 7) * 2.2 - (day % 4) * 1.5, 1),
                    unit="mmHg",
                    source="device",
                    timestamp=t
                ))
                # Blood pressure diastolic
                sample_metrics.append(HealthMetric(
                    user_id=patient.id,
                    metric_type="blood_pressure_diastolic",
                    value=round(78 + (day % 5) * 1.8, 1),
                    unit="mmHg",
                    source="device",
                    timestamp=t
                ))
                # Fasting glucose
                sample_metrics.append(HealthMetric(
                    user_id=patient.id,
                    metric_type="fasting_glucose",
                    value=round(94 + (day % 6) * 3.5, 1),
                    unit="mg/dL",
                    source="device",
                    timestamp=t
                ))
                # Heart rate
                sample_metrics.append(HealthMetric(
                    user_id=patient.id,
                    metric_type="heart_rate",
                    value=round(68 + (day % 8) * 2.0, 1),
                    unit="bpm",
                    source="device",
                    timestamp=t
                ))
            db.add_all(sample_metrics)
            db.commit()

            # 3. Seed Sample Laboratory Report
            sample_report = MedicalReport(
                user_id=patient.id,
                title="Comprehensive Metabolic & Lipid Profile - Q1",
                original_filename="quest_diagnostics_report_2026.pdf",
                file_type="application/pdf",
                status="verified",
                laboratory_name="Quest Diagnostics Clinical Laboratories",
                test_date=(datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
                extracted_summary="Comprehensive outpatient screening showing mild fasting hyperglycemia (112 mg/dL) and borderline elevated LDL cholesterol (138 mg/dL). Renal function and electrolytes are within normal limits.",
                clinical_notes="Verified by Dr. Sarah Jenkins. Recommended repeat HbA1c in 3 months with dietary consultation."
            )
            db.add(sample_report)
            db.commit()
            db.refresh(sample_report)

            # Sample Lab Measurements
            sample_labs = [
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="Fasting Plasma Glucose",
                    category="Metabolic",
                    value_numeric=112.0,
                    units="mg/dL",
                    ref_low=70.0,
                    ref_high=99.0,
                    flag="HIGH",
                    confidence_score=0.98,
                    interpretation="Values between 100-125 mg/dL indicate impaired fasting glucose (prediabetes)."
                ),
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="Hemoglobin A1c",
                    category="Metabolic",
                    value_numeric=5.9,
                    units="%",
                    ref_low=4.0,
                    ref_high=5.6,
                    flag="HIGH",
                    confidence_score=0.97,
                    interpretation="Elevated HbA1c 5.7-6.4% reflects increased lifetime risk for diabetes."
                ),
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="Total Cholesterol",
                    category="Lipids",
                    value_numeric=218.0,
                    units="mg/dL",
                    ref_low=120.0,
                    ref_high=199.0,
                    flag="HIGH",
                    confidence_score=0.96,
                    interpretation="Desirable total cholesterol is < 200 mg/dL."
                ),
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="LDL Cholesterol",
                    category="Lipids",
                    value_numeric=138.0,
                    units="mg/dL",
                    ref_low=50.0,
                    ref_high=99.0,
                    flag="HIGH",
                    confidence_score=0.98,
                    interpretation="Elevated primary atherogenic particle. Target depends on cardiovascular risk profile."
                ),
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="HDL Cholesterol",
                    category="Lipids",
                    value_numeric=48.0,
                    units="mg/dL",
                    ref_low=40.0,
                    ref_high=80.0,
                    flag="NORMAL",
                    confidence_score=0.95,
                    interpretation="Normal protective HDL range."
                ),
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="Serum Creatinine",
                    category="Renal",
                    value_numeric=0.92,
                    units="mg/dL",
                    ref_low=0.6,
                    ref_high=1.2,
                    flag="NORMAL",
                    confidence_score=0.99,
                    interpretation="Normal renal glomerular filtration surrogate."
                ),
                LabMeasurement(
                    report_id=sample_report.id,
                    user_id=patient.id,
                    test_name="eGFR (CKD-EPI)",
                    category="Renal",
                    value_numeric=98.0,
                    units="mL/min/1.73m2",
                    ref_low=60.0,
                    ref_high=120.0,
                    flag="NORMAL",
                    confidence_score=0.98,
                    interpretation="Preserved normal kidney function."
                )
            ]
            db.add_all(sample_labs)
            db.commit()

            print("[MediPredict Seed] Seeding completed successfully.")
    finally:
        db.close()

# Ensure tables and seed exist immediately
seed_database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MediPredict AI — Intelligent Healthcare. Earlier Insights. Better Decisions.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(assistant.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(metrics.router, prefix=settings.API_V1_PREFIX)
app.include_router(diseases.router, prefix=settings.API_V1_PREFIX)
app.include_router(genetics.router, prefix=settings.API_V1_PREFIX)
app.include_router(research.router, prefix=settings.API_V1_PREFIX)
app.include_router(risk_lab.router, prefix=settings.API_V1_PREFIX)
app.include_router(clinician.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "documentation": "/docs",
        "api_prefix": settings.API_V1_PREFIX
    }
