"""
bpi.py - Enterprise BPI Challenge 2019 Process Mining Endpoints
"""
from fastapi import APIRouter
from backend.app.services.bpi_service import bpi_service

router = APIRouter()

@router.get("/overview")
def get_bpi_overview():
    return bpi_service.get_summary()
