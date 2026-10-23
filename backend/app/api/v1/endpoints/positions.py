"""
positions.py - Organizational Position Catalog Endpoints
"""
import os
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.core.config import settings

router = APIRouter()
POSITIONS_PATH = os.path.join(settings.DATA_PATH, "org_positions.csv")

@router.get("")
def list_positions(
    department: Optional[str] = None,
    vacant_only: bool = False,
    active_only: bool = True,
    search: Optional[str] = None,
    limit: int = Query(default=100, le=200)
):
    if not os.path.exists(POSITIONS_PATH):
        raise HTTPException(status_code=500, detail="Positions catalog file not found")
        
    df = pd.read_csv(POSITIONS_PATH)
    if department:
        df = df[df["department"] == department]
    if vacant_only:
        df = df[df["current_fte_filled"] < df["fte_capacity"]]
    if active_only:
        df = df[df["active_flag"] == True]
    if search:
        search_lower = search.lower()
        df = df[
            df["job_title"].str.lower().str.contains(search_lower) |
            df["position_id"].str.lower().str.contains(search_lower)
        ]
        
    return df.head(limit).to_dict(orient="records")

@router.get("/{position_id}")
def get_position(position_id: str):
    if not os.path.exists(POSITIONS_PATH):
        raise HTTPException(status_code=500, detail="Positions catalog file not found")
        
    df = pd.read_csv(POSITIONS_PATH)
    match = df[df["position_id"] == position_id]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Position '{position_id}' not found")
    return match.iloc[0].to_dict()
