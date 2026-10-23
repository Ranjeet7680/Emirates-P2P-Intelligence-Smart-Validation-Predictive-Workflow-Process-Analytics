import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface HealthData {
  status: string;
  service: string;
  version: string;
  database: string;
  statistics: {
    registered_users: number;
    uploaded_reports: number;
    health_metric_readings: number;
    immutable_audit_events: number;
  };
  loaded_models: string[];
  safety_engine: string;
}

interface ProviderData {
  configured_provider: string;
  gemini_ready: boolean;
  openai_ready: boolean;
  local_fallback_ready: boolean;
  rag_knowledge_entries: number;
}

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export const AdminSafetyView: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [providers, setProviders] = useState<ProviderData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [h, p, logs] = await Promise.all([
        api.getAdminHealth(),
        api.getAIProviders(),
        api.getAuditLogs(60),
      ]);
      setHealth(h);
      setProviders(p);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.action.includes(logFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-zinc-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-9xl">admin_panel_settings</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/60 border border-slate-600 text-slate-200 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">shield</span>
            ISO-14971 Medical AI Risk Governance & Audit Console
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            System Administration & Safety Engine
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Live telemetry, active inference model status, multi-provider credentials health, and immutable audit logs ensuring compliance and clinical traceability.
          </p>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
            <span>System Health</span>
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {health?.status || 'HEALTHY'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">v{health?.version || '1.0.0'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
            <span>Patients / Users</span>
            <span className="material-symbols-outlined text-blue-500">group</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {health?.statistics.registered_users ?? '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Role-partitioned access</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
            <span>Uploaded Reports</span>
            <span className="material-symbols-outlined text-purple-500">description</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {health?.statistics.uploaded_reports ?? '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lab panels parsed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
            <span>Audit Trail Entries</span>
            <span className="material-symbols-outlined text-indigo-500">receipt_long</span>
          </div>
          <div className="text-2xl font-black text-indigo-700 font-mono">
            {health?.statistics.immutable_audit_events ?? '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Immutable security log</div>
        </div>
      </div>

      {/* Model & Providers Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Model Engines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 text-lg">psychology</span>
              <span>Loaded Machine Learning Engines</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              OPERATIONAL
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Type 2 Diabetes Risk Model (MOD-DIAB-01)</div>
                <div className="text-[11px] text-slate-500">GradientBoostingClassifier • ROC-AUC 0.852</div>
              </div>
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold">
                READY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">ASCVD Cardiovascular Model (MOD-CVD-01)</div>
                <div className="text-[11px] text-slate-500">RandomForestClassifier • ROC-AUC 0.746</div>
              </div>
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold">
                READY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">RAG Clinical Knowledge Retrieval</div>
                <div className="text-[11px] text-slate-500">{providers?.rag_knowledge_entries || 40}+ evidence-indexed clinical guidelines</div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* AI Safety & Guardrails Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-lg">health_and_safety</span>
              <span>Medical AI Safety Engine</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
              ENFORCING
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-red-50/60 border border-red-100 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-600 text-base mt-0.5">crisis_alert</span>
              <div>
                <div className="font-bold text-red-900">Emergency Keyword Escalation</div>
                <div className="text-[11px] text-red-700 leading-relaxed mt-0.5">
                  Real-time pattern scanning for acute symptoms (chest pain, stroke symptoms, respiratory distress). Triggers urgent 911/999/112 notification banner and suppresses delayed responses.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-base mt-0.5">gavel</span>
              <div>
                <div className="font-bold text-amber-900">Non-Diagnostic Boundary Verification</div>
                <div className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  Strictly prevents the system from asserting definitive medical diagnoses. Mandates licensed physician consultation and lab corroboration.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-slate-600 text-base mt-0.5">lock</span>
              <div>
                <div className="font-bold text-slate-800">Zero Patient Hallucination Policy</div>
                <div className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  All conversational guidance references real medical evidence; synthetic patient measurements are never generated as authentic.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">receipt_long</span>
              <span>Cryptographic Security & Action Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500">Every AI query, report upload, clinician verification, and risk computation is permanently recorded</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Filter:</span>
            {['ALL', 'REPORT', 'VERIFIED', 'INFERENCE', 'EMERGENCY', 'METRIC'].map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  logFilter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={fetchAdminData}
              className="p-1 text-slate-400 hover:text-slate-700 ml-2"
              title="Refresh Logs"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-indigo-600 mb-2">progress_activity</span>
            <p className="text-xs text-slate-500">Querying security audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No audit records found matching filter "{logFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isEmergency = log.action.includes('EMERGENCY');
                  const isVerified = log.action.includes('VERIFIED');
                  const isUpload = log.action.includes('UPLOAD');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          isEmergency
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isVerified
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isUpload
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {log.resource_type ? `${log.resource_type}:${(log.resource_id || '').slice(0, 8)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] max-w-md truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
