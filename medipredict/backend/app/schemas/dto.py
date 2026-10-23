from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# User & Auth
class UserRegisterDTO(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    role: str = "patient" # patient, clinician, researcher, admin

class UserLoginDTO(BaseModel):
    email: EmailStr
    password: str

class TokenDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str

class UserResponseDTO(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Safety Engine
class EmergencyGuidanceDTO(BaseModel):
    is_emergency: bool
    trigger_words: List[str]
    alert_level: str # NONE, WARNING, CRITICAL_EMERGENCY
    guidance_message: Optional[str] = None
    hotlines: Dict[str, str] = {}
    recommendation: Optional[str] = None

# AI Assistant
class AssistantMessageDTO(BaseModel):
    role: str # user, assistant, system
    content: str

class CitationDTO(BaseModel):
    title: str
    source: str
    year: Optional[int] = None
    url: Optional[str] = None
    evidence_level: Optional[str] = None

class AssistantQueryDTO(BaseModel):
    message: str
    conversation_history: Optional[List[AssistantMessageDTO]] = None
    attached_report_id: Optional[str] = None
    preferred_language: str = "en"

class AssistantResponseDTO(BaseModel):
    answer: str
    is_emergency: bool = False
    emergency_guidance: Optional[EmergencyGuidanceDTO] = None
    citations: List[CitationDTO] = []
    uncertainty_level: str = "low" # low, moderate, high
    follow_up_suggestions: List[str] = []
    medical_disclaimer: str

# Lab Reports
class LabMeasurementDTO(BaseModel):
    id: Optional[str] = None
    test_name: str
    category: str = "General"
    value_numeric: float
    units: str
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    flag: str = "NORMAL" # NORMAL, HIGH, LOW, CRITICAL
    confidence_score: float = 0.95
    user_corrected: bool = False
    interpretation: Optional[str] = None

    class Config:
        from_attributes = True

class ReportSummaryDTO(BaseModel):
    id: str
    title: str
    original_filename: str
    file_type: str
    status: str
    extracted_summary: Optional[str] = None
    clinical_notes: Optional[str] = None
    test_date: Optional[str] = None
    laboratory_name: Optional[str] = None
    created_at: datetime
    measurements: List[LabMeasurementDTO] = []

    class Config:
        from_attributes = True

class MeasurementCorrectionDTO(BaseModel):
    value_numeric: float
    units: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None

# Health Metrics
class MetricCreateDTO(BaseModel):
    metric_type: str
    value: float
    unit: str
    notes: Optional[str] = None
    timestamp: Optional[datetime] = None

class MetricResponseDTO(BaseModel):
    id: str
    metric_type: str
    value: float
    unit: str
    source: str
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Disease & Genetics
class DiseaseDTO(BaseModel):
    id: str
    name: str
    icd11: str
    specialty: str
    overview: str
    symptoms: List[str]
    risk_factors: List[str]
    pathophysiology: str
    diagnostic_tests: List[str]
    prevention: List[str]
    research_summary: str
    pubmed_references: List[Dict[str, Any]]
    evidence_quality: str
    last_updated: str

class GeneDTO(BaseModel):
    gene_symbol: str
    ncbi_id: str
    chromosome: str
    full_name: str
    inheritance_pattern: str
    associated_conditions: List[str]
    molecular_mechanism: str
    clinvar_summary: Dict[str, int]
    acmg_classification_guidance: str
    clinical_implications: str
    ncbi_link: str
    clinvar_link: str

# Research & Literature
class PubMedPaperDTO(BaseModel):
    pmid: str
    title: str
    authors: Optional[str] = None
    journal: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    citation_count: Optional[int] = None
    is_saved: bool = False

# Risk Lab
class RiskPredictionInputDTO(BaseModel):
    model_id: str # MOD-DIAB-01 or MOD-CVD-01
    features: Dict[str, float]

class RiskPredictionOutputDTO(BaseModel):
    model_id: str
    model_name: str
    risk_probability: float
    risk_category: str # Low, Borderline, Intermediate, High
    feature_contributions: Dict[str, float] # SHAP/coefficient weights
    actionable_recommendations: List[str]
    disclaimer: str

class ModelCardDTO(BaseModel):
    model_id: str
    name: str
    algorithm: str
    version: str
    status: str
    features: List[str]
    metrics: Dict[str, float]
    feature_importances: Dict[str, float]
    limitations: str
