import os, json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..schemas.dto import DiseaseDTO

router = APIRouter(prefix="/diseases", tags=["Disease Research Explorer"])

def load_diseases() -> List[dict]:
    path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "diseases.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@router.get("", response_model=List[DiseaseDTO])
def list_diseases(
    search: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None)
):
    all_diseases = load_diseases()
    filtered = all_diseases

    if specialty and specialty.lower() != "all":
        filtered = [d for d in filtered if d.get("specialty", "").lower() == specialty.lower()]

    if search:
        q = search.lower()
        filtered = [
            d for d in filtered
            if q in d["name"].lower()
            or q in d.get("icd11", "").lower()
            or q in d.get("overview", "").lower()
            or any(q in s.lower() for s in d.get("symptoms", []))
        ]

    return [DiseaseDTO(**d) for d in filtered]

@router.get("/{disease_id}", response_model=DiseaseDTO)
def get_disease(disease_id: str):
    all_diseases = load_diseases()
    disease = next((d for d in all_diseases if d["id"] == disease_id or d["name"].lower() == disease_id.lower()), None)
    if not disease:
        raise HTTPException(status_code=404, detail="Disease record not found in medical knowledge base")
    return DiseaseDTO(**disease)
