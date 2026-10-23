"""
test_smart_check.py - Automated Unit Tests for SmartCheck Validation Engine
Verifies deterministic execution of rules P2P-REQ-001 through P2P-REQ-008.
"""
import pytest
from backend.app.rules.smart_check import smart_check_engine

def test_rule_p2p_req_001_invalid_position():
    """AC-01: Destination position must exist."""
    payload = {
        "destination_position_id": "POS-INVALID-9999",
        "current_grade": "EK-06",
        "target_grade": "EK-06",
        "department": "Flight Operations",
        "cost_center": "CC-100401",
        "effective_date": "2026-12-01"
    }
    result = smart_check_engine.validate_request(payload)
    assert not result.valid
    assert result.has_blocking_errors
    findings = [f for f in result.findings if f.rule_id == "P2P-REQ-001"]
    assert len(findings) == 1
    assert findings[0].severity == "error"
    assert "does not exist" in findings[0].message

def test_rule_p2p_req_003_grade_jump_exceeded():
    """Grade jump exceeding +1 step must be blocked."""
    # Find any active position
    pos_id = list(smart_check_engine.positions_by_id.keys())[0]
    pos = smart_check_engine.get_position(pos_id)
    
    payload = {
        "destination_position_id": pos_id,
        "current_grade": "EK-05",
        "target_grade": "EK-09",  # Jump of +4
        "department": pos["department"],
        "cost_center": pos["cost_center"],
        "effective_date": "2026-12-01",
        "clearance_reference": "GCAA-MED-8841"
    }
    result = smart_check_engine.validate_request(payload)
    assert not result.valid
    findings = [f for f in result.findings if f.rule_id == "P2P-REQ-003"]
    assert len(findings) == 1
    assert findings[0].severity == "error"
    assert "exceeds maximum allowed +1 step limit" in findings[0].message

def test_rule_p2p_req_004_cost_center_mismatch():
    """Cost center mismatch with department must be blocked."""
    pos_id = list(smart_check_engine.positions_by_id.keys())[0]
    pos = smart_check_engine.get_position(pos_id)
    
    payload = {
        "destination_position_id": pos_id,
        "current_grade": pos["grade"],
        "target_grade": pos["grade"],
        "department": pos["department"],
        "cost_center": "CC-999999-WRONG",
        "effective_date": "2026-12-01",
        "clearance_reference": "GCAA-MED-8841"
    }
    result = smart_check_engine.validate_request(payload)
    assert not result.valid
    findings = [f for f in result.findings if f.rule_id == "P2P-REQ-004"]
    assert len(findings) == 1
    assert "does not match department ledger" in findings[0].message

def test_rule_p2p_req_006_safety_critical_clearance_missing():
    """Safety-critical positions require security/medical clearance."""
    # Find a safety-critical position
    safety_pos = None
    for p_id, p_data in smart_check_engine.positions_by_id.items():
        if p_data.get("is_safety_critical"):
            safety_pos = p_data
            break
            
    assert safety_pos is not None
    payload = {
        "destination_position_id": safety_pos["position_id"],
        "current_grade": safety_pos["grade"],
        "target_grade": safety_pos["grade"],
        "department": safety_pos["department"],
        "cost_center": safety_pos["cost_center"],
        "effective_date": "2026-12-01",
        "clearance_reference": ""  # Missing!
    }
    result = smart_check_engine.validate_request(payload)
    assert not result.valid
    findings = [f for f in result.findings if f.rule_id == "P2P-REQ-006"]
    assert len(findings) == 1
    assert "requires confirmed security/medical clearance" in findings[0].message

def test_valid_request_passes():
    """AC-02: Valid request passes all blocking checks."""
    # Find a vacant, active position
    target_pos = None
    for p_id, p_data in smart_check_engine.positions_by_id.items():
        if p_data.get("active_flag") and p_data.get("current_fte_filled", 1.0) < p_data.get("fte_capacity", 1.0):
            target_pos = p_data
            break
            
    assert target_pos is not None
    payload = {
        "destination_position_id": target_pos["position_id"],
        "current_grade": target_pos["grade"],
        "target_grade": target_pos["grade"],
        "department": target_pos["department"],
        "cost_center": target_pos["cost_center"],
        "effective_date": "2026-12-01",
        "clearance_reference": "AVSEC-CLR-9901"
    }
    result = smart_check_engine.validate_request(payload)
    assert result.valid
    assert not result.has_blocking_errors
    assert result.error_count == 0
