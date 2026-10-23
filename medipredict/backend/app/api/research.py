from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.entities import User, SavedPaper, AuditLog
from ..schemas.dto import PubMedPaperDTO
from ..services.pubmed_service import pubmed_service
from .auth import get_current_user

router = APIRouter(prefix="/research", tags=["Medical Research Intelligence"])

@router.get("/pubmed", response_model=List[PubMedPaperDTO])
def search_pubmed(
    q: str = Query("cardiovascular prevention"),
    limit: int = Query(10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = pubmed_service.search_literature(q, limit=limit)
    # Check which ones are already saved by current user
    saved_pmids = set(p.pmid for p in db.query(SavedPaper.pmid).filter(SavedPaper.user_id == current_user.id).all())
    for p in papers:
        p.is_saved = p.pmid in saved_pmids
    return papers

@router.post("/save")
def save_paper(
    dto: PubMedPaperDTO,
    collection_name: str = Query("Clinical Research"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(SavedPaper).filter(SavedPaper.user_id == current_user.id, SavedPaper.pmid == dto.pmid).first()
    if existing:
        return {"status": "already_saved", "paper_id": existing.id}

    paper = SavedPaper(
        user_id=current_user.id,
        pmid=dto.pmid,
        title=dto.title,
        authors=dto.authors,
        journal=dto.journal,
        year=dto.year,
        doi=dto.doi,
        abstract=dto.abstract,
        collection_name=collection_name
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    audit = AuditLog(
        user_id=current_user.id,
        action="PAPER_SAVED",
        resource_type="SavedPaper",
        resource_id=paper.id,
        details={"pmid": paper.pmid, "title": paper.title[:50]}
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "paper_id": paper.id}

@router.get("/saved", response_model=List[PubMedPaperDTO])
def get_saved_papers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(SavedPaper).filter(SavedPaper.user_id == current_user.id).order_by(SavedPaper.saved_at.desc()).all()
    return [
        PubMedPaperDTO(
            pmid=p.pmid,
            title=p.title,
            authors=p.authors,
            journal=p.journal,
            year=p.year,
            doi=p.doi,
            abstract=p.abstract,
            is_saved=True
        )
        for p in saved
    ]

@router.get("/citation")
def get_citation(pmid: str = Query(...), style: str = Query("apa")):
    papers = pubmed_service.search_literature(pmid, limit=1)
    if not papers:
        raise HTTPException(status_code=404, detail="Publication not found")
    formatted = pubmed_service.format_citation(papers[0], style=style)
    return {"pmid": pmid, "style": style, "citation": formatted}
