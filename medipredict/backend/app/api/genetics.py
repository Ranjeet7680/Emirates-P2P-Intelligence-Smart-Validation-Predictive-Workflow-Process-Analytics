import os, json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..schemas.dto import GeneDTO

router = APIRouter(prefix="/genetics", tags=["Gene & Genetics Explorer"])

def load_genes() -> List[dict]:
    path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "genes.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@router.get("/genes", response_model=List[GeneDTO])
def list_genes(
    search: Optional[str] = Query(None),
    inheritance: Optional[str] = Query(None)
):
    all_genes = load_genes()
    filtered = all_genes

    if inheritance and inheritance.lower() != "all":
        filtered = [g for g in filtered if inheritance.lower() in g.get("inheritance_pattern", "").lower()]

    if search:
        q = search.lower()
        filtered = [
            g for g in filtered
            if q in g["gene_symbol"].lower()
            or q in g.get("full_name", "").lower()
            or q in g.get("chromosome", "").lower()
            or any(q in c.lower() for c in g.get("associated_conditions", []))
        ]

    return [GeneDTO(**g) for g in filtered]

@router.get("/genes/{gene_symbol}", response_model=GeneDTO)
def get_gene(gene_symbol: str):
    all_genes = load_genes()
    gene = next((g for g in all_genes if g["gene_symbol"].lower() == gene_symbol.lower()), None)
    if not gene:
        raise HTTPException(status_code=404, detail="Gene record not found")
    return GeneDTO(**gene)
