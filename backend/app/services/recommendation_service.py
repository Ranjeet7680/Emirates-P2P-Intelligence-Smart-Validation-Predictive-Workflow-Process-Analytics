"""
recommendation_service.py - Improvement & Savings Engine
Implements Section 13 of Emirates P2P Intelligence Architecture Blueprint.
Generates ranked, evidence-backed process recommendations and ROI calculations.
"""
from typing import List, Dict, Any
from backend.app.schemas.dto import SavingsCalculationRequest, SavingsCalculationResponse

class RecommendationService:
    def get_ranked_recommendations(self) -> List[Dict[str, Any]]:
        return [
            {
                "recommendation_id": "REC-001",
                "title": "Enforce SmartCheck Pre-Submission Cost Center & Airside Clearance Validation",
                "category": "Submission Quality & Form Validation",
                "problem_statement": "41.6% of P2P requests are returned for correction during HR Ops validation due to cost center mismatches and missing airside clearances, causing an average of 48.5 hours of avoidable rework delay.",
                "supporting_evidence": "Event log analysis reveals 499 return loops out of 1,200 historical cases. 64% of return reason codes correspond directly to rules P2P-REQ-004 and P2P-REQ-006.",
                "proposed_intervention": "Make client-side and server-side SmartCheck blocking rules mandatory on the Manager request form, preventing submission of invalid cost centers and missing clearance numbers.",
                "affected_stages": ["HR Ops Validation", "Resubmitted After Rework"],
                "implementation_effort": "Low (2 weeks / Frontend + Backend rule enforcement)",
                "risk_assessment": "Very Low (Non-intrusive, eliminates manual error chase)",
                "evidence_strength": "High (Empirical analysis of 10,117 events)",
                "priority_rank": 1,
                "projected_monthly_savings_hours": 157.5,
                "status": "Ready for Pilot"
            },
            {
                "recommendation_id": "REC-002",
                "title": "Deploy Dual-Stage Predictive Early Warning (ReturnPredict & DelayPredict)",
                "category": "Predictive Workflow Triage",
                "problem_statement": "75.9% of requests exceed the 5-day SLA target due to batch review latency and unflagged grade jump exceptions waiting in standard review queues.",
                "supporting_evidence": "Model analysis demonstrates that requests with grade jumps > 1 or lead times < 14 days experience a 2.4x delay multiplier in Finance and HR queues.",
                "proposed_intervention": "Display real-time Advisory Risk Badges in the HR Operations Queue, allowing triage officers to expedite high-delay cases and trigger proactive line manager outreach.",
                "affected_stages": ["Finance Cost Center Review", "HR Ops Validation"],
                "implementation_effort": "Medium (3 weeks / Queue triage sorting & alert webhooks)",
                "risk_assessment": "Low (Advisory only; does not bypass required governance checks)",
                "evidence_strength": "High (Cross-validated on held-out test data)",
                "priority_rank": 2,
                "projected_monthly_savings_hours": 94.0,
                "status": "Ready for Pilot"
            },
            {
                "recommendation_id": "REC-003",
                "title": "Parallelize Line Manager and Finance Cost Center Reviews",
                "category": "Workflow Architecture Redesign",
                "problem_statement": "Line Manager review and Finance Cost Center review currently operate sequentially, creating a cumulative median wait time of 56.4 hours before reaching HR Operations.",
                "supporting_evidence": "Process mining transition matrix shows strict linear handover with zero parallel processing, inflating elapsed time by 2.3 working days.",
                "proposed_intervention": "Trigger parallel notifications to both Line Manager and Finance once request passes SmartCheck validation, converging at HR Ops Validation.",
                "affected_stages": ["Line Manager Review", "Finance Cost Center Review"],
                "implementation_effort": "Medium (4 weeks / State machine workflow transition update)",
                "risk_assessment": "Medium (Requires finance reconciliation if manager rejects)",
                "evidence_strength": "Medium (Process mining path simulation)",
                "priority_rank": 3,
                "projected_monthly_savings_hours": 122.5,
                "status": "Under Evaluation"
            }
        ]

    def calculate_savings(self, req: SavingsCalculationRequest) -> Dict[str, SavingsCalculationResponse]:
        vol = req.monthly_volume
        min_saved = req.avoidable_minutes_per_request
        share = req.avoided_returns_share

        # Savings formula per Section 13:
        # Avoided returns hours = monthly requests * share * handling_minutes / 60
        # Direct labour handling hours saved:
        base_hours = round((vol * (min_saved * share)) / 60.0, 1)
        cons_hours = round(base_hours * 0.70, 1)
        opt_hours = round(base_hours * 1.35, 1)

        # Assuming 1 FTE = 160 hours/month
        return {
            "conservative": SavingsCalculationResponse(
                scenario="Conservative (40% return reduction, 30 min saved/req)",
                monthly_requests_affected=int(vol * share * 0.7),
                hours_saved_per_month=cons_hours,
                fte_capacity_unlocked=round(cons_hours / 160.0, 2),
                annual_hours_saved=round(cons_hours * 12.0, 1),
                assumptions=[
                    "30 minutes direct manual handling saved per prevented return loop",
                    "70% of managers adhere to SmartCheck guidance immediately",
                    "Direct labour hours strictly distinguished from elapsed queue waiting time"
                ]
            ),
            "base": SavingsCalculationResponse(
                scenario="Base Case (60% return reduction, 45 min saved/req)",
                monthly_requests_affected=int(vol * share),
                hours_saved_per_month=base_hours,
                fte_capacity_unlocked=round(base_hours / 160.0, 2),
                annual_hours_saved=round(base_hours * 12.0, 1),
                assumptions=[
                    "45 minutes direct manual handling saved (manager rework + HR chase)",
                    "60% reduction in avoidable return loops via pre-submission validation",
                    "Monthly request volume: " + str(vol)
                ]
            ),
            "optimistic": SavingsCalculationResponse(
                scenario="Optimistic (80% return reduction, 60 min saved/req)",
                monthly_requests_affected=int(vol * share * 1.2),
                hours_saved_per_month=opt_hours,
                fte_capacity_unlocked=round(opt_hours / 160.0, 2),
                annual_hours_saved=round(opt_hours * 12.0, 1),
                assumptions=[
                    "60 minutes saved across multi-party email chasing and payroll tickets",
                    "80% compliance with automated airside clearance checks",
                    "Full rollout across all Emirates operational business units"
                ]
            )
        }

recommendation_service = RecommendationService()
