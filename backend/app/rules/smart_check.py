"""
smart_check.py - Deterministic Submission Validation Engine
Implements Section 9 of Emirates P2P Intelligence Architecture Blueprint.
Evaluates rules P2P-REQ-001 through P2P-REQ-008 against candidate requests.
"""
import os
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List
from backend.app.schemas.dto import ValidationFinding, ValidationResult
from backend.app.core.config import settings

POSITIONS_PATH = os.path.join(settings.DATA_PATH, "org_positions.csv")

class SmartCheckEngine:
    def __init__(self):
        self._load_positions()
        
    def _load_positions(self):
        if os.path.exists(POSITIONS_PATH):
            self.df_positions = pd.read_csv(POSITIONS_PATH)
            self.positions_by_id = {
                str(row["position_id"]): row.to_dict()
                for _, row in self.df_positions.iterrows()
            }
        else:
            self.df_positions = pd.DataFrame()
            self.positions_by_id = {}

    def get_position(self, pos_id: str) -> Dict[str, Any]:
        return self.positions_by_id.get(pos_id)

    def validate_request(self, payload: Dict[str, Any]) -> ValidationResult:
        findings: List[ValidationFinding] = []
        
        pos_id = (payload.get("destination_position_id") or "").strip()
        pos = self.get_position(pos_id)
        
        # Rule P2P-REQ-001: Destination Position Existence & Active Status
        if not pos:
            findings.append(ValidationFinding(
                rule_id="P2P-REQ-001",
                severity="error",
                field_name="destination_position_id",
                message=f"Destination position '{pos_id}' does not exist in the organizational directory.",
                correction_hint="Select an active position from the verified organizational position catalog.",
                evidence=f"Queried catalog with key '{pos_id}' - 0 matches found."
            ))
        elif not bool(pos.get("active_flag", True)):
            findings.append(ValidationFinding(
                rule_id="P2P-REQ-001",
                severity="error",
                field_name="destination_position_id",
                message=f"Position '{pos_id}' ({pos.get('job_title')}) has been frozen or inactivated.",
                correction_hint="Choose an active organizational position or request reactivation from HR Org Management.",
                evidence=f"Position status active_flag=False."
            ))
        else:
            # Rule P2P-REQ-002: FTE Vacancy & Over-allocation Check
            current_filled = float(pos.get("current_fte_filled", 0.0))
            capacity = float(pos.get("fte_capacity", 1.0))
            if current_filled >= capacity:
                findings.append(ValidationFinding(
                    rule_id="P2P-REQ-002",
                    severity="error",
                    field_name="destination_position_id",
                    message=f"Position '{pos_id}' has 0.0 vacant FTE capacity (Capacity: {capacity}, Filled: {current_filled}).",
                    correction_hint="Select a vacant position or initiate a position vacancy request.",
                    evidence=f"Position allocation check: filled={current_filled} >= capacity={capacity}."
                ))
                
        # Rule P2P-REQ-003: Grade Progression Consistency Check
        curr_grade_str = (payload.get("current_grade") or "EK-06").strip().replace("EK-", "")
        target_grade_str = (payload.get("target_grade") or "EK-06").strip().replace("EK-", "")
        try:
            curr_grade_num = int(curr_grade_str)
            target_grade_num = int(target_grade_str)
            grade_jump = target_grade_num - curr_grade_num
            if grade_jump > 1:
                findings.append(ValidationFinding(
                    rule_id="P2P-REQ-003",
                    severity="error",
                    field_name="target_grade",
                    message=f"Grade jump from EK-{curr_grade_num:02d} to EK-{target_grade_num:02d} (+{grade_jump} levels) exceeds maximum allowed +1 step limit.",
                    correction_hint="Align target grade to maximum +1 step above current grade, or attach Senior VP HR waiver.",
                    evidence=f"Grade differential calculation: {target_grade_num} - {curr_grade_num} = +{grade_jump} (Limit: 1)."
                ))
        except ValueError:
            pass

        # Rule P2P-REQ-004: Department & Cost Center Reconciliation
        dept = (payload.get("department") or "").strip()
        cost_center = (payload.get("cost_center") or "").strip()
        if pos:
            expected_cc = pos.get("cost_center")
            if cost_center and expected_cc and cost_center != expected_cc:
                findings.append(ValidationFinding(
                    rule_id="P2P-REQ-004",
                    severity="error",
                    field_name="cost_center",
                    message=f"Selected Cost Center '{cost_center}' does not match department ledger '{dept}' (Expected: '{expected_cc}').",
                    correction_hint=f"Update cost center to match verified departmental code '{expected_cc}'.",
                    evidence=f"Provided CC '{cost_center}' != Department catalog CC '{expected_cc}'."
                ))

        # Rule P2P-REQ-005: Effective Date Operational Lead Time Check
        eff_date_str = (payload.get("effective_date") or "").strip()
        if eff_date_str:
            try:
                eff_date = datetime.strptime(eff_date_str[:10], "%Y-%m-%d").date()
                today = datetime.utcnow().date()
                lead_days = (eff_date - today).days
                if lead_days < 14:
                    findings.append(ValidationFinding(
                        rule_id="P2P-REQ-005",
                        severity="warning",
                        field_name="effective_date",
                        message=f"Effective date lead time is only {lead_days} days (< 14 calendar days target).",
                        correction_hint="Consider selecting an effective date >= 14 days ahead to allow roster/payroll cycle alignment.",
                        evidence=f"Calculated lead time {lead_days} days against minimum target 14 days."
                    ))
            except Exception:
                pass

        # Rule P2P-REQ-006: Safety-Critical & Airside Clearance Check
        is_safety = False
        if pos:
            is_safety = bool(pos.get("is_safety_critical", False))
        elif dept in ["Flight Operations", "In-flight Services", "Engineering & Maintenance", "Airport Operations"]:
            is_safety = True
            
        clearance_ref = (payload.get("clearance_reference") or "").strip()
        if is_safety and (not clearance_ref or len(clearance_ref) < 4):
            findings.append(ValidationFinding(
                rule_id="P2P-REQ-006",
                severity="error",
                field_name="clearance_reference",
                message=f"Aviation safety-critical position in '{dept}' requires confirmed security/medical clearance reference.",
                correction_hint="Enter verified clearance reference number (e.g. GCAA-MED-XXXX or AVSEC-CLR-XXXX).",
                evidence=f"Department '{dept}' is designated aviation safety-critical; clearance_reference missing or incomplete."
            ))

        # Rule P2P-REQ-007: Inter-Departmental Release Endorsement Check
        if payload.get("request_type") in ["Transfer", "Position-to-Person Assignment"] and pos:
            if pos.get("department") != dept:
                findings.append(ValidationFinding(
                    rule_id="P2P-REQ-007",
                    severity="warning",
                    field_name="department",
                    message="Inter-departmental transfer requires releasing Department Head endorsement.",
                    correction_hint="Ensure releasing department manager has provided written release acknowledgement.",
                    evidence=f"Transfer from '{dept}' to '{pos.get('department')}' involves cross-departmental movement."
                ))

        # Rule P2P-REQ-008: Circular Reporting & Conflict of Interest Check
        rep_pos_id = (payload.get("reporting_position_id") or "").strip()
        if rep_pos_id and pos_id and rep_pos_id == pos_id:
            findings.append(ValidationFinding(
                rule_id="P2P-REQ-008",
                severity="error",
                field_name="reporting_position_id",
                message="Destination position cannot report to itself (circular hierarchy detected).",
                correction_hint="Specify a distinct supervisory position ID for reporting line hierarchy.",
                evidence=f"Reporting position '{rep_pos_id}' == Destination position '{pos_id}'."
            ))

        errors = [f for f in findings if f.severity == "error"]
        warnings = [f for f in findings if f.severity == "warning"]
        
        return ValidationResult(
            valid=len(errors) == 0,
            has_blocking_errors=len(errors) > 0,
            error_count=len(errors),
            warning_count=len(warnings),
            findings=findings,
            checked_at=datetime.utcnow().isoformat()
        )

smart_check_engine = SmartCheckEngine()
