import pytest
from fastapi.testclient import TestClient
from medipredict.backend.app.main import app
from medipredict.backend.app.services.safety_engine import MedicalSafetyEngine
from medipredict.backend.app.services.lab_report_parser import lab_parser

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ONLINE"
    assert "MediPredict" in data["app"]

def test_admin_health_endpoint():
    res = client.get("/api/v1/admin/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["statistics"]["registered_users"] >= 4
    assert len(data["loaded_models"]) >= 2

def test_emergency_safety_detector():
    # Emergency query
    emergency_q = "I have severe crushing chest pain and shortness of breath"
    safety = MedicalSafetyEngine.evaluate_input_safety(emergency_q)
    assert safety.is_emergency is True
    assert safety.alert_level == "CRITICAL_EMERGENCY"
    assert any("chest pain" in w for w in safety.trigger_words)

    # Non-emergency query
    safe_q = "What is the normal reference range for fasting blood glucose?"
    safety_safe = MedicalSafetyEngine.evaluate_input_safety(safe_q)
    assert safety_safe.is_emergency is False
    assert safety_safe.alert_level == "NONE"

def test_assistant_chat_endpoint():
    res = client.post("/api/v1/assistant/chat", json={
        "message": "What is Type 2 Diabetes Mellitus and what are standard diagnostic criteria?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "Diabetes" in data["answer"]
    assert len(data["citations"]) > 0
    assert "educational" in data["medical_disclaimer"].lower()

def test_emergency_assistant_chat():
    res = client.post("/api/v1/assistant/chat", json={
        "message": "I feel sudden numbness in my left arm and crushing chest pressure"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_emergency"] is True
    assert "EMERGENCY" in data["answer"]

def test_lab_report_parser():
    sample_text = """
    Patient: John Doe   Date: 2026-05-10
    Laboratory Diagnostic Workup
    Fasting Plasma Glucose: 135 mg/dL
    Hemoglobin A1c: 6.8 %
    Total Cholesterol: 240 mg/dL
    Serum Creatinine: 0.95 mg/dL
    """
    measurements, summary = lab_parser.parse_measurements(sample_text)
    assert len(measurements) >= 4
    
    glucose = next(m for m in measurements if m.test_name == "Fasting Plasma Glucose")
    assert glucose.value_numeric == 135.0
    assert glucose.flag == "HIGH"

    a1c = next(m for m in measurements if m.test_name == "Hemoglobin A1c")
    assert a1c.value_numeric == 6.8
    assert a1c.flag == "HIGH"

    creat = next(m for m in measurements if m.test_name == "Serum Creatinine")
    assert creat.value_numeric == 0.95
    assert creat.flag == "NORMAL"

def test_metrics_recording_and_trends():
    # Login as patient
    login_res = client.post("/api/v1/auth/login", json={
        "email": "patient@medipredict.internal",
        "password": "patient123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Record a new metric
    create_res = client.post("/api/v1/metrics", headers=headers, json={
        "metric_type": "fasting_glucose",
        "value": 105.0,
        "unit": "mg/dL",
        "notes": "Morning fasting check"
    })
    assert create_res.status_code == 200
    metric_id = create_res.json()["id"]

    # Check trends
    trends_res = client.get("/api/v1/metrics/trends", headers=headers)
    assert trends_res.status_code == 200
    trends_data = trends_res.json()
    assert len(trends_data["time_series"]) > 0

    # Delete recorded metric
    del_res = client.delete(f"/api/v1/metrics/{metric_id}", headers=headers)
    assert del_res.status_code == 200

def test_disease_explorer():
    res = client.get("/api/v1/diseases?search=diabetes")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Type 2 Diabetes Mellitus"
    assert data[0]["icd11"] == "5A11"

def test_genetics_explorer():
    res = client.get("/api/v1/genetics/genes?search=BRCA1")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["gene_symbol"] == "BRCA1"
    assert "Autosomal Dominant" in data[0]["inheritance_pattern"]

def test_pubmed_research_search():
    res = client.get("/api/v1/research/pubmed?q=diabetes")
    assert res.status_code == 200
    papers = res.json()
    assert len(papers) >= 1
    assert papers[0]["pmid"] is not None

def test_risk_lab_models_and_prediction():
    # Models registry
    models_res = client.get("/api/v1/risk-lab/models")
    assert models_res.status_code == 200
    models = models_res.json()
    assert len(models) >= 2

    # Predict Diabetes
    pred_res = client.post("/api/v1/risk-lab/predict", json={
        "model_id": "MOD-DIAB-01",
        "features": {
            "age": 55.0,
            "bmi": 31.5,
            "glucose_fasting": 128.0,
            "hba1c": 6.7,
            "systolic_bp": 138.0,
            "family_history_score": 1.0,
            "physical_activity_hours": 1.5
        }
    })
    assert pred_res.status_code == 200
    result = pred_res.json()
    assert result["risk_category"] in ["Intermediate", "High"]
    assert result["risk_probability"] > 0.20
    assert len(result["feature_contributions"]) > 0
    assert "EXPERIMENTAL" in result["disclaimer"]
