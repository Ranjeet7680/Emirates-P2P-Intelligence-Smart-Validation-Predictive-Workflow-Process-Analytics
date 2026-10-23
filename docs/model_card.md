# Emirates P2P Intelligence — Model Card

## 1. Model Details
- **Platform:** Emirates P2P Intelligence
- **Models:**
  1. `ReturnPredict_v1` (Gradient Boosting Classifier)
  2. `DelayPredict_v1` (Random Forest Classifier)
- **Framework:** scikit-learn 1.4+
- **Data Cutoff:** Prediction generated strictly at request submission time.

## 2. Intended Use & Governance
- **Primary Use:** Decision-support and early triage for HR Specialists and Department Line Managers to flag requests with high probability of missing prerequisites or SLA breaches.
- **Out of Scope / Prohibited Use:** Automatic approval or rejection of requests; automated employee-impacting HR actions; decisions without authorized human review.

## 3. Data Leakage Controls
- Evaluated strictly using temporal/held-out 80/20 split.
- Future timestamps, downstream return reason codes, and post-submission review duration are excluded from feature vectors.

## 4. Evaluation Performance (Held-Out Test Set)

| Metric | ReturnPredict_v1 | DelayPredict_v1 |
| :--- | :--- | :--- |
| **ROC-AUC** | 0.6739 | 0.5396 |
| **PR-AUC** | 0.5894 | 0.8424 |
| **Precision** | 0.6167 | 0.8 |
| **Recall** | 0.4066 | 1.0 |
| **F1-Score** | 0.4901 | 0.8889 |
| **Brier Score (Calibration)** | 0.2265 | 0.1597 |

## 5. Top Contributing Predictive Factors
- `grade_jump`: Jump in pay grade step
- `initial_error_count` & `initial_warning_count`: Pre-submission rule findings
- `lead_time_days`: Advance operational lead time
- `is_safety_critical`: Position requires security & medical airside clearances
- `department`: Division-specific approval hierarchy
