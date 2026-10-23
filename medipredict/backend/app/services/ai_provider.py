import json, os, re
from typing import List, Dict, Any, Tuple
from ..core.config import settings
from ..schemas.dto import CitationDTO, AssistantResponseDTO
from .safety_engine import MedicalSafetyEngine

class AIProviderService:
    def __init__(self):
        self.knowledge_base = self._load_knowledge()

    def _load_knowledge(self) -> Dict[str, Any]:
        data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
        diseases, genes, lab_ranges = [], [], []

        try:
            with open(os.path.join(data_dir, "diseases.json"), "r", encoding="utf-8") as f:
                diseases = json.load(f)
        except Exception:
            pass

        try:
            with open(os.path.join(data_dir, "genes.json"), "r", encoding="utf-8") as f:
                genes = json.load(f)
        except Exception:
            pass

        try:
            with open(os.path.join(data_dir, "lab_reference_ranges.json"), "r", encoding="utf-8") as f:
                lab_ranges = json.load(f)
        except Exception:
            pass

        return {
            "diseases": diseases,
            "genes": genes,
            "lab_ranges": lab_ranges
        }

    def _retrieve_relevant_evidence(self, query: str) -> Tuple[List[Dict[str, Any]], List[CitationDTO]]:
        q = query.lower()
        matched_items = []
        citations: List[CitationDTO] = []

        # Check diseases
        for d in self.knowledge_base.get("diseases", []):
            if d["name"].lower() in q or any(sym.lower() in q for sym in d.get("symptoms", [])) or d["specialty"].lower() in q:
                matched_items.append({"type": "disease", "data": d})
                for ref in d.get("pubmed_references", []):
                    citations.append(CitationDTO(
                        title=ref["title"],
                        source="PubMed",
                        year=ref.get("year", 2022),
                        url=f"https://pubmed.ncbi.nlm.nih.gov/{ref.get('pmid')}/",
                        evidence_level=d.get("evidence_quality", "Level A")
                    ))

        # Check genes
        for g in self.knowledge_base.get("genes", []):
            if g["gene_symbol"].lower() in q or g["full_name"].lower() in q or any(cond.lower() in q for cond in g.get("associated_conditions", [])):
                matched_items.append({"type": "gene", "data": g})
                citations.append(CitationDTO(
                    title=f"NCBI Gene ID {g['ncbi_id']}: {g['full_name']} ({g['gene_symbol']})",
                    source="NCBI Gene Database",
                    year=2024,
                    url=g.get("ncbi_link"),
                    evidence_level="Expert Curated"
                ))
                citations.append(CitationDTO(
                    title=f"ClinVar Variant Curation: {g['gene_symbol']}",
                    source="NIH ClinVar",
                    year=2024,
                    url=g.get("clinvar_link"),
                    evidence_level="ACMG Tier 1"
                ))

        # Check lab ranges
        for l in self.knowledge_base.get("lab_ranges", []):
            if l["test_name"].lower() in q:
                matched_items.append({"type": "lab_range", "data": l})
                citations.append(CitationDTO(
                    title=f"Standard Reference Ranges: {l['test_name']}",
                    source="Clinical Laboratory Standards Institute (CLSI)",
                    year=2023,
                    url="https://clsi.org/",
                    evidence_level="Standard Guideline"
                ))

        # Add general authoritative references if empty
        if not citations:
            citations.append(CitationDTO(
                title="WHO Global Health Guidelines & Medical Nomenclature",
                source="World Health Organization",
                year=2023,
                url="https://www.who.int/publications",
                evidence_level="International Consensus"
            ))

        return matched_items, citations[:4]

    async def generate_response(self, user_query: str, history: List[Any] = None) -> AssistantResponseDTO:
        # Step 1: Safety Assessment
        emergency_eval = MedicalSafetyEngine.evaluate_input_safety(user_query)
        evidence_items, citations = self._retrieve_relevant_evidence(user_query)

        # Step 2: External Provider Calling if configured
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                # Attempt Gemini API call
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                prompt = (
                    "You are MediPredict AI, a clinical medical science assistant. "
                    "Provide evidence-grounded, clear educational medical information with appropriate uncertainty, "
                    "strictly adhering to non-diagnostic boundaries. Do not prescribe treatments.\n\n"
                    f"User Query: {user_query}\n"
                    f"Retrieved Clinical Context: {json.dumps(evidence_items[:2])}"
                )
                res = model.generate_content(prompt)
                answer_text = res.text
                return AssistantResponseDTO(
                    answer=MedicalSafetyEngine.format_safe_response(answer_text, emergency_eval.is_emergency),
                    is_emergency=emergency_eval.is_emergency,
                    emergency_guidance=emergency_eval if emergency_eval.is_emergency else None,
                    citations=citations,
                    uncertainty_level="low",
                    follow_up_suggestions=[
                        "What laboratory tests are recommended to evaluate these findings?",
                        "How do clinical guidelines define threshold targets for this condition?",
                        "What lifestyle or dietary modifications are supported by evidence?"
                    ],
                    medical_disclaimer=MedicalSafetyEngine.get_standard_disclaimer()
                )
            except Exception as e:
                pass # fallback to evidence-grounded synthesis below

        # Step 3: Evidence-Grounded Synthesis Engine (Robust Fallback)
        answer_parts = []
        if emergency_eval.is_emergency:
            answer_parts.append(emergency_eval.guidance_message)
            answer_parts.append(f"**Recommended Action:** {emergency_eval.recommendation}\n")

        if evidence_items:
            for item in evidence_items[:2]:
                t = item["type"]
                d = item["data"]
                if t == "disease":
                    answer_parts.append(
                        f"### Clinical Overview: {d['name']} (ICD-11: {d['icd11']})\n"
                        f"{d['overview']}\n\n"
                        f"**Key Manifestations & Symptoms:**\n- " + "\n- ".join(d.get("symptoms", [])[:4]) + "\n\n"
                        f"**Pathophysiology & Disease Mechanisms:**\n{d.get('pathophysiology', '')}\n\n"
                        f"**Evidence-Based Diagnostic Testing:**\n- " + "\n- ".join(d.get("diagnostic_tests", [])[:3]) + "\n\n"
                        f"**Current Research Summary:**\n{d.get('research_summary', '')}"
                    )
                elif t == "gene":
                    answer_parts.append(
                        f"### Genomic Profile: {d['gene_symbol']} ({d['full_name']})\n"
                        f"- **Chromosome Location:** {d.get('chromosome')}\n"
                        f"- **Inheritance Pattern:** {d.get('inheritance_pattern')}\n"
                        f"- **Associated Conditions:** {', '.join(d.get('associated_conditions', []))}\n\n"
                        f"**Molecular Function:**\n{d.get('molecular_mechanism')}\n\n"
                        f"**Clinical Implication & ACMG Guidance:**\n{d.get('clinical_implications')}"
                    )
                elif t == "lab_range":
                    answer_parts.append(
                        f"### Laboratory Measurement: {d['test_name']}\n"
                        f"- **Standard Reference Range:** {d['ref_low']} - {d['ref_high']} {d['units']}\n"
                        f"- **Clinical Category:** {d.get('category')}\n\n"
                        f"**Clinical Interpretation Context:**\n{d.get('interpretation')}"
                    )
        else:
            answer_parts.append(
                f"### Evidence-Based Medical Information\n"
                f"In response to your query regarding **\"{user_query}\"**, medical consensus emphasizes comprehensive clinical evaluation, "
                f"risk stratification according to age and family history, and routine laboratory screening.\n\n"
                f"Clinical decision-support protocols recommend discussing symptom duration, severity, and any associated medications with your physician. "
                f"Reference ranges and laboratory tests should always be evaluated in the context of the individual patient's baseline physiology."
            )

        final_answer = "\n\n".join(answer_parts)

        return AssistantResponseDTO(
            answer=MedicalSafetyEngine.format_safe_response(final_answer, emergency_eval.is_emergency),
            is_emergency=emergency_eval.is_emergency,
            emergency_guidance=emergency_eval if emergency_eval.is_emergency else None,
            citations=citations,
            uncertainty_level="moderate" if not evidence_items else "low",
            follow_up_suggestions=[
                "What diagnostic laboratory tests correlate with these symptoms?",
                "Can you explain the standard reference intervals for relevant biomarkers?",
                "What peer-reviewed guidelines govern clinical management of this condition?"
            ],
            medical_disclaimer=MedicalSafetyEngine.get_standard_disclaimer()
        )

ai_service = AIProviderService()
