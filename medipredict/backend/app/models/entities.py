import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import relationship
from ..core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient", nullable=False) # patient, clinician, researcher, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reports = relationship("MedicalReport", back_populates="user", cascade="all, delete-orphan")
    metrics = relationship("HealthMetric", back_populates="user", cascade="all, delete-orphan")
    saved_papers = relationship("SavedPaper", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(50), default="application/pdf")
    status = Column(String(50), default="verified") # pending, processing, verified, flagged
    extracted_summary = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    test_date = Column(String(50), nullable=True)
    laboratory_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reports")
    measurements = relationship("LabMeasurement", back_populates="report", cascade="all, delete-orphan")

class LabMeasurement(Base):
    __tablename__ = "lab_measurements"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    report_id = Column(String(36), ForeignKey("medical_reports.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    test_name = Column(String(255), nullable=False)
    category = Column(String(100), default="General")
    value_numeric = Column(Float, nullable=False)
    units = Column(String(50), nullable=False)
    ref_low = Column(Float, nullable=True)
    ref_high = Column(Float, nullable=True)
    flag = Column(String(20), default="NORMAL") # NORMAL, HIGH, LOW, CRITICAL
    confidence_score = Column(Float, default=0.98)
    user_corrected = Column(Boolean, default=False)
    interpretation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    report = relationship("MedicalReport", back_populates="measurements")

class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    metric_type = Column(String(100), nullable=False) # blood_pressure_systolic, fasting_glucose, heart_rate, spo2, bmi, cholesterol_ldl
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    source = Column(String(50), default="manual") # manual, lab_report, device
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(String(255), nullable=True)

    user = relationship("User", back_populates="metrics")

class SavedPaper(Base):
    __tablename__ = "saved_papers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    pmid = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=True)
    journal = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True)
    doi = Column(String(100), nullable=True)
    abstract = Column(Text, nullable=True)
    collection_name = Column(String(100), default="General Research")
    saved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="saved_papers")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")
