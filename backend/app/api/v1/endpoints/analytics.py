"""
analytics.py - ProcessLens Analytics and Bottleneck Discovery Endpoints
"""
from fastapi import APIRouter
from backend.app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/overview")
def get_analytics_overview():
    return analytics_service.get_overview_kpis()

@router.get("/bottlenecks")
def get_stage_bottlenecks():
    return analytics_service.get_stage_bottlenecks()

@router.get("/loops")
def get_return_loop_analysis():
    return analytics_service.get_return_loop_analysis()

@router.get("/variants")
def get_process_variants():
    return analytics_service.get_process_variants()
