"""
generate_data.py - Emirates P2P Intelligence Synthetic Data Generator
Generates realistic, schema-validated synthetic datasets for Position-to-Person (P2P) workflows.
Conforms strictly to Emirates P2P Intelligence Architecture Blueprint.
"""
import os
import json
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Set seed for exact reproducibility
np.random.seed(42)
random.seed(42)

WORKSPACE_DIR = r"c:\Users\Victus\OneDrive\Desktop\Right First Time Smart Position To Person Requests Challenge"
DATA_DIR = os.path.join(WORKSPACE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. GENERATE ORGANIZATIONAL POSITIONS (org_positions.csv)
DEPARTMENTS = {
    "Flight Operations": {"code": "FLT", "cc": "CC-100401", "safety_critical": True},
    "In-flight Services": {"code": "IFS", "cc": "CC-100402", "safety_critical": True},
    "Engineering & Maintenance": {"code": "ENG", "cc": "CC-100403", "safety_critical": True},
    "Airport Operations": {"code": "APO", "cc": "CC-100404", "safety_critical": True},
    "Commercial & Revenue": {"code": "COM", "cc": "CC-100405", "safety_critical": False},
    "Group IT": {"code": "GIT", "cc": "CC-100406", "safety_critical": False},
    "Human Resources": {"code": "HRG", "cc": "CC-100407", "safety_critical": False},
}

JOB_TITLES = {
    "Flight Operations": [
        ("Captain B777", "EK-11"), ("First Officer A380", "EK-09"),
        ("Fleet Technical Pilot", "EK-10"), ("Flight Dispatch Specialist", "EK-07"),
        ("Crew Operations Controller", "EK-06"), ("Flight Ops Duty Manager", "EK-09")
    ],
    "In-flight Services": [
        ("Cabin Service Director", "EK-08"), ("Purser B777/A380", "EK-07"),
        ("Senior Flight Steward", "EK-06"), ("Cabin Crew Line Trainer", "EK-07"),
        ("In-flight Catering Specialist", "EK-05")
    ],
    "Engineering & Maintenance": [
        ("Licensed Aircraft Engineer - Avionics", "EK-08"), ("Airframe Maintenance Specialist", "EK-07"),
        ("Base Maintenance Superintendent", "EK-10"), ("Aviation Quality Assurance Auditor", "EK-08"),
        ("Engineering Technical Records Officer", "EK-05")
    ],
    "Airport Operations": [
        ("Terminal Duty Officer", "EK-07"), ("Ramp Safety Inspector", "EK-06"),
        ("Baggage Operations Coordinator", "EK-05"), ("Hub Control Center Controller", "EK-08"),
        ("Passenger Service Lead", "EK-06")
    ],
    "Commercial & Revenue": [
        ("Route Revenue Analyst", "EK-06"), ("Senior Yield Optimization Manager", "EK-10"),
        ("Commercial Pricing Specialist", "EK-07"), ("Regional Cargo Sales Executive", "EK-07")
    ],
    "Group IT": [
        ("Principal Solutions Architect", "EK-11"), ("Senior Full-Stack Engineer", "EK-08"),
        ("Cybersecurity Operations Analyst", "EK-07"), ("Cloud Infrastructure Specialist", "EK-08"),
        ("Data & AI Research Engineer", "EK-09"), ("DevOps Automation Lead", "EK-09")
    ],
    "Human Resources": [
        ("HR Business Partner - Operations", "EK-08"), ("Talent Acquisition Specialist", "EK-06"),
        ("Employee Relations Specialist", "EK-07"), ("Process Mining & Analytics Lead", "EK-09")
    ]
}

positions = []
pos_counter = 1000

for dept, info in DEPARTMENTS.items():
    titles = JOB_TITLES[dept]
    for title, default_grade in titles:
        # Create 2-3 positions per title
        for _ in range(random.randint(2, 4)):
            pos_id = f"POS-{info['code']}-{pos_counter}"
            pos_counter += 1
            # 65% filled, 35% vacant
            is_filled = random.random() < 0.65
            is_active = random.random() < 0.95  # 5% inactive
            
            positions.append({
                "position_id": pos_id,
                "job_title": title,
                "grade": default_grade,
                "department": dept,
                "cost_center": info["cc"],
                "reporting_position_id": f"POS-{info['code']}-MGR-01",
                "fte_capacity": 1.0,
                "current_fte_filled": 1.0 if is_filled else 0.0,
                "active_flag": is_active,
                "is_safety_critical": info["safety_critical"]
            })

df_positions = pd.DataFrame(positions)
df_positions.to_csv(os.path.join(DATA_DIR, "org_positions.csv"), index=False)
print(f"Generated {len(df_positions)} positions in org_positions.csv")

# 2. GENERATE VALIDATION RULES CATALOGUE (validation_rules.json)
rules = [
    {
        "rule_id": "P2P-REQ-001",
        "version": "1.0",
        "name": "Destination Position Existence & Active Check",
        "severity": "error",
        "request_types": ["All"],
        "description": "Destination position ID must exist in the active organizational structure.",
        "correction_hint": "Select an existing, active position from the organizational directory."
    },
    {
        "rule_id": "P2P-REQ-002",
        "version": "1.0",
        "name": "FTE Vacancy & Over-allocation Check",
        "severity": "error",
        "request_types": ["Position-to-Person Assignment", "Transfer", "Promotion", "New Joiner Assignment"],
        "description": "Destination position must have available FTE capacity (< 1.0 currently filled).",
        "correction_hint": "Choose an unallocated/vacant position or initiate a position vacancy request first."
    },
    {
        "rule_id": "P2P-REQ-003",
        "version": "1.0",
        "name": "Grade Progression Consistency Check",
        "severity": "error",
        "request_types": ["Promotion", "Transfer", "Position-to-Person Assignment"],
        "description": "Candidate current grade cannot jump more than +1 grade level without Executive HR VP waiver.",
        "correction_hint": "Align target grade to maximum +1 step above current grade or attach Senior VP HR waiver."
    },
    {
        "rule_id": "P2P-REQ-004",
        "version": "1.0",
        "name": "Department & Cost Center Reconciliation",
        "severity": "error",
        "request_types": ["All"],
        "description": "Selected Cost Center must match the destination department's approved financial code.",
        "correction_hint": "Select the verified departmental cost center from the authorized ledger."
    },
    {
        "rule_id": "P2P-REQ-005",
        "version": "1.0",
        "name": "Effective Date Operational Lead Time Check",
        "severity": "warning",
        "request_types": ["All"],
        "description": "Target effective date is less than 14 calendar days from submission.",
        "correction_hint": "Consider setting the effective date >= 14 days ahead to allow roster/payroll cycle alignment."
    },
    {
        "rule_id": "P2P-REQ-006",
        "version": "1.0",
        "name": "Safety-Critical & Airside Clearance Check",
        "severity": "error",
        "request_types": ["All"],
        "description": "Flight Ops, Engineering, and Airport Ops positions require confirmed airside/medical clearance.",
        "correction_hint": "Attach valid GCAA / Emirates Aviation Security and Medical clearance reference number."
    },
    {
        "rule_id": "P2P-REQ-007",
        "version": "1.0",
        "name": "Inter-Departmental Release Endorsement Check",
        "severity": "warning",
        "request_types": ["Transfer", "Position-to-Person Assignment"],
        "description": "Transfer across different business divisions requires releasing manager notification.",
        "correction_hint": "Confirm that the current department head has provided formal release endorsement."
    },
    {
        "rule_id": "P2P-REQ-008",
        "version": "1.0",
        "name": "Circular Reporting & Conflict of Interest Check",
        "severity": "error",
        "request_types": ["All"],
        "description": "Reporting position cannot report to itself or create a direct reporting circular loop.",
        "correction_hint": "Specify a distinct supervisory position ID for reporting line hierarchy."
    }
]

with open(os.path.join(DATA_DIR, "validation_rules.json"), "w", encoding="utf-8") as f:
    json.dump(rules, f, indent=2)
print("Saved validation_rules.json")

# 3. GENERATE HISTORICAL P2P REQUESTS & EVENT LOGS (requests.csv and p2p_event_log.csv)
REQUEST_TYPES = [
    "Position-to-Person Assignment",
    "Transfer",
    "Promotion",
    "New Joiner Assignment",
    "Position Reclassification",
    "Secondment"
]

STAGES = [
    ("Draft", "Manager"),
    ("Submitted", "Manager"),
    ("Line Manager Review", "Line Manager"),
    ("Finance Cost Center Review", "Finance Team"),
    ("HR Ops Validation", "HR Operations"),
    ("Department Head Approval", "Dept Head"),
    ("System Processing", "HR Systems"),
    ("Completed", "System")
]

RETURN_REASONS = [
    "Cost center / budget mismatch with finance ledger",
    "Missing mandatory airside security / medical clearance",
    "Grade step jump exceeds +1 level without VP waiver",
    "Incomplete business case justification",
    "Destination position already occupied (0.0 FTE vacant)",
    "Target effective date is in the past or conflicts with roster period"
]

all_requests = []
all_events = []
event_counter = 100000

base_date = datetime(2025, 1, 1)

for req_idx in range(1, 1201):
    req_id = f"P2P-2025-{req_idx:05d}"
    req_type = random.choice(REQUEST_TYPES)
    dept_name = random.choice(list(DEPARTMENTS.keys()))
    dept_info = DEPARTMENTS[dept_name]
    
    # Pick target position
    matching_positions = [p for p in positions if p["department"] == dept_name]
    target_pos = random.choice(matching_positions)
    
    # Current grade vs target grade
    target_grade_num = int(target_pos["grade"].replace("EK-", ""))
    grade_jump = random.choice([0, 1, 1, 2, 0])
    current_grade_num = max(4, target_grade_num - grade_jump)
    current_grade = f"EK-{current_grade_num:02d}"
    
    lead_time_days = random.randint(5, 45)
    submit_date = base_date + timedelta(days=random.randint(0, 320), hours=random.randint(8, 17))
    effective_date = submit_date + timedelta(days=lead_time_days)
    
    # Determine initial validation flags
    has_initial_error = (grade_jump > 1 and random.random() < 0.4) or (target_pos["current_fte_filled"] > 0 and random.random() < 0.3)
    has_initial_warning = lead_time_days < 14
    
    # Target SLA is 5 days
    target_sla_days = 5.0
    
    # Decide if request gets returned during workflow
    return_prob = 0.08
    if has_initial_warning: return_prob += 0.15
    if grade_jump > 1: return_prob += 0.25
    if dept_info["safety_critical"]: return_prob += 0.10
    if target_pos["current_fte_filled"] > 0: return_prob += 0.30
    
    was_returned = random.random() < min(0.75, return_prob)
    return_count = random.randint(1, 2) if was_returned else 0
    
    # Decide if request is delayed
    delay_prob = 0.15
    if was_returned: delay_prob += 0.50
    if dept_name in ["Flight Operations", "Engineering & Maintenance"]: delay_prob += 0.15
    if grade_jump > 1: delay_prob += 0.15
    is_delayed = random.random() < min(0.85, delay_prob)
    
    # Request lifecycle events
    curr_time = submit_date
    
    is_in_flight = req_idx > 1100
    if is_in_flight:
        max_stage_idx = random.randint(1, 5)
    else:
        max_stage_idx = len(STAGES) - 1
        
    for s_idx in range(max_stage_idx + 1):
        stage_name, actor_role = STAGES[s_idx]
        event_counter += 1
        
        # Duration for this stage
        if stage_name in ["Draft", "Submitted"]:
            dur_hours = random.uniform(0.1, 1.5)
        elif stage_name == "Line Manager Review":
            dur_hours = random.uniform(4.0, 36.0)
        elif stage_name == "Finance Cost Center Review":
            dur_hours = random.uniform(8.0, 52.0)
        elif stage_name == "HR Ops Validation":
            dur_hours = random.uniform(12.0, 72.0)
        elif stage_name == "Department Head Approval":
            dur_hours = random.uniform(6.0, 48.0)
        elif stage_name == "System Processing":
            dur_hours = random.uniform(1.0, 14.0)
        else:
            dur_hours = 0.0
            
        if is_delayed and s_idx in [3, 4, 5]:
            dur_hours *= random.uniform(1.8, 3.5)
            
        stage_start = curr_time
        curr_time = stage_start + timedelta(hours=dur_hours)
        
        outcome = "APPROVED" if s_idx < max_stage_idx else ("COMPLETED" if not is_in_flight else "IN_PROGRESS")
        reason_code = None
        
        all_events.append({
            "event_id": f"EVT-{event_counter}",
            "request_id": req_id,
            "stage": stage_name,
            "actor_role": actor_role,
            "team": dept_name,
            "timestamp": curr_time.isoformat(),
            "duration_hours": round(dur_hours, 2),
            "outcome": outcome,
            "reason_code": reason_code
        })
        
        # Simulate Return Loop if was_returned and at HR Ops stage
        if was_returned and stage_name == "HR Ops Validation" and not is_in_flight:
            return_reason = random.choice(RETURN_REASONS)
            event_counter += 1
            all_events.append({
                "event_id": f"EVT-{event_counter}",
                "request_id": req_id,
                "stage": "Returned for Correction",
                "actor_role": "HR Operations Specialist",
                "team": "HR Operations",
                "timestamp": (curr_time + timedelta(hours=1)).isoformat(),
                "duration_hours": 1.0,
                "outcome": "RETURNED",
                "reason_code": return_reason
            })
            rework_hours = random.uniform(24.0, 72.0)
            curr_time += timedelta(hours=rework_hours)
            event_counter += 1
            all_events.append({
                "event_id": f"EVT-{event_counter}",
                "request_id": req_id,
                "stage": "Resubmitted After Rework",
                "actor_role": "Line Manager",
                "team": dept_name,
                "timestamp": curr_time.isoformat(),
                "duration_hours": round(rework_hours, 2),
                "outcome": "RESUBMITTED",
                "reason_code": "Corrections addressed"
            })
    
    total_elapsed_days = round((curr_time - submit_date).total_seconds() / 86400.0, 2)
    if is_in_flight:
        current_state = STAGES[max_stage_idx][0]
        current_owner = STAGES[max_stage_idx][1]
    else:
        current_state = "Completed"
        current_owner = "Workflow Completed"
        
    all_requests.append({
        "request_id": req_id,
        "request_type": req_type,
        "submitter_role": "Line Manager",
        "candidate_id": f"EMP-EK-{random.randint(50000, 99999)}",
        "current_grade": current_grade,
        "target_grade": target_pos["grade"],
        "grade_jump": grade_jump,
        "destination_position_id": target_pos["position_id"],
        "department": dept_name,
        "cost_center": target_pos["cost_center"],
        "is_safety_critical": int(dept_info["safety_critical"]),
        "lead_time_days": lead_time_days,
        "submitted_at": submit_date.isoformat(),
        "effective_date": effective_date.strftime("%Y-%m-%d"),
        "current_state": current_state,
        "current_owner": current_owner,
        "target_sla_days": target_sla_days,
        "total_elapsed_days": total_elapsed_days,
        "is_delayed": int(total_elapsed_days > target_sla_days),
        "was_returned": int(was_returned),
        "return_count": return_count,
        "initial_error_count": int(has_initial_error),
        "initial_warning_count": int(has_initial_warning),
        "is_in_flight": int(is_in_flight)
    })

df_reqs = pd.DataFrame(all_requests)
df_events = pd.DataFrame(all_events)

df_reqs.to_csv(os.path.join(DATA_DIR, "requests.csv"), index=False)
df_events.to_csv(os.path.join(DATA_DIR, "p2p_event_log.csv"), index=False)

print(f"Generated {len(df_reqs)} requests in requests.csv")
print(f"Generated {len(df_events)} events in p2p_event_log.csv")
print("Return rate:", df_reqs["was_returned"].mean())
print("Delay rate:", df_reqs["is_delayed"].mean())
