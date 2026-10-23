import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface ModelCard {
  model_id: string;
  name: string;
  algorithm: string;
  version: string;
  status: string;
  features: string[];
  metrics: { roc_auc: number; f1: number; accuracy: number };
  feature_importances: Record<string, number>;
  limitations: string;
}

interface PredictionResult {
  model_id: string;
  model_name: string;
  risk_probability: number;
  risk_category: string;
  feature_contributions: Record<string, number>;
  actionable_recommendations: string[];
  disclaimer: string;
}

export const DiseaseRiskLabView: React.FC = () => {
  const [models, setModels] = useState<ModelCard[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('MOD-DIAB-01');
  const [loadingModels, setLoadingModels] = useState<boolean>(true);
  const [predicting, setPredicting] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showModelCard, setShowModelCard] = useState<boolean>(false);

  // Diabetes default feature states
  const [diabFeatures, setDiabFeatures] = useState({
    age: 48,
    bmi: 27.4,
    glucose_fasting: 104,
    hba1c: 5.9,
    systolic_bp: 128,
    family_history_score: 1,
    physical_activity_hours: 2.5,
  });

  // Cardio default feature states
  const [cardioFeatures, setCardioFeatures] = useState({
    age: 56,
    total_cholesterol: 215,
    hdl_cholesterol: 46,
    systolic_bp: 138,
    smoker: 0,
    diabetes: 0,
    egfr: 88,
  });

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const data = await api.getRiskModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to load risk models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const currentModel = models.find((m) => m.model_id === selectedModelId);

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const features = selectedModelId === 'MOD-DIAB-01' ? diabFeatures : cardioFeatures;
      const res = await api.predictRisk({
        model_id: selectedModelId,
        features,
      });
      setPrediction(res);
    } catch (err: any) {
      console.error('Prediction failed:', err);
    } finally {
      setPredicting(false);
    }
  };

  // Run prediction initially when models are ready or model is switched
  useEffect(() => {
    if (models.length > 0) {
      runPrediction();
    }
  }, [selectedModelId, models]);

  const getRiskColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'high':
        return { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-800 border-red-200' };
      case 'intermediate':
        return { bg: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'borderline':
        return { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const riskColors = getRiskColor(prediction?.risk_category);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-9xl">neurology</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            Scikit-Learn Machine Learning Inference
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            AI Disease Risk Research Lab
          </h1>
          <p className="text-purple-100 text-sm leading-relaxed">
            Multi-variable disease risk stratification using calibrated Gradient Boosting and Random Forest algorithms. Explore dynamic physiological parameters, feature sensitivity, and transparent model cards.
          </p>
        </div>
      </div>

      {/* Model Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400">Select Model:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedModelId('MOD-DIAB-01')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedModelId === 'MOD-DIAB-01'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">water_drop</span>
              <span>Type 2 Diabetes (GBoost)</span>
            </button>
            <button
              onClick={() => setSelectedModelId('MOD-CVD-01')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedModelId === 'MOD-CVD-01'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">favorite</span>
              <span>10-Yr Cardiovascular (RF)</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowModelCard(true)}
          className="text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">info</span>
          <span>View Model Card & Performance</span>
        </button>
      </div>

      {/* Main Grid: Parameter Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedModelId === 'MOD-DIAB-01'
                  ? 'Diabetes Risk Physiological Inputs'
                  : 'ASCVD Cardiovascular Risk Inputs'}
              </h2>
              <p className="text-xs text-slate-500">Adjust clinical variables to test predictive sensitivity</p>
            </div>
            <button
              onClick={runPrediction}
              disabled={predicting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {predicting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  <span>Recalculate</span>
                </>
              )}
            </button>
          </div>

          {/* Form sliders for DIABETES */}
          {selectedModelId === 'MOD-DIAB-01' ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Age</span>
                  <span className="font-mono text-purple-700">{diabFeatures.age} years</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={diabFeatures.age}
                  onChange={(e) => setDiabFeatures({ ...diabFeatures, age: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Body Mass Index (BMI)</span>
                  <span className="font-mono text-purple-700">{diabFeatures.bmi} kg/m²</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="48"
                  step="0.1"
                  value={diabFeatures.bmi}
                  onChange={(e) => setDiabFeatures({ ...diabFeatures, bmi: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Fasting Blood Glucose</span>
                  <span className="font-mono text-purple-700">{diabFeatures.glucose_fasting} mg/dL</span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="250"
                  value={diabFeatures.glucose_fasting}
                  onChange={(e) => setDiabFeatures({ ...diabFeatures, glucose_fasting: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Glycated Hemoglobin (HbA1c)</span>
                  <span className="font-mono text-purple-700">{diabFeatures.hba1c}%</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="12.0"
                  step="0.1"
                  value={diabFeatures.hba1c}
                  onChange={(e) => setDiabFeatures({ ...diabFeatures, hba1c: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Systolic Blood Pressure</span>
                  <span className="font-mono text-purple-700">{diabFeatures.systolic_bp} mmHg</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="200"
                  value={diabFeatures.systolic_bp}
                  onChange={(e) => setDiabFeatures({ ...diabFeatures, systolic_bp: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Family History</label>
                  <select
                    value={diabFeatures.family_history_score}
                    onChange={(e) => setDiabFeatures({ ...diabFeatures, family_history_score: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={0}>No Family History</option>
                    <option value={1}>1 First-Degree Relative</option>
                    <option value={2}>Multiple Relatives</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Weekly Exercise</span>
                    <span className="font-mono text-purple-700">{diabFeatures.physical_activity_hours} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={diabFeatures.physical_activity_hours}
                    onChange={(e) => setDiabFeatures({ ...diabFeatures, physical_activity_hours: Number(e.target.value) })}
                    className="w-full accent-purple-600 mt-2"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Form sliders for CARDIOVASCULAR */
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Age</span>
                  <span className="font-mono text-purple-700">{cardioFeatures.age} years</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="85"
                  value={cardioFeatures.age}
                  onChange={(e) => setCardioFeatures({ ...cardioFeatures, age: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Total Cholesterol</span>
                  <span className="font-mono text-purple-700">{cardioFeatures.total_cholesterol} mg/dL</span>
                </div>
                <input
                  type="range"
                  min="120"
                  max="350"
                  value={cardioFeatures.total_cholesterol}
                  onChange={(e) => setCardioFeatures({ ...cardioFeatures, total_cholesterol: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>HDL Cholesterol</span>
                  <span className="font-mono text-purple-700">{cardioFeatures.hdl_cholesterol} mg/dL</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={cardioFeatures.hdl_cholesterol}
                  onChange={(e) => setCardioFeatures({ ...cardioFeatures, hdl_cholesterol: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Systolic Blood Pressure</span>
                  <span className="font-mono text-purple-700">{cardioFeatures.systolic_bp} mmHg</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="200"
                  value={cardioFeatures.systolic_bp}
                  onChange={(e) => setCardioFeatures({ ...cardioFeatures, systolic_bp: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>eGFR (Kidney Function)</span>
                  <span className="font-mono text-purple-700">{cardioFeatures.egfr} mL/min/1.73m²</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="130"
                  value={cardioFeatures.egfr}
                  onChange={(e) => setCardioFeatures({ ...cardioFeatures, egfr: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Smoking Status</label>
                  <select
                    value={cardioFeatures.smoker}
                    onChange={(e) => setCardioFeatures({ ...cardioFeatures, smoker: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={0}>Non-Smoker</option>
                    <option value={1}>Active Tobacco Smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Diabetes Diagnosis</label>
                  <select
                    value={cardioFeatures.diabetes}
                    onChange={(e) => setCardioFeatures({ ...cardioFeatures, diabetes: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={0}>No Diagnosis</option>
                    <option value={1}>Established Type 1 or 2</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results & Explainability Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Risk Gauge Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Model Risk Probability Output
            </span>

            {predicting ? (
              <div className="py-12">
                <span className="material-symbols-outlined animate-spin text-5xl text-purple-600 mb-2">progress_activity</span>
                <p className="text-xs text-slate-500 font-medium">Running model inference...</p>
              </div>
            ) : prediction ? (
              <div className="w-full space-y-4">
                {/* Big Percentage Display */}
                <div className="relative inline-flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full">
                  <div className="text-5xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {(prediction.risk_probability * 100).toFixed(1)}%
                  </div>
                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${riskColors.badge}`}>
                    {prediction.risk_category} Risk
                  </span>
                </div>

                {/* Relative Feature Contribution Weights */}
                <div className="text-left w-full space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Feature Contribution Weights</span>
                    <span className="text-[10px] text-slate-400 font-normal">Relative sensitivity</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(prediction.feature_contributions || {}).map(([key, val]) => (
                      <div key={key} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-slate-500">{val}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${riskColors.bg}`}
                            style={{ width: `${Math.min(100, Math.max(5, val * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Clinical Recommendations */}
                <div className="text-left w-full pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Evidence-Based Stratification Guidance
                  </div>
                  <div className="space-y-1.5">
                    {prediction.actionable_recommendations.map((rec, i) => (
                      <div key={i} className="text-xs text-slate-600 bg-purple-50/60 border border-purple-100 p-2.5 rounded-lg flex items-start gap-2">
                        <span className="material-symbols-outlined text-purple-600 text-sm mt-0.5">verified</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Research Guardrail Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <span className="material-symbols-outlined text-base text-amber-600">warning</span>
              <span>Non-Diagnostic Research Tool</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              This calculator runs pre-trained machine learning algorithms for exploratory academic purposes only. It is not an FDA-cleared diagnostic device and should never supersede clinical judgment.
            </p>
          </div>
        </div>
      </div>

      {/* Model Card Modal */}
      {showModelCard && currentModel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-2xl">badge</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{currentModel.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {currentModel.model_id} • v{currentModel.version}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModelCard(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-purple-700 font-mono">
                  {currentModel.metrics.roc_auc}
                </div>
                <div className="text-[10px] text-purple-600 uppercase font-semibold">ROC-AUC Score</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-slate-800 font-mono">
                  {currentModel.metrics.accuracy * 100}%
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-slate-800 font-mono">
                  {currentModel.metrics.f1}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">F1 Score</div>
              </div>
            </div>

            {/* Algorithm Info */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Architecture</div>
              <div className="text-xs font-mono bg-slate-100 p-2.5 rounded-lg text-slate-700">
                Algorithm: {currentModel.algorithm} (Scikit-Learn Ensemble)
              </div>
            </div>

            {/* Features Included */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Input Feature Vector</div>
              <div className="flex flex-wrap gap-1.5">
                {currentModel.features.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Limitations & Ethical Guidance */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Limitations</div>
              <div className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200 p-3 rounded-lg leading-relaxed">
                {currentModel.limitations}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModelCard(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Close Model Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
