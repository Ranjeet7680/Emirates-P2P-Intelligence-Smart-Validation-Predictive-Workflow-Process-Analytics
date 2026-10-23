"""
rules.py - Versioned SmartCheck Rules Catalogue Endpoints
"""
import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.core.config import settings

router = APIRouter()
RULES_PATH = os.path.join(settings.DATA_PATH, "validation_rules.json")

@router.get("")
def list_rules():
    if not os.path.exists(RULES_PATH):
        raise HTTPException(status_code=500, detail="Rules catalogue file not found")
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)
