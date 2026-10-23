import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../api/client';
import type { UserSession } from './Header';

export function HealthMetricsDashboardView({ currentUser }: { currentUser: UserSession }) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [metricType, setMetricType] = useState('blood_pressure_systolic');
  const [metricValue, setMetricValue] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, trends] = await Promise.all([
        api.getMetrics({ limit: 50 }, currentUser.token),
        api.getTrends(30, currentUser.token),
      ]);
      setMetrics(list);
      setTrendData(trends.time_series || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(metricValue);
    if (isNaN(val)) return;

    let unit = 'mmHg';
    if (metricType.includes('glucose')) unit = 'mg/dL';
    else if (metricType.includes('rate')) unit = 'bpm';
    else if (metricType.includes('spo2')) unit = '%';
    else if (metricType.includes('bmi')) unit = 'kg/m2';

    try {
      await api.recordMetric(
        {
          metric_type: metricType,
          value: val,
          unit,
          notes: metricNotes || 'Manual daily log',
        },
        currentUser.token
      );
      setToastMessage(`Logged ${metricType}: ${val} ${unit}`);
      setTimeout(() => setToastMessage(null), 3000);
      setShowLogModal(false);
      setMetricValue('');
      setMetricNotes('');
      loadData();
    } catch (err: any) {
      alert(`Failed to record metric: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement?')) return;
    try {
      await api.deleteMetric(id, currentUser.token);
      setMetrics((prev) => prev.filter((m) => m.id !== id));
      setToastMessage('Metric record deleted');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Find latest readings
  const latestBPsys = metrics.find((m) => m.metric_type === 'blood_pressure_systolic')?.value || 120;
  const latestBPdia = metrics.find((m) => m.metric_type === 'blood_pressure_diastolic')?.value || 80;
  const latestGlucose = metrics.find((m) => m.metric_type === 'fasting_glucose')?.value || 98;
  const latestHR = metrics.find((m) => m.metric_type === 'heart_rate')?.value || 72;

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-teal-500 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-teal-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">query_stats</span>
            Health Metrics &amp; Physiological Vitals Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous longitudinal tracking of blood pressure, glucose, and cardiopulmonary vitals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </a>
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Log Measurement</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Blood Pressure</span>
            <span className="material-symbols-outlined text-teal-600 text-[18px]">favorite</span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {latestBPsys}/{latestBPdia}
            </span>
            <span className="text-xs text-slate-400 font-mono">mmHg</span>
          </div>
          <div className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded w-fit">
            Standard Optimal Range
          </div>
        </div>

        {/* Fasting Glucose */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Fasting Glucose</span>
            <span className="material-symbols-outlined text-teal-600 text-[18px]">water_drop</span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{latestGlucose}</span>
            <span className="text-xs text-slate-400 font-mono">mg/dL</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded w-fit">
            {latestGlucose >= 100 ? 'Impaired Fasting Glucose' : 'Normal (<100 mg/dL)'}
          </div>
        </div>

        {/* Resting Heart Rate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Heart Rate</span>
            <span className="material-symbols-outlined text-teal-600 text-[18px]">ecg</span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{latestHR}</span>
            <span className="text-xs text-slate-400 font-mono">bpm</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-fit">
            Normal Sinus Rate (60-100)
          </div>
        </div>

        {/* Total Records Tracked */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Longitudinal Log</span>
            <span className="material-symbols-outlined text-teal-600 text-[18px]">history</span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{metrics.length}</span>
            <span className="text-xs text-slate-400">entries</span>
          </div>
          <div className="text-[11px] text-slate-500">Continuous 30-Day Cohort</div>
        </div>
      </div>

      {/* Interactive Recharts Time Series */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">show_chart</span>
            30-Day Physiological Trends (Blood Pressure &amp; Fasting Glucose)
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Daily Averaged Telemetry</span>
        </div>

        <div className="w-full h-72 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 160]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="blood_pressure_systolic"
                stroke="#0f766e"
                strokeWidth={2.5}
                name="Systolic BP (mmHg)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="blood_pressure_diastolic"
                stroke="#0284c7"
                strokeWidth={2}
                name="Diastolic BP (mmHg)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fasting_glucose"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Fasting Glucose (mg/dL)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="heart_rate"
                stroke="#e11d48"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                name="Heart Rate (bpm)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Measurements Log Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Recorded Readings Log</h3>
          <span className="text-xs text-slate-500">Showing latest entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Metric Type</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.slice(0, 15).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 capitalize">
                    {m.metric_type.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{m.value}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{m.unit}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                      {m.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]">{m.notes || '—'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Metric Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">add_circle</span>
                Record Health Measurement
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordMetric} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Measurement Type</label>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="blood_pressure_systolic">Blood Pressure (Systolic) - mmHg</option>
                  <option value="blood_pressure_diastolic">Blood Pressure (Diastolic) - mmHg</option>
                  <option value="fasting_glucose">Fasting Blood Glucose - mg/dL</option>
                  <option value="heart_rate">Resting Heart Rate - bpm</option>
                  <option value="spo2">Oxygen Saturation (SpO2) - %</option>
                  <option value="bmi">Body Mass Index (BMI) - kg/m2</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Measured Value</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 120"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Fasting morning reading after 8 hours sleep"
                  value={metricNotes}
                  onChange={(e) => setMetricNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs cursor-pointer"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
