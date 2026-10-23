import React, { useState } from 'react';
import {
  X, CheckCircle, Clock, AlertTriangle, ArrowRight, ShieldAlert,
  User, Building, FileText, Send, RotateCcw, XCircle
} from 'lucide-react';

interface FlowTrackModalProps {
  detail: any;
  onClose: () => void;
  onTransition: (action: string, reason?: string) => Promise<void>;
}

const STAGES = [
  'Submitted',
  'Line Manager Review',
  'Finance Cost Center Review',
  'HR Ops Validation',
  'Department Head Approval',
  'System Processing',
  'Completed'
];

export const FlowTrackModal: React.FC<FlowTrackModalProps> = ({ detail, onClose, onTransition }) => {
  const [returnReason, setReturnReason] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const req = detail.request;
  const timeline = detail.timeline || [];
  const delayPred = detail.delay_prediction;
  const returnPred = detail.return_prediction;

  const currentStageIndex = STAGES.indexOf(req.current_state);
  const isTerminal = ['Completed', 'Cancelled'].includes(req.current_state);
  const isReturned = req.current_state === 'Returned for Correction';

  const handleAction = async (action: string) => {
    setActionError(null);
    if (action === 'RETURN' && !returnReason.trim()) {
      setActionError('A return reason is mandatory when returning a request for rework.');
      return;
    }
    setSubmittingAction(true);
    try {
      await onTransition(action, returnReason);
      setShowReturnInput(false);
      setReturnReason('');
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getRiskColor = (band: string) => {
    if (band === 'High') return 'bg-red-100 text-red-800 border-red-300';
    if (band === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-base font-bold bg-red-600 px-2.5 py-1 rounded text-white shadow-sm">
              {req.request_id}
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">{req.request_type}</h2>
              <p className="text-xs text-slate-400">Candidate: <span className="text-slate-200 font-mono">{req.candidate_id}</span> | Department: <span className="text-slate-200">{req.department}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Workflow Stepper */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">FlowTrack Stage Progress</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx && !isReturned;
                return (
                  <div
                    key={stage}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/20 shadow-sm'
                        : isPassed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {isPassed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] leading-tight font-medium block ${isCurrent ? 'font-bold text-blue-900' : ''}`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
            {isReturned && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>Returned for Correction:</strong> Request requires line manager action before it can re-enter review.
                </span>
              </div>
            )}
          </div>

          {/* Ownership & Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Ownership</span>
              <div className="mt-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-900">{req.current_owner_role}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Team: {req.current_owner_team}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Target & Duration</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-xl font-black text-slate-900">{req.total_elapsed_days}d</span>
                <span className="text-xs text-slate-500">of 5.0d SLA target</span>
              </div>
              <p className={`text-xs font-semibold mt-1 ${req.total_elapsed_days > 5.0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {req.total_elapsed_days > 5.0 ? 'Target SLA Breached' : 'Within Operational SLA'}
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Action Required</span>
              <p className="mt-2 text-sm font-semibold text-slate-800">{req.next_action}</p>
              <p className="text-xs text-slate-500 mt-1">Target Effective: {req.effective_date}</p>
            </div>
          </div>

          {/* Dual Predictive Risk Indicators (Responsible ML Section 11) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-slate-700" />
                <span>Predictive Risk Intelligence (Advisory Machine Learning)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Cutoff: Submission Features Only</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Return Risk */}
              {returnPred && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Return Risk (ReturnPredict_v1)</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskColor(returnPred.risk_band)}`}>
                      {returnPred.risk_band} Risk ({Math.round(returnPred.score * 100)}%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">Top Contributing Factors:</span>
                    {returnPred.top_factors?.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span>• {f.factor}</span>
                        <span className="text-slate-500">{f.direction}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <strong>Recommended Review:</strong> {returnPred.recommended_review_action}
                  </p>
                </div>
              )}

              {/* Delay Risk */}
              {delayPred && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">SLA Delay Risk (DelayPredict_v1)</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskColor(delayPred.risk_band)}`}>
                      {delayPred.risk_band} Risk ({Math.round(delayPred.score * 100)}%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">Top Contributing Factors:</span>
                    {delayPred.top_factors?.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span>• {f.factor}</span>
                        <span className="text-slate-500">{f.direction}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <strong>Recommended Review:</strong> {delayPred.recommended_review_action}
                  </p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * Governance Note: Risk predictions are strictly advisory statistical estimates. Authorized human experts retain all approval authority; predictions never independently alter workflow state.
            </p>
          </div>

          {/* Workflow Events Timeline Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Immutable Event Audit Timeline ({timeline.length} events)</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Event ID</th>
                    <th className="px-3 py-2 text-left">Stage</th>
                    <th className="px-3 py-2 text-left">Actor / Role</th>
                    <th className="px-3 py-2 text-left">Team</th>
                    <th className="px-3 py-2 text-left">Duration</th>
                    <th className="px-3 py-2 text-left">Outcome</th>
                    <th className="px-3 py-2 text-left">Reason / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {timeline.map((evt: any) => (
                    <tr key={evt.event_id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono text-slate-500">{evt.event_id}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{evt.stage}</td>
                      <td className="px-3 py-2 text-slate-600">{evt.actor_role}</td>
                      <td className="px-3 py-2 text-slate-500">{evt.team}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">{evt.duration_hours}h</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          evt.outcome === 'APPROVED' || evt.outcome === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : evt.outcome === 'RETURNED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {evt.outcome}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{evt.reason_code || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          {!isTerminal && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {actionError}
                </div>
              )}

              {showReturnInput ? (
                <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 space-y-3">
                  <label className="block text-xs font-bold text-red-900 uppercase tracking-wider">
                    Specify Mandatory Return Reason Code & Remarks:
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="">Select standard return reason code...</option>
                    <option value="Cost center / budget mismatch with finance ledger">Cost center / budget mismatch with finance ledger</option>
                    <option value="Missing mandatory airside security / medical clearance">Missing mandatory airside security / medical clearance</option>
                    <option value="Grade step jump exceeds +1 level without VP waiver">Grade step jump exceeds +1 level without VP waiver</option>
                    <option value="Incomplete business case justification">Incomplete business case justification</option>
                    <option value="Destination position already occupied (0.0 FTE vacant)">Destination position already occupied (0.0 FTE vacant)</option>
                    <option value="Target effective date is in the past or conflicts with roster period">Target effective date conflicts with roster period</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction('RETURN')}
                      disabled={submittingAction}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      {submittingAction ? 'Processing...' : 'Confirm Return for Correction'}
                    </button>
                    <button
                      onClick={() => setShowReturnInput(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Logged in as authorized HR / Line Approver
                  </div>
                  <div className="flex space-x-2">
                    {isReturned ? (
                      <button
                        onClick={() => handleAction('RESUBMIT')}
                        disabled={submittingAction}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resubmit After Corrections</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowReturnInput(true)}
                          disabled={submittingAction}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Return for Correction</span>
                        </button>
                        <button
                          onClick={() => handleAction('APPROVE')}
                          disabled={submittingAction}
                          className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Progress Stage</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
