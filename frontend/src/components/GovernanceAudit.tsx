import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, FileText, Download, Database, CheckCircle,
  AlertTriangle, Lock, Eye, Cpu, RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

export const GovernanceAudit: React.FC = () => {
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [modelRegistry, setModelRegistry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAuditEvents({ limit: 50 }),
      api.getRules(),
      api.getModelRegistry()
    ]).then(([evts, rls, reg]) => {
      setAuditEvents(evts);
      setRules(rls);
      setModelRegistry(reg);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDownloadExport = () => {
    window.open(api.getExportPredictionsUrl(), '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security, Governance & Model Registry</h1>
          <p className="text-sm text-slate-500">
            Append-only audit trail, responsible AI model registry, and organizer-schema prediction export.
          </p>
        </div>
        <button
          onClick={handleDownloadExport}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Predictions CSV (Organizer Schema)</span>
        </button>
      </div>

      {/* Model Cards & Governance Posture */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>Responsible AI Model Registry & Held-Out Performance</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Zero-Leakage Submission Features</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modelRegistry?.models?.map((m: any) => (
            <div key={m.model_id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{m.model_id}</span>
                  <p className="text-[10px] text-slate-500 font-mono">{m.algorithm} • v{m.version}</p>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                  PINNED MODEL
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-600 text-[10px] uppercase">Target Label:</span>
                <p className="font-mono text-slate-800 text-[11px] bg-white p-1.5 rounded border border-slate-200">{m.target}</p>
              </div>

              {/* Metrics Table */}
              <div className="grid grid-cols-3 gap-2 text-center bg-white p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Test ROC-AUC</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{m.metrics?.test_roc_auc}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Test F1-Score</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{m.metrics?.test_f1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Brier Score</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">{m.metrics?.brier_score}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-0.5">
                <span className="font-bold text-slate-600 text-[10px] uppercase block">Top Contributing Feature Importances:</span>
                {m.metrics?.top_features?.slice(0, 4).map((f: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>• {f.feature}</span>
                    <span className="font-mono font-semibold">{Math.round(f.importance * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SmartCheck Rules Catalogue */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SmartCheck Versioned Rules Catalogue ({rules.length} Rules)</span>
        </h2>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2 text-left">Rule ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Severity</th>
                <th className="px-3 py-2 text-left">Scope</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Correction Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rules.map((r) => (
                <tr key={r.rule_id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 font-mono font-bold text-slate-900">{r.rule_id}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{r.name}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{r.request_types?.join(', ')}</td>
                  <td className="px-3 py-2 text-slate-700">{r.description}</td>
                  <td className="px-3 py-2 text-slate-500 italic">{r.correction_hint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Append-Only Audit Log */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Append-Only Governance & Audit Trail</span>
        </h2>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2 text-left">Audit ID</th>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Object Type</th>
                <th className="px-3 py-2 text-left">Target ID</th>
                <th className="px-3 py-2 text-left">Timestamp</th>
                <th className="px-3 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {auditEvents.map((a) => (
                <tr key={a.audit_id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                  <td className="px-3 py-2 font-bold text-slate-900">{a.audit_id}</td>
                  <td className="px-3 py-2 text-slate-700 font-sans">{a.actor}</td>
                  <td className="px-3 py-2 font-bold text-blue-700">{a.action}</td>
                  <td className="px-3 py-2 text-slate-500">{a.object_type}</td>
                  <td className="px-3 py-2 text-slate-800">{a.object_id}</td>
                  <td className="px-3 py-2 text-slate-500">{a.timestamp ? a.timestamp.substring(0, 19).replace('T', ' ') : '—'}</td>
                  <td className="px-3 py-2 text-slate-600 font-sans max-w-xs truncate">{a.details_json || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
