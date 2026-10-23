import re
from typing import Dict, Any, List
from ..schemas.dto import EmergencyGuidanceDTO
from ..core.config import settings

EMERGENCY_PATTERNS = [
    r"\b(crushing\s+)?chest\s+pain\b",
    r"\bpressure\s+in\s+chest\b",
    r"\bpain\s+radiating\s+to\s+(left\s+)?arm\b",
    r"\bshortness\s+of\s+breath\b",
    r"\bcan'?t\s+breathe\b",
    r"\bdifficulty\s+breathing\b",
    r"\bsudden\s+numbness\b",
    r"\bsudden\s+weakness\b",
    r"\bfacial\s+droop(ing)?\b",
    r"\bslurred\s+speech\b",
    r"\bworst\s+headache\s+of\s+(my\s+)?life\b",
    r"\bthunderclap\s+headache\b",
    r"\bthroat\s+closing\b",
    r"\banaphylaxis\b",
    r"\bcoughing\s+up\s+blood\b",
    r"\bsuicid(e|al)\b",
    r"\boverdose\b"
]

MEDICAL_DISCLAIMER = (
    "MediPredict AI is an educational and clinical decision-support tool. "
    "It does not provide definitive medical diagnoses, prescriptions, or replace "
    "the clinical evaluation of a licensed physician or healthcare provider. "
    "If you are experiencing severe, worsening, or acute symptoms, seek immediate emergency medical care."
)

class MedicalSafetyEngine:
    @staticmethod
    def evaluate_input_safety(text: str) -> EmergencyGuidanceDTO:
        text_lower = text.lower()
        matched_triggers: List[str] = []

        for pattern in EMERGENCY_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                matched_triggers.append(match.group(0))

        if matched_triggers:
            return EmergencyGuidanceDTO(
                is_emergency=True,
                trigger_words=matched_triggers,
                alert_level="CRITICAL_EMERGENCY",
                guidance_message=(
                    "CRITICAL MEDICAL ALERT: Your query contains keywords indicating a potential medical emergency "
                    f"({', '.join(matched_triggers)}). Please immediately call emergency services or go to the nearest emergency department."
                ),
                hotlines=settings.EMERGENCY_HOTLINES,
                recommendation="Do not wait for an online explanation. Immediately dial emergency services (911 / 999 / 112) or seek in-person clinical emergency evaluation."
            )

        return EmergencyGuidanceDTO(
            is_emergency=False,
            trigger_words=[],
            alert_level="NONE",
            guidance_message=None,
            hotlines={},
            recommendation=None
        )

    @staticmethod
    def format_safe_response(answer: str, is_emergency: bool = False) -> str:
        if is_emergency:
            warning_prefix = (
                "⚠️ **URGENT EMERGENCY ADVISORY:**\n"
                "Your inquiry describes acute symptoms that require immediate clinical intervention. "
                "Contact emergency services immediately (911 / 999 / 112).\n\n---\n\n"
            )
            return warning_prefix + answer
        return answer

    @staticmethod
    def get_standard_disclaimer() -> str:
        return MEDICAL_DISCLAIMER
