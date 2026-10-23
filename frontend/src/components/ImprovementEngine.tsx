import React, { useState, useEffect } from 'react';
import {
  Lightbulb, Calculator, TrendingUp, CheckCircle, ArrowRight,
  ShieldCheck, AlertCircle, Clock, Zap
} from 'lucide-react';
import { api } from '../api/client';

export const ImprovementEngine: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState<number>(350);
  const [avoidableMinutes, setAvoidableMinutes] = useState<number>(45);
  const [avoidedShare, setAvoidedShare] = useState<number>(0.60);
  const [savingsResults, setSavingsResults] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    api.getRecommendations().then((data: any) => {
      setRecommendations(data);
    }).catch(console.error);

    runSavingsCalculation();
  }, []);

  const runSavingsCalculation = async () => {
    setCalculating(true);
    try {
      const res = await api.calculateSavings({
        monthly_volume: Number(monthlyVolume),
        avoidable_minutes_per_request: Number(avoidableMinutes),
        avoided_returns_share: Number(avoidedShare)
      });
      setSavingsResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(runSavingsCalculation, 200);
    return () => clearTimeout(timer);
  }, [monthlyVolume, avoidableMinutes, avoidedShare]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Improvement & Savings Engine</h1>
        <p className="text-sm text-slate-500">
          Evidence-grounded process intervention cards and interactive parameterized ROI savings calculator.
        </p>
      </div>

      {/* Interactive Parameterized ROI Calculator */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Interactive ROI & Labor Capacity Savings Calculator</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Formula: (Monthly Volume × Avoidable Mins Saved) ÷ 60
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Monthly P2P Requests Volume:</span>
              <span className="font-mono text-emerald-700 text-sm font-black">{monthlyVolume}</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="25"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>100 reqs</span>
              <span>1,000 reqs</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Avoidable Handling Minutes / Return:</span>
              <span className="font-mono text-emerald-700 text-sm font-black">{avoidableMinutes} min</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={avoidableMinutes}
              onChange={(e) => setAvoidableMinutes(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>15 min</span>
              <span>90 min</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>SmartCheck Return Prevention Share:</span>
              <span className="font-mono text-emerald-700 text-sm font-black">{Math.round(avoidedShare * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.90"
              step="0.05"
              value={avoidedShare}
              onChange={(e) => setAvoidedShare(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>20%</span>
              <span>90%</span>
            </div>
          </div>
        </div>

        {/* 3 Scenarios: Conservative, Base, Optimistic */}
        {savingsResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conservative */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conservative Scenario</span>
              <div className="text-2xl font-black text-slate-800">{savingsResults.conservative.hours_saved_per_month} hrs/mo</div>
              <p className="text-xs text-slate-600">Annual Saved: <strong className="font-mono">{savingsResults.conservative.annual_hours_saved} hrs</strong></p>
              <p className="text-xs text-slate-600">FTE Unlocked: <strong className="font-mono text-emerald-700">+{savingsResults.conservative.fte_capacity_unlocked} FTE</strong></p>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-0.5">
                {savingsResults.conservative.assumptions.map((a: string, i: number) => (
                  <p key={i}>• {a}</p>
                ))}
              </div>
            </div>

            {/* Base Case (Highlighted) */}
            <div className="p-4 bg-emerald-50/60 border-2 border-emerald-500 rounded-xl space-y-2 shadow-sm relative">
              <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                Primary Recommendation
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Base Case Scenario</span>
              <div className="text-3xl font-black text-emerald-800">{savingsResults.base.hours_saved_per_month} hrs/mo</div>
              <p className="text-xs text-emerald-900">Annual Saved: <strong className="font-mono">{savingsResults.base.annual_hours_saved} hrs</strong></p>
              <p className="text-xs text-emerald-900">FTE Unlocked: <strong className="font-mono text-emerald-800 text-sm">+{savingsResults.base.fte_capacity_unlocked} FTE</strong></p>
              <div className="text-[11px] text-emerald-800/80 border-t border-emerald-200/60 pt-2 space-y-0.5">
                {savingsResults.base.assumptions.map((a: string, i: number) => (
                  <p key={i}>• {a}</p>
                ))}
              </div>
            </div>

            {/* Optimistic */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Optimistic Scenario</span>
              <div className="text-2xl font-black text-slate-800">{savingsResults.optimistic.hours_saved_per_month} hrs/mo</div>
              <p className="text-xs text-slate-600">Annual Saved: <strong className="font-mono">{savingsResults.optimistic.annual_hours_saved} hrs</strong></p>
              <p className="text-xs text-slate-600">FTE Unlocked: <strong className="font-mono text-emerald-700">+{savingsResults.optimistic.fte_capacity_unlocked} FTE</strong></p>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-0.5">
                {savingsResults.optimistic.assumptions.map((a: string, i: number) => (
                  <p key={i}>• {a}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranked Recommendation Evidence Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Ranked Process Improvement Recommendations</span>
        </h2>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.recommendation_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                    #{rec.priority_rank}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
                    <span className="text-xs text-slate-400 font-mono">{rec.recommendation_id} • {rec.category}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    +{rec.projected_monthly_savings_hours} hrs/mo
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    {rec.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Observed Problem Statement:</span>
                  <p className="text-slate-800 leading-relaxed">{rec.problem_statement}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Empirical Event-Log Evidence:</span>
                  <p className="text-slate-800 leading-relaxed font-mono bg-slate-50 p-2 rounded border border-slate-100 text-[11px]">
                    {rec.supporting_evidence}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposed Intervention</span>
                  <span className="font-medium text-slate-800">{rec.proposed_intervention}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Implementation Effort</span>
                  <span className="font-semibold text-slate-800">{rec.implementation_effort}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Risk & Reversibility</span>
                  <span className="font-semibold text-slate-800">{rec.risk_assessment}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
