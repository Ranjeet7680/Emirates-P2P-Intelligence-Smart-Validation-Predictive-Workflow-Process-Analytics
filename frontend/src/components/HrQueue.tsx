import React, { useState, useEffect } from 'react';
import {
  Filter, ShieldAlert, Clock, UserCheck, AlertTriangle, Eye, RefreshCw, CheckCircle
} from 'lucide-react';
import { api } from '../api/client';

interface HrQueueProps {
  onOpenDetail: (requestId: string) => void;
}

export const HrQueue: React.FC<HrQueueProps> = ({ onOpenDetail }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageFilter, setStageFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [stageFilter, riskFilter, deptFilter, unassignedOnly]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getHrQueue({
        stage: stageFilter || undefined,
        risk: riskFilter || undefined,
        department: deptFilter || undefined,
        unassigned_only: unassignedOnly
      });
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = queue.filter(r => r.composite_risk_band === 'High').length;
  const breachedCount = queue.filter(r => r.total_elapsed_days > 5.0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HR Operations Triage Queue</h1>
          <p className="text-sm text-slate-500">
            Intelligent triage queue with real-time risk indicators, SLA tracking, and audit drill-down.
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Queue Items</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{queue.length}</div>
          <p className="text-xs text-slate-500 mt-1">Pending operational decisions</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Elevated Risk Items</span>
          <div className="mt-2 text-2xl font-black text-red-600">{highRiskCount}</div>
          <p className="text-xs text-red-600 font-semibold mt-1">Flagged by Delay/Return ML</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Target Breaches</span>
          <div className="mt-2 text-2xl font-black text-amber-600">{breachedCount}</div>
          <p className="text-xs text-slate-500 mt-1">Elapsed &gt; 5.0 working days</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Governance Posture</span>
          <div className="mt-2 text-sm font-bold text-emerald-700 flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Human-in-the-Loop</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Predictions advisory only</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </span>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Active Stages</option>
          <option value="Submitted">Submitted</option>
          <option value="Line Manager Review">Line Manager Review</option>
          <option value="Finance Cost Center Review">Finance Cost Center Review</option>
          <option value="HR Ops Validation">HR Ops Validation</option>
          <option value="Department Head Approval">Department Head Approval</option>
          <option value="Returned for Correction">Returned for Correction</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Risk Bands</option>
          <option value="High">High Risk Only</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Departments</option>
          <option value="Flight Operations">Flight Operations</option>
          <option value="In-flight Services">In-flight Services</option>
          <option value="Engineering & Maintenance">Engineering & Maintenance</option>
          <option value="Airport Operations">Airport Operations</option>
          <option value="Commercial & Revenue">Commercial & Revenue</option>
          <option value="Group IT">Group IT</option>
          <option value="Human Resources">Human Resources</option>
        </select>

        <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium ml-auto">
          <input
            type="checkbox"
            checked={unassignedOnly}
            onChange={(e) => setUnassignedOnly(e.target.checked)}
            className="rounded text-red-600 focus:ring-red-500"
          />
          <span>Show Unassigned Owners Only</span>
        </label>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Request ID</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Current Stage</th>
                <th className="px-4 py-3 text-left">Current Owner</th>
                <th className="px-4 py-3 text-left">Age / SLA</th>
                <th className="px-4 py-3 text-left">ML Risk Band</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {queue.map((r) => (
                <tr key={r.request_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.request_id}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{r.request_type}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{r.candidate_id}</td>
                  <td className="px-4 py-3 text-slate-600">{r.department}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.current_state}</td>
                  <td className="px-4 py-3 text-slate-600">{r.current_owner_role}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${r.total_elapsed_days > 5.0 ? 'text-red-600' : 'text-slate-700'}`}>
                      {r.total_elapsed_days}d
                    </span>
                    <span className="text-slate-400 text-[10px] ml-1">/ 5d</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.composite_risk_band === 'High'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : r.composite_risk_band === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {r.composite_risk_band} Risk
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenDetail(r.request_id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] inline-flex items-center space-x-1 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Triage</span>
                    </button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No requests found matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
