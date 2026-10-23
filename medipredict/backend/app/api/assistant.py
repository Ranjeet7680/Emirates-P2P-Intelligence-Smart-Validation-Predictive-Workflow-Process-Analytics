from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.entities import User, AuditLog
from ..schemas.dto import AssistantQueryDTO, AssistantResponseDTO
from ..services.ai_provider import ai_service
from .auth import get_current_user

router = APIRouter(prefix="/assistant", tags=["AI Medical Assistant"])

@router.post("/chat", response_model=AssistantResponseDTO)
async def chat_with_assistant(
    query: AssistantQueryDTO,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    response = await ai_service.generate_response(query.message, query.conversation_history)

    # Record audit trail of AI interaction
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="ASSISTANT_QUERY",
        resource_type="AIInteraction",
        details={
            "query_length": len(query.message),
            "is_emergency": response.is_emergency,
            "citations_count": len(response.citations),
            "uncertainty": response.uncertainty_level
        }
    )
    db.add(audit)
    db.commit()

    return response

@router.get("/topics")
def get_suggested_topics():
    return {
        "topics": [
            {
                "category": "Metabolic & Diabetes",
                "prompts": [
                    "What is the difference between Fasting Glucose and HbA1c?",
                    "How do SGLT2 inhibitors provide renal and cardiovascular protection?",
                    "What lifestyle modifications reverse impaired fasting glucose?"
                ]
            },
            {
                "category": "Cardiovascular Health",
                "prompts": [
                    "What are the target LDL cholesterol levels for high-risk patients?",
                    "How does high-sensitivity troponin indicate myocardial injury?",
                    "What does a Coronary Artery Calcium (CAC) score mean?"
                ]
            },
            {
                "category": "Genetics & Inherited Conditions",
                "prompts": [
                    "What are the ACMG guidelines for BRCA1 pathogenic variant carriers?",
                    "Explain the difference between Autosomal Dominant and Recessive inheritance.",
                    "What role does the APOE epsilon-4 allele play in disease susceptibility?"
                ]
            },
            {
                "category": "Kidney & Electrolytes",
                "prompts": [
                    "How is eGFR calculated using the CKD-EPI formula?",
                    "What causes elevated urine albumin-to-creatinine ratio (uACR)?",
                    "Why must serum creatinine be interpreted with muscle mass and age?"
                ]
            }
        ]
    }
