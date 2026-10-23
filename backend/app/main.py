"""
main.py - Emirates P2P Intelligence FastAPI Application
Smart Validation, Predictive Workflow & Process Analytics Service Layer.
"""
import os
import json
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.models.entities import RequestModel, WorkflowEventModel, AuditEventModel

# Import API Routers
from backend.app.api.v1.endpoints import (
    requests, hr, positions, rules, predictions,
    analytics, recommendations, bpi, audit, export
)

# Ensure tables exist at startup
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed database from generated CSVs if table is empty
    db = SessionLocal()
    try:
        count = db.query(RequestModel).count()
        if count == 0:
            req_csv = os.path.join(settings.DATA_PATH, "requests.csv")
            evt_csv = os.path.join(settings.DATA_PATH, "p2p_event_log.csv")
            if os.path.exists(req_csv):
                print("Seeding initial requests from CSV...")
                df_req = pd.read_csv(req_csv)
                for _, row in df_req.head(250).iterrows():  # Seed first 250 records for instant loading
                    rm = RequestModel(
                        request_id=str(row["request_id"]),
                        request_type=str(row["request_type"]),
                        current_state=str(row["current_state"]),
                        submitter_role=str(row["submitter_role"]),
                        candidate_id=str(row["candidate_id"]),
                        current_grade=str(row["current_grade"]),
                        target_grade=str(row["target_grade"]),
                        grade_jump=int(row["grade_jump"]),
                        destination_position_id=str(row["destination_position_id"]),
                        department=str(row["department"]),
                        cost_center=str(row["cost_center"]),
                        is_safety_critical=int(row["is_safety_critical"]),
                        lead_time_days=int(row["lead_time_days"]),
                        effective_date=str(row["effective_date"]),
                        target_sla_days=float(row["target_sla_days"]),
                        total_elapsed_days=float(row["total_elapsed_days"]),
                        current_owner_role=str(row["current_owner"]),
                        current_owner_team=str(row["department"]),
                        next_action="Awaiting action" if row["is_in_flight"] else "Fulfilled",
                        initial_error_count=int(row["initial_error_count"]),
                        initial_warning_count=int(row["initial_warning_count"]),
                        is_delayed=int(row["is_delayed"]),
                        was_returned=int(row["was_returned"])
                    )
                    db.add(rm)
                db.commit()

            if os.path.exists(evt_csv):
                print("Seeding initial workflow events...")
                df_evt = pd.read_csv(evt_csv)
                # Seed events for the seeded requests
                seeded_ids = set(db.query(RequestModel.request_id).all())
                seeded_ids = {s[0] for s in seeded_ids}
                df_evt_filtered = df_evt[df_evt["request_id"].isin(seeded_ids)]
                for _, row in df_evt_filtered.iterrows():
                    we = WorkflowEventModel(
                        event_id=str(row["event_id"]),
                        request_id=str(row["request_id"]),
                        stage=str(row["stage"]),
                        actor_role=str(row["actor_role"]),
                        team=str(row["team"]),
                        timestamp=str(row["timestamp"]),
                        duration_hours=float(row["duration_hours"]),
                        outcome=str(row["outcome"]),
                        reason_code=str(row["reason_code"]) if pd.notna(row["reason_code"]) else None
                    )
                    db.add(we)
                db.commit()
                print("Database auto-seeding completed.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Solution Architecture & Implementation for Position-to-Person Request Validation, Predictive Workflow & Process Analytics.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register versioned routers
api_v1 = settings.API_V1_STR
app.include_router(requests.router, prefix=f"{api_v1}/requests", tags=["Requests & Validation"])
app.include_router(hr.router, prefix=f"{api_v1}/hr", tags=["HR Operations Queue"])
app.include_router(positions.router, prefix=f"{api_v1}/positions", tags=["Positions Catalog"])
app.include_router(rules.router, prefix=f"{api_v1}/rules", tags=["Validation Rules Catalogue"])
app.include_router(predictions.router, prefix=f"{api_v1}/predictions", tags=["Predictive Analytics"])
app.include_router(analytics.router, prefix=f"{api_v1}/analytics", tags=["ProcessLens Process Mining"])
app.include_router(recommendations.router, prefix=f"{api_v1}/recommendations", tags=["Improvement & Savings Engine"])
app.include_router(bpi.router, prefix=f"{api_v1}/bpi", tags=["Enterprise BPI 2019 Process Mining"])
app.include_router(audit.router, prefix=f"{api_v1}/audit", tags=["Governance & Audit Trail"])
app.include_router(export.router, prefix=f"{api_v1}/export", tags=["Exports"])

@app.get("/health", tags=["System"])
@app.get(f"{api_v1}/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "SQLite (Connected)",
        "models": {
            "return_risk_model": "LOADED",
            "delay_risk_model": "LOADED"
        }
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to Emirates P2P Intelligence API",
        "documentation": "/docs",
        "health": "/health"
    }
