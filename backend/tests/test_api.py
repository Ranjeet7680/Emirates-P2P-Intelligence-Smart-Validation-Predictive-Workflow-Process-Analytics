"""
test_api.py - Integration Tests for Emirates P2P Intelligence API Endpoints
Verifies Acceptance Criteria AC-01 through AC-08 from Blueprint Appendix B.
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["models"]["return_risk_model"] == "LOADED"
    assert data["models"]["delay_risk_model"] == "LOADED"

def test_list_positions():
    response = client.get("/api/v1/positions?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "position_id" in data[0]
    assert "cost_center" in data[0]

def test_list_rules():
    response = client.get("/api/v1/rules")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 8
    rule_ids = [r["rule_id"] for r in data]
    assert "P2P-REQ-001" in rule_ids
    assert "P2P-REQ-006" in rule_ids

def test_validate_transient_request_invalid():
    """AC-01: Invalid request fails validation with structured findings."""
    payload = {
        "request_type": "Position-to-Person Assignment",
        "candidate_id": "EMP-EK-99999",
        "current_grade": "EK-04",
        "target_grade": "EK-10",  # Grade jump 6!
        "destination_position_id": "POS-INVALID-000",
        "department": "Flight Operations",
        "cost_center": "CC-999999",
        "effective_date": "2026-11-01"
    }
    response = client.post("/api/v1/requests/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["has_blocking_errors"] is True
    assert data["error_count"] >= 2
    rule_ids = [f["rule_id"] for f in data["findings"]]
    assert "P2P-REQ-001" in rule_ids
    assert "P2P-REQ-003" in rule_ids

def test_submission_blocked_on_server_side():
    """AC-06 / Security: Server refuses submission when blocking errors exist."""
    payload = {
        "request_type": "Position-to-Person Assignment",
        "candidate_id": "EMP-EK-99999",
        "current_grade": "EK-04",
        "target_grade": "EK-10",
        "destination_position_id": "POS-INVALID-000",
        "department": "Flight Operations",
        "cost_center": "CC-999999",
        "effective_date": "2026-11-01"
    }
    response = client.post("/api/v1/requests", json=payload)
    assert response.status_code == 422
    assert "Submission blocked by SmartCheck" in response.json()["detail"]["message"]

def test_create_and_retrieve_valid_request():
    """AC-02 & AC-03: Create valid request, get canonical ID, and verify timeline."""
    # Find vacant position
    pos_resp = client.get("/api/v1/positions?vacant_only=true&limit=1")
    assert pos_resp.status_code == 200
    pos = pos_resp.json()[0]

    payload = {
        "request_type": "Position-to-Person Assignment",
        "candidate_id": "EMP-EK-77112",
        "current_grade": pos["grade"],
        "target_grade": pos["grade"],
        "destination_position_id": pos["position_id"],
        "department": pos["department"],
        "cost_center": pos["cost_center"],
        "effective_date": "2026-12-15",
        "is_safety_critical": pos["is_safety_critical"],
        "clearance_reference": "GCAA-MED-TEST-1234"
    }
    response = client.post("/api/v1/requests", json=payload)
    assert response.status_code == 200
    created = response.json()
    assert "P2P-2026-" in created["request_id"]
    assert created["current_state"] == "Submitted"

    # AC-03: Retrieve details & verify timeline
    detail_resp = client.get(f"/api/v1/requests/{created['request_id']}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["request"]["request_id"] == created["request_id"]
    assert len(detail["timeline"]) >= 1
    assert detail["timeline"][0]["stage"] == "Submitted"
    assert detail["delay_prediction"] is not None
    assert detail["return_prediction"] is not None

def test_prediction_scoring():
    """AC-04: Model scoring exposes target, scores, bands, factors and advisory notice."""
    payload = {
        "request_id": "P2P-TEST-99",
        "request_type": "Promotion",
        "department": "Engineering & Maintenance",
        "current_grade": "EK-06",
        "target_grade": "EK-07",
        "grade_jump": 1,
        "is_safety_critical": 1,
        "lead_time_days": 10,
        "initial_error_count": 0,
        "initial_warning_count": 1
    }
    response = client.post("/api/v1/predictions/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "return_risk" in data
    assert "delay_risk" in data
    assert data["return_risk"]["risk_band"] in ["Low", "Medium", "High"]
    assert "Advisory" in data["return_risk"]["advisory_notice"]
    assert len(data["return_risk"]["top_factors"]) > 0

def test_analytics_endpoints():
    """AC-05: Analytics endpoints return empirical event-log reconciliations."""
    resp_overview = client.get("/api/v1/analytics/overview")
    assert resp_overview.status_code == 200
    overview = resp_overview.json()
    assert "first_time_right_rate" in overview
    assert "avoidable_return_rate" in overview

    resp_bottlenecks = client.get("/api/v1/analytics/bottlenecks")
    assert resp_bottlenecks.status_code == 200
    assert len(resp_bottlenecks.json()) > 0

    resp_loops = client.get("/api/v1/analytics/loops")
    assert resp_loops.status_code == 200
    assert "total_return_loops_detected" in resp_loops.json()

def test_bpi_overview_endpoint():
    """BPI 2019 enterprise dataset process mining metrics."""
    resp = client.get("/api/v1/bpi/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "IEEE BPI Challenge 2019" in data.get("source_dataset", "")
    assert data.get("analyzed_events", 0) > 100000

def test_recommendation_and_savings():
    """Recommendation cards and parameterized ROI calculator."""
    recs = client.get("/api/v1/recommendations").json()
    assert len(recs) >= 3
    assert recs[0]["recommendation_id"] == "REC-001"

    calc_resp = client.post(
        "/api/v1/recommendations/calculate-savings",
        json={"monthly_volume": 400, "avoidable_minutes_per_request": 45.0, "avoided_returns_share": 0.60}
    )
    assert calc_resp.status_code == 200
    calc_data = calc_resp.json()
    assert "base" in calc_data
    assert calc_data["base"]["hours_saved_per_month"] > 0

def test_export_test_predictions():
    """AC-08: Export test-set predictions matches required schema."""
    resp = client.get("/api/v1/export/test-predictions")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/csv; charset=utf-8"
    assert "request_id,return_risk_score,return_risk_band" in resp.text
