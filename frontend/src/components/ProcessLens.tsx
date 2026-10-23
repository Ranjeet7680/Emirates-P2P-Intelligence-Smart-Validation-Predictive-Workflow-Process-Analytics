import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  GitCommit, Clock, Repeat, AlertOctagon, TrendingUp, Layers, CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';

export const ProcessLens: React.FC = () => {
  const [overview, setOverview] = useState<any>({});
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [returnLoops, setReturnLoops] = useState<any>({});
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAnalyticsOverview(),
      api.getBottlenecks(),
      api.getReturnLoops(),
      api.getProcessVariants()
    ]).then(([ov, bn, lp, vr]) => {
      setOverview(ov);
      setBottlenecks(bn);
      setReturnLoops(lp);
      setVariants(vr);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const COLORS = ['#D71921', '#0B192C', '#008080', '#D4AF37', '#64748B'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ProcessLens — Process Mining & Bottleneck Discovery</h1>
        <p className="text-sm text-slate-500">
          Empirical event-log path reconstruction, stage duration percentiles, and return rework cycle quantification.
        </p>
      </div>

      {/* Operational North-Star Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">First-Time-Right Rate</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{overview.first_time_right_rate}%</div>
          <p className="text-xs text-slate-500 mt-1">Completed without returns</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avoidable Return Rate</span>
          <div className="mt-2 text-2xl font-black text-red-600">{overview.avoidable_return_rate}%</div>
          <p className="text-xs text-red-600 font-semibold mt-1">Target for SmartCheck</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Median Elapsed Time</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{overview.median_elapsed_days}d</div>
          <p className="text-xs text-slate-500 mt-1">Benchmark: 5.0d SLA</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">90th Percentile (P90)</span>
          <div className="mt-2 text-2xl font-black text-amber-600">{overview.p90_elapsed_days}d</div>
          <p className="text-xs text-slate-500 mt-1">Tail latency outlier requests</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target SLA Breach Rate</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{overview.target_time_breach_rate}%</div>
          <p className="text-xs text-slate-500 mt-1">Requests exceeding 5 days</p>
        </div>
      </div>

      {/* Stage Duration & Bottleneck Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Stage Wait Time Distribution (Median vs P90 Duration)</span>
            </h3>
            <span className="text-xs text-slate-400">Hours in Stage</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottlenecks} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <XAxis type="number" unit="h" />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} hours`, name === 'median_duration_hours' ? 'Median Duration' : 'P90 Duration']}
                />
                <Bar dataKey="median_duration_hours" fill="#1E3E62" name="Median Hours" radius={[0, 4, 4, 0]} />
                <Bar dataKey="p90_duration_hours" fill="#D71921" name="P90 Hours" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500">
            Observation: <strong>HR Ops Validation</strong> and <strong>Finance Review</strong> exhibit high median wait times and severe P90 tail inflation due to unverified prerequisites.
          </p>
        </div>

        {/* Return Reasons Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Repeat className="w-4 h-4 text-red-600" />
              <span>Return-Loop Root Causes ({returnLoops.total_return_loops_detected} Loops)</span>
            </h3>
          </div>

          <div className="space-y-2">
            {returnLoops.top_return_reasons?.map((r: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                <span className="text-slate-800 font-medium truncate max-w-[260px]">{r.reason}</span>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="font-mono font-bold text-slate-900">{r.count}</span>
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    {r.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs text-red-900">
            <strong>Key Process Finding:</strong> {returnLoops.actionable_insight}
          </div>
        </div>
      </div>

      {/* Process Mining Path Variants */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Observed Process Path Variants & Rework Cycles</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Total Cases: {overview.completed_requests}</span>
        </div>

        <div className="space-y-3">
          {variants.map((v: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                v.is_conforming
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800">Variant #{idx + 1}: {v.classification}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    v.is_conforming ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {v.percentage}% of all cases ({v.frequency} requests)
                  </span>
                </div>
                {v.is_conforming ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                {v.path_sequence.map((step: string, sIdx: number) => {
                  const isReturn = step.includes('Returned') || step.includes('Resubmitted');
                  return (
                    <React.Fragment key={sIdx}>
                      <span className={`px-2 py-1 rounded font-semibold border ${
                        isReturn
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                      }`}>
                        {step}
                      </span>
                      {sIdx < v.path_sequence.length - 1 && (
                        <span className="text-slate-400 font-bold">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
