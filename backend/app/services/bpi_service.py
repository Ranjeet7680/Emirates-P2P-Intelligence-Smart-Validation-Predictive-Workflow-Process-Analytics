"""
bpi_service.py - Enterprise BPI Challenge 2019 Process Mining Query Service
"""
import os
import json
from typing import Dict, Any
from backend.app.core.config import settings

BPI_SUMMARY_PATH = os.path.join(settings.DATA_PATH, "bpi_2019_summary.json")

class BpiService:
    def get_summary(self) -> Dict[str, Any]:
        if os.path.exists(BPI_SUMMARY_PATH):
            with open(BPI_SUMMARY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "error": "BPI 2019 summary not yet indexed. Run pipelines/bpi_indexer.py to generate summary cache."
        }

bpi_service = BpiService()
