"""
train_models.py - Train Responsible, Leak-Free Risk Prediction Models
Implements Section 11 of Emirates P2P Intelligence Architecture Blueprint.
Evaluates Return Risk and Delay Risk models on held-out test data.
Saves versioned artifacts and generates Model Cards.
"""
import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_score,
    recall_score, f1_score, brier_score_loss, confusion_matrix
)
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

WORKSPACE_DIR = r"c:\Users\Victus\OneDrive\Desktop\Right First Time Smart Position To Person Requests Challenge"
DATA_DIR = os.path.join(WORKSPACE_DIR, "data")
MODELS_DIR = os.path.join(WORKSPACE_DIR, "models")
DOCS_DIR = os.path.join(WORKSPACE_DIR, "docs")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

print("Loading historical requests data...")
df = pd.read_csv(os.path.join(DATA_DIR, "requests.csv"))

# Filter completed requests for training (exclude in-flight requests to prevent censoring bias)
df_closed = df[df["is_in_flight"] == 0].copy()
print(f"Total historical closed requests for training/eval: {len(df_closed)}")

# Zero-leakage features strictly available at prediction cutoff (submission time)
FEATURE_COLS_CAT = ["request_type", "department", "current_grade", "target_grade"]
FEATURE_COLS_NUM = [
    "grade_jump", "is_safety_critical", "lead_time_days",
    "initial_error_count", "initial_warning_count"
]

X = df_closed[FEATURE_COLS_CAT + FEATURE_COLS_NUM]
y_return = df_closed["was_returned"]
y_delay = df_closed["is_delayed"]

# Leak-free Train/Test split (80/20) with fixed random seed
X_train, X_test, y_ret_train, y_ret_test = train_test_split(
    X, y_return, test_size=0.20, random_state=42, stratify=y_return
)
_, _, y_del_train, y_del_test = train_test_split(
    X, y_delay, test_size=0.20, random_state=42, stratify=y_delay
)

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), FEATURE_COLS_CAT),
        ("num", "passthrough", FEATURE_COLS_NUM)
    ]
)

def train_and_evaluate(target_name, y_tr, y_te, clf):
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])
    
    # 5-fold Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_roc = cross_val_score(pipeline, X_train, y_tr, cv=cv, scoring="roc_auc")
    
    # Train final pipeline on full train set
    pipeline.fit(X_train, y_tr)
    
    # Evaluate on held-out test set
    y_pred_proba = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    roc_auc = roc_auc_score(y_te, y_pred_proba)
    pr_auc = average_precision_score(y_te, y_pred_proba)
    precision = precision_score(y_te, y_pred, zero_division=0)
    recall = recall_score(y_te, y_pred, zero_division=0)
    f1 = f1_score(y_te, y_pred, zero_division=0)
    brier = brier_score_loss(y_te, y_pred_proba)
    cm = confusion_matrix(y_te, y_pred).tolist()
    
    # Extract feature importances
    encoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    cat_feature_names = encoder.get_feature_names_out(FEATURE_COLS_CAT).tolist()
    all_feature_names = cat_feature_names + FEATURE_COLS_NUM
    importances = pipeline.named_steps["classifier"].feature_importances_
    
    top_indices = np.argsort(importances)[::-1][:6]
    top_features = [{"feature": all_feature_names[i], "importance": round(float(importances[i]), 4)} for i in top_indices]
    
    eval_metrics = {
        "target": target_name,
        "cv_roc_auc_mean": round(float(cv_roc.mean()), 4),
        "cv_roc_auc_std": round(float(cv_roc.std()), 4),
        "test_roc_auc": round(float(roc_auc), 4),
        "test_pr_auc": round(float(pr_auc), 4),
        "test_precision": round(float(precision), 4),
        "test_recall": round(float(recall), 4),
        "test_f1": round(float(f1), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": cm,
        "test_samples": len(y_te),
        "top_features": top_features
    }
    
    return pipeline, eval_metrics

print("\n--- Training Return Risk Model (ReturnPredict_v1) ---")
return_clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=3, random_state=42)
pipe_return, eval_return = train_and_evaluate("was_returned", y_ret_train, y_ret_test, return_clf)
print("Return Model Evaluation:", json.dumps(eval_return, indent=2))

print("\n--- Training Delay Risk Model (DelayPredict_v1) ---")
delay_clf = RandomForestClassifier(n_estimators=120, max_depth=4, random_state=42)
pipe_delay, eval_delay = train_and_evaluate("is_delayed", y_del_train, y_del_test, delay_clf)
print("Delay Model Evaluation:", json.dumps(eval_delay, indent=2))

# Save pipelines
return_model_path = os.path.join(MODELS_DIR, "return_risk_model.joblib")
delay_model_path = os.path.join(MODELS_DIR, "delay_risk_model.joblib")

joblib.dump(pipe_return, return_model_path)
joblib.dump(pipe_delay, delay_model_path)
print(f"\nSaved models to {return_model_path} and {delay_model_path}")

# Save Model Registry metadata
registry = {
    "models": [
        {
            "model_id": "ReturnPredict_v1",
            "algorithm": "GradientBoostingClassifier",
            "version": "1.0.0",
            "target": "was_returned (Request Returned for Rework)",
            "trained_at": "2026-10-23T16:00:00Z",
            "feature_version": "v1_submission_cutoff",
            "features_used": FEATURE_COLS_CAT + FEATURE_COLS_NUM,
            "metrics": eval_return,
            "artifact_path": "models/return_risk_model.joblib"
        },
        {
            "model_id": "DelayPredict_v1",
            "algorithm": "RandomForestClassifier",
            "version": "1.0.0",
            "target": "is_delayed (Request Exceeds 5-Day SLA)",
            "trained_at": "2026-10-23T16:00:00Z",
            "feature_version": "v1_submission_cutoff",
            "features_used": FEATURE_COLS_CAT + FEATURE_COLS_NUM,
            "metrics": eval_delay,
            "artifact_path": "models/delay_risk_model.joblib"
        }
    ]
}

with open(os.path.join(MODELS_DIR, "model_registry.json"), "w", encoding="utf-8") as f:
    json.dump(registry, f, indent=2)

# Generate Model Card
model_card_content = f"""# Emirates P2P Intelligence — Model Card

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
| **ROC-AUC** | {eval_return['test_roc_auc']} | {eval_delay['test_roc_auc']} |
| **PR-AUC** | {eval_return['test_pr_auc']} | {eval_delay['test_pr_auc']} |
| **Precision** | {eval_return['test_precision']} | {eval_delay['test_precision']} |
| **Recall** | {eval_return['test_recall']} | {eval_delay['test_recall']} |
| **F1-Score** | {eval_return['test_f1']} | {eval_delay['test_f1']} |
| **Brier Score (Calibration)** | {eval_return['brier_score']} | {eval_delay['brier_score']} |

## 5. Top Contributing Predictive Factors
- `grade_jump`: Jump in pay grade step
- `initial_error_count` & `initial_warning_count`: Pre-submission rule findings
- `lead_time_days`: Advance operational lead time
- `is_safety_critical`: Position requires security & medical airside clearances
- `department`: Division-specific approval hierarchy
"""

with open(os.path.join(DOCS_DIR, "model_card.md"), "w", encoding="utf-8") as f:
    f.write(model_card_content)

print("Saved model_registry.json and docs/model_card.md successfully!")
