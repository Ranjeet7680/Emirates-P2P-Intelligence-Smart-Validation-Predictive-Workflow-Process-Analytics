import React, { useState, useEffect } from 'react';
import {
  Database, Activity, ArrowRight, Layers, AlertTriangle, ShieldCheck,
  FileCheck, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';

export const BpiExplorer: React.FC = () => {
  const [bpiData, setBpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBpiOverview().then((data: any) => {
      setBpiData(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading BPI Challenge 2019 Process Mining analytics...</div>;
  }

  if (!bpiData || bpiData.error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
        {bpiData?.error || 'Failed to load BPI 2019 summary.'}
      </div>
    );
  }

  const eventChartData = Object.entries(bpiData.event_distribution || {})
    .slice(0, 8)
    .map(([name, count]) => ({
      activity: name.length > 22 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      count
    }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded">
            IEEE BENCHMARK DATASET
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Enterprise Process Mining — BPI Challenge 2019 Log
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Demonstrating enterprise process mining, 3-way matching, bottleneck discovery, and loop analysis on the real-world 503MB IEEE BPI Challenge 2019 SAP dataset.
        </p>
      </div>

      {/* Dataset Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analyzed SAP Events</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{bpiData.analyzed_events?.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Indexed from 503MB event log</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Distinct P2P Cases</span>
          <div className="mt-2 text-2xl font-black text-blue-700">{bpiData.analyzed_cases?.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">Purchase orders & line items</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unique Activity Classes</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{bpiData.unique_activity_types}</div>
          <p className="text-xs text-slate-500 mt-1">PO, GR, Invoicing & Blocks</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Median Case Lead Time</span>
          <div className="mt-2 text-2xl font-black text-amber-600">{bpiData.median_case_duration_days} days</div>
          <p className="text-xs text-slate-500 mt-1">End-to-end invoice clearing</p>
        </div>
      </div>

      {/* 3-Way Matching Rework Indicators */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>3-Way Matching & Process Inefficiency Indicators (BPI 2019)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-900 font-bold block">Payment Blocks Triggered</span>
            <span className="text-xl font-black text-red-700">{bpiData.rework_indicators?.payment_blocks_encountered?.toLocaleString()}</span>
            <p className="text-[11px] text-red-600 mt-0.5">Price or quantity variance holds</p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-900 font-bold block">PO Quantity Changes</span>
            <span className="text-xl font-black text-amber-700">{bpiData.rework_indicators?.quantity_changes_count?.toLocaleString()}</span>
            <p className="text-[11px] text-amber-600 mt-0.5">Post-issuance order amendments</p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-purple-900 font-bold block">PO Price Changes</span>
            <span className="text-xl font-black text-purple-700">{bpiData.rework_indicators?.price_changes_count?.toLocaleString()}</span>
            <p className="text-[11px] text-purple-600 mt-0.5">Master data renegotiations</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-900 font-bold block">Vendor Invoices Processed</span>
            <span className="text-xl font-black text-blue-700">{bpiData.rework_indicators?.vendor_invoices_count?.toLocaleString()}</span>
            <p className="text-[11px] text-blue-600 mt-0.5">Direct supplier invoice receipts</p>
          </div>
        </div>
      </div>

      {/* Top Activities Distribution Chart & Transitions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Top SAP Activity Volume Distribution</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventChartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="activity" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any) => [`${val.toLocaleString()} events`, 'Volume']} />
                <Bar dataKey="count" fill="#0B192C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Transitions Table */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Most Frequent Activity Handovers</span>
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {bpiData.top_transitions?.slice(0, 7).map((t: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] flex items-center justify-between">
                <div className="space-y-0.5 truncate max-w-[240px]">
                  <span className="text-slate-800 font-semibold block truncate">{t.from_event}</span>
                  <div className="flex items-center space-x-1 text-slate-400">
                    <ArrowRight className="w-3 h-3 text-red-500" />
                    <span className="text-slate-600 truncate">{t.to_event}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs shrink-0">
                  {t.frequency?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
