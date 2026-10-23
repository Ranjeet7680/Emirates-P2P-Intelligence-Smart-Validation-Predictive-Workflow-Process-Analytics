import re, os, json
from typing import List, Dict, Any, Tuple
import fitz # PyMuPDF
from ..schemas.dto import LabMeasurementDTO

class LabReportParser:
    def __init__(self):
        self.reference_ranges = self._load_reference_ranges()

    def _load_reference_ranges(self) -> Dict[str, Dict[str, Any]]:
        path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "lab_reference_ranges.json")
        try:
            with open(path, "r", encoding="utf-8") as f:
                ranges = json.load(f)
                return {r["test_name"].lower(): r for r in ranges}
        except Exception:
            return {}

    def extract_text_from_file(self, file_path: str, file_type: str = "application/pdf") -> str:
        text = ""
        try:
            if "pdf" in file_type.lower() or file_path.endswith(".pdf"):
                doc = fitz.open(file_path)
                for page in doc:
                    text += page.get_text() + "\n"
                doc.close()
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
        except Exception as e:
            text = f"Error reading document: {str(e)}"
        return text

    def parse_measurements(self, raw_text: str) -> Tuple[List[LabMeasurementDTO], str]:
        measurements: List[LabMeasurementDTO] = []
        lines = raw_text.splitlines()

        # Known pattern variations
        test_patterns = [
            ("Fasting Plasma Glucose", r"(?:fasting\s+glucose|glucose,?\s*fasting|glucose)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mg/dL|mmol/L)?"),
            ("Hemoglobin A1c", r"(?:hba1c|hemoglobin\s+a1c|a1c)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(%)?"),
            ("Total Cholesterol", r"(?:total\s+cholesterol|cholesterol,?\s*total)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?"),
            ("LDL Cholesterol", r"(?:ldl\s+cholesterol|ldl-c|ldl)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?"),
            ("HDL Cholesterol", r"(?:hdl\s+cholesterol|hdl-c|hdl)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?"),
            ("Triglycerides", r"(?:triglycerides|triglyceride)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?"),
            ("Serum Creatinine", r"(?:serum\s+creatinine|creatinine)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mg/dL)?"),
            ("eGFR (CKD-EPI)", r"(?:egfr|estimated\s+gfr)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(mL/min.*)?"),
            ("High-Sensitivity Troponin I", r"(?:troponin\s+i|hs-ctni|troponin)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(ng/L|ug/L)?"),
            ("Thyroid Stimulating Hormone (TSH)", r"(?:tsh|thyroid\s+stimulating\s+hormone)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(uIU/mL|mIU/L)?"),
            ("Hemoglobin", r"(?:hemoglobin|hgb)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(g/dL)?"),
            ("White Blood Cell Count", r"(?:wbc|white\s+blood\s+cells?)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(10\^3/uL|k/uL)?"),
        ]

        found_tests = set()

        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue

            for test_name, pattern in test_patterns:
                if test_name in found_tests:
                    continue
                match = re.search(pattern, line_clean, re.IGNORECASE)
                if match:
                    val_str = match.group(1)
                    try:
                        val = float(val_str)
                    except ValueError:
                        continue

                    ref_info = self.reference_ranges.get(test_name.lower(), {})
                    units = match.group(2) or ref_info.get("units", "standard")
                    ref_low = ref_info.get("ref_low", None)
                    ref_high = ref_info.get("ref_high", None)
                    crit_low = ref_info.get("critical_low", None)
                    crit_high = ref_info.get("critical_high", None)

                    flag = "NORMAL"
                    if crit_high is not None and val >= crit_high:
                        flag = "CRITICAL"
                    elif crit_low is not None and val <= crit_low:
                        flag = "CRITICAL"
                    elif ref_high is not None and val > ref_high:
                        flag = "HIGH"
                    elif ref_low is not None and val < ref_low:
                        flag = "LOW"

                    interpretation = ref_info.get("interpretation", "Laboratory measurement extracted for clinical evaluation.")

                    measurements.append(LabMeasurementDTO(
                        test_name=test_name,
                        category=ref_info.get("category", "General"),
                        value_numeric=val,
                        units=units,
                        ref_low=ref_low,
                        ref_high=ref_high,
                        flag=flag,
                        confidence_score=0.96,
                        user_corrected=False,
                        interpretation=interpretation
                    ))
                    found_tests.add(test_name)

        # Generate summary
        high_count = sum(1 for m in measurements if m.flag in ["HIGH", "CRITICAL"])
        crit_count = sum(1 for m in measurements if m.flag == "CRITICAL")
        
        summary = (
            f"Extracted {len(measurements)} laboratory measurements. "
            f"Detected {high_count} elevated measurement(s) and {crit_count} critical indicator(s). "
            "All values must be correlated with clinical presentation."
        )

        return measurements, summary

lab_parser = LabReportParser()
