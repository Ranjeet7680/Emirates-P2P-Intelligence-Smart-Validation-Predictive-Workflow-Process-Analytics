"""
workflow_service.py - FlowTrack Workflow State Machine and Timeline Service
Implements Section 10 of Emirates P2P Intelligence Architecture Blueprint.
Enforces legal state transitions, auditable timelines, and append-only event records.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.entities import RequestModel, WorkflowEventModel, AuditEventModel
from backend.app.schemas.dto import TransitionRequestDTO, WorkflowEventDTO

ALLOWED_TRANSITIONS = {
    "Draft": ["Submitted", "Cancelled"],
    "Submitted": ["Line Manager Review", "Returned for Correction", "Cancelled"],
    "Line Manager Review": ["Finance Cost Center Review", "Returned for Correction", "Cancelled"],
    "Finance Cost Center Review": ["HR Ops Validation", "Returned for Correction", "Cancelled"],
    "HR Ops Validation": ["Department Head Approval", "Returned for Correction", "Cancelled"],
    "Department Head Approval": ["System Processing", "Returned for Correction", "Cancelled"],
    "System Processing": ["Completed", "Returned for Correction"],
    "Returned for Correction": ["Submitted", "Cancelled"],
    "Completed": [],  # Terminal state
    "Cancelled": []   # Terminal state
}

NEXT_ACTION_MAP = {
    "Draft": "Validate fields and submit request",
    "Submitted": "Awaiting initial intake review",
    "Line Manager Review": "Line manager endorsement of grade & vacancy",
    "Finance Cost Center Review": "Finance cost center ledger reconciliation",
    "HR Ops Validation": "HR specialist verification of policies & clearances",
    "Department Head Approval": "Department Head executive signoff",
    "System Processing": "Automated ERP & HR system profile update",
    "Returned for Correction": "Manager correction of flagged prerequisites",
    "Completed": "Request fulfilled. Workflow closed.",
    "Cancelled": "Request terminated."
}

OWNER_MAP = {
    "Draft": ("Line Manager", "Operations"),
    "Submitted": ("HR Intake Coordinator", "HR Operations"),
    "Line Manager Review": ("Line Manager", "Department Leadership"),
    "Finance Cost Center Review": ("Finance Officer", "Finance & Budgeting"),
    "HR Ops Validation": ("HR Operations Specialist", "HR Operations"),
    "Department Head Approval": ("Department Head", "Executive Leadership"),
    "System Processing": ("HR Systems Automation", "Group IT / HR Tech"),
    "Returned for Correction": ("Submitting Line Manager", "Operations"),
    "Completed": ("Workflow Completed", "System"),
    "Cancelled": ("Workflow Cancelled", "System")
}

class WorkflowService:
    def transition_state(
        self,
        db: Session,
        request_id: str,
        transition: TransitionRequestDTO
    ) -> RequestModel:
        req = db.query(RequestModel).filter(RequestModel.request_id == request_id).first()
        if not req:
            raise ValueError(f"Request {request_id} not found")

        current_state = req.current_state
        action = transition.action.upper()
        
        # Determine target state
        if action == "CANCEL":
            target_state = "Cancelled"
        elif action == "RETURN":
            if not transition.reason_code:
                raise ValueError("A return reason code is mandatory when returning a request for correction.")
            target_state = "Returned for Correction"
        elif action == "RESUBMIT":
            if current_state != "Returned for Correction":
                raise ValueError("Only returned requests can be resubmitted.")
            target_state = "Submitted"
        elif action == "APPROVE":
            # Progress to next sequential stage
            valid_targets = ALLOWED_TRANSITIONS.get(current_state, [])
            non_exceptional = [s for s in valid_targets if s not in ["Returned for Correction", "Cancelled"]]
            if not non_exceptional:
                raise ValueError(f"Cannot progress further from terminal state '{current_state}'.")
            target_state = non_exceptional[0]
        else:
            raise ValueError(f"Unsupported workflow action '{action}'.")

        # Validate transition is permitted
        if target_state not in ALLOWED_TRANSITIONS.get(current_state, []):
            raise ValueError(f"Illegal workflow transition from '{current_state}' to '{target_state}'.")

        now_str = datetime.utcnow().isoformat()
        
        # Create immutable workflow event
        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        event = WorkflowEventModel(
            event_id=event_id,
            request_id=request_id,
            stage=target_state,
            actor_role=transition.actor_role,
            team=transition.team,
            timestamp=now_str,
            duration_hours=1.0,
            outcome=action,
            reason_code=transition.reason_code or transition.comments
        )
        db.add(event)

        # Update Request entity
        req.current_state = target_state
        owner_role, owner_team = OWNER_MAP.get(target_state, ("Unassigned", "Operations"))
        req.current_owner_role = owner_role
        req.current_owner_team = owner_team
        req.next_action = NEXT_ACTION_MAP.get(target_state, "Review required")
        if action == "RETURN":
            req.was_returned = 1

        # Audit event
        audit = AuditEventModel(
            audit_id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
            actor=transition.actor_role,
            action=f"STATE_TRANSITION_{action}",
            object_type="REQUEST",
            object_id=request_id,
            timestamp=datetime.utcnow(),
            correlation_id=f"CORR-{uuid.uuid4().hex[:6]}",
            details_json=f"Transitioned from {current_state} to {target_state}. Reason: {transition.reason_code}"
        )
        db.add(audit)
        
        db.commit()
        db.refresh(req)
        return req

    def get_timeline(self, db: Session, request_id: str) -> List[WorkflowEventDTO]:
        events = db.query(WorkflowEventModel).filter(
            WorkflowEventModel.request_id == request_id
        ).order_by(WorkflowEventModel.timestamp.asc()).all()
        
        return [
            WorkflowEventDTO(
                event_id=e.event_id,
                request_id=e.request_id,
                stage=e.stage,
                actor_role=e.actor_role,
                team=e.team,
                timestamp=e.timestamp,
                duration_hours=e.duration_hours,
                outcome=e.outcome,
                reason_code=e.reason_code
            ) for e in events
        ]

workflow_service = WorkflowService()
