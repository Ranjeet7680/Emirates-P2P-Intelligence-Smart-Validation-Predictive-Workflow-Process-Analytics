import React, { useState, useEffect } from 'react';
import {
  FilePlus, CheckCircle, AlertTriangle, XCircle, Search,
  ArrowRight, ShieldCheck, RefreshCw, Eye, Sparkles
} from 'lucide-react';
import { api } from '../api/client';

interface ManagerPortalProps {
  onOpenDetail: (requestId: string) => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({ onOpenDetail }) => {
  const [positions, setPositions] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Form State
  const [requestType, setRequestType] = useState('Position-to-Person Assignment');
  const [candidateId, setCandidateId] = useState('EMP-EK-88204');
  const [currentGrade, setCurrentGrade] = useState('EK-07');
  const [targetGrade, setTargetGrade] = useState('EK-08');
  const [selectedPosId, setSelectedPosId] = useState('');
  const [department, setDepartment] = useState('Flight Operations');
  const [costCenter, setCostCenter] = useState('CC-100401');
  const [effectiveDate, setEffectiveDate] = useState('2026-12-01');
  const [clearanceRef, setClearanceRef] = useState('GCAA-MED-7712');
  const [isSafetyCritical, setIsSafetyCritical] = useState(true);

  // Validation State
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // Load positions on mount
  useEffect(() => {
    api.getPositions().then((data: any) => {
      setPositions(data);
      if (data.length > 0) {
        setSelectedPosId(data[0].position_id);
        setDepartment(data[0].department);
        setCostCenter(data[0].cost_center);
        setTargetGrade(data[0].grade);
        setIsSafetyCritical(data[0].is_safety_critical);
      }
    }).catch(console.error);

    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    setLoadingReqs(true);
    try {
      const data = await api.getRequests({ limit: 15 });
      setMyRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReqs(false);
    }
  };

  // Run SmartCheck validation whenever form values change
  useEffect(() => {
    if (!selectedPosId) return;
    setValidating(true);
    const timer = setTimeout(() => {
      api.validateRequest({
        request_type: requestType,
        candidate_id: candidateId,
        current_grade: currentGrade,
        target_grade: targetGrade,
        destination_position_id: selectedPosId,
        department: department,
        cost_center: costCenter,
        effective_date: effectiveDate,
        clearance_reference: clearanceRef,
        is_safety_critical: isSafetyCritical
      }).then((res: any) => {
        setValidationResult(res);
      }).catch(console.error).finally(() => setValidating(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [requestType, candidateId, currentGrade, targetGrade, selectedPosId, department, costCenter, effectiveDate, clearanceRef, isSafetyCritical]);

  const handlePositionSelect = (posId: string) => {
    setSelectedPosId(posId);
    const match = positions.find(p => p.position_id === posId);
    if (match) {
      setDepartment(match.department);
      setCostCenter(match.cost_center);
      setTargetGrade(match.grade);
      setIsSafetyCritical(match.is_safety_critical);
    }
  };

  const handlePreset = (type: string) => {
    setSubmissionSuccess(null);
    if (type === 'valid') {
      const vacantPos = positions.find(p => p.current_fte_filled < p.fte_capacity && p.active_flag) || positions[0];
      setSelectedPosId(vacantPos.position_id);
      setDepartment(vacantPos.department);
      setCostCenter(vacantPos.cost_center);
      setTargetGrade(vacantPos.grade);
      setCurrentGrade(vacantPos.grade);
      setEffectiveDate('2026-12-15');
      setClearanceRef('GCAA-MED-9944');
      setIsSafetyCritical(vacantPos.is_safety_critical);
    } else if (type === 'grade_jump') {
      // Jump +4 grades
      setCurrentGrade('EK-04');
      setTargetGrade('EK-09');
    } else if (type === 'missing_clearance') {
      setIsSafetyCritical(true);
      setClearanceRef('');
    } else if (type === 'cc_mismatch') {
      setCostCenter('CC-999999-INVALID');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationResult && validationResult.has_blocking_errors) return;

    setSubmitting(true);
    setSubmissionSuccess(null);
    try {
      const created: any = await api.createRequest({
        request_type: requestType,
        candidate_id: candidateId,
        current_grade: currentGrade,
        target_grade: targetGrade,
        destination_position_id: selectedPosId,
        department: department,
        cost_center: costCenter,
        effective_date: effectiveDate,
        clearance_reference: clearanceRef,
        is_safety_critical: isSafetyCritical
      });
      setSubmissionSuccess(`Request ${created.request_id} submitted successfully! Received canonical reference ID.`);
      loadMyRequests();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manager Request Portal</h1>
          <p className="text-sm text-slate-500">
            Submit "Right First Time" Position-to-Person requests with real-time SmartCheck policy enforcement.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Demo Scenarios:</span>
          <button
            onClick={() => handlePreset('valid')}
            className="px-2.5 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-md transition-colors"
          >
            ✓ Valid Pass
          </button>
          <button
            onClick={() => handlePreset('grade_jump')}
            className="px-2.5 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-md transition-colors"
          >
            ✗ Grade Jump (+4)
          </button>
          <button
            onClick={() => handlePreset('missing_clearance')}
            className="px-2.5 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-md transition-colors"
          >
            ✗ Missing Clearance
          </button>
          <button
            onClick={() => handlePreset('cc_mismatch')}
            className="px-2.5 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-md transition-colors"
          >
            ✗ CC Mismatch
          </button>
        </div>
      </div>

      {submissionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{submissionSuccess}</span>
          </div>
          <button onClick={() => setSubmissionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form on Left, SmartCheck Live Validation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Guided Request Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <FilePlus className="w-4 h-4 text-red-600" />
              <span>Position-to-Person Guided Creation</span>
            </h2>
            <span className="text-xs text-slate-400">Step 1 of 2: Submission Details</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="Position-to-Person Assignment">Position-to-Person Assignment</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Transfer">Transfer</option>
                  <option value="New Joiner Assignment">New Joiner Assignment</option>
                  <option value="Position Reclassification">Position Reclassification</option>
                  <option value="Secondment">Secondment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Candidate ID / Staff No.</label>
                <input
                  type="text"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            {/* Position Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Destination Position (Active Catalog)
              </label>
              <select
                value={selectedPosId}
                onChange={(e) => handlePositionSelect(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono"
              >
                {positions.map((p) => (
                  <option key={p.position_id} value={p.position_id}>
                    {p.position_id} — {p.job_title} ({p.department} | {p.grade} | CC: {p.cost_center} | Filled: {p.current_fte_filled}/{p.fte_capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Grades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Staff Grade</label>
                <select
                  value={currentGrade}
                  onChange={(e) => setCurrentGrade(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {['EK-04', 'EK-05', 'EK-06', 'EK-07', 'EK-08', 'EK-09', 'EK-10', 'EK-11', 'EK-12'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Position Grade</label>
                <select
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {['EK-04', 'EK-05', 'EK-06', 'EK-07', 'EK-08', 'EK-09', 'EK-10', 'EK-11', 'EK-12'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department & Cost Center */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destination Department</label>
                <input
                  type="text"
                  value={department}
                  readOnly
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cost Center Code</label>
                <input
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            {/* Effective Date & Clearance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Effective Date (&ge; 14d target)
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Airside Security / Medical Clearance Ref
                </label>
                <input
                  type="text"
                  value={clearanceRef}
                  onChange={(e) => setClearanceRef(e.target.value)}
                  placeholder="e.g. GCAA-MED-9944"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (validationResult && validationResult.has_blocking_errors)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 ${
                  validationResult && validationResult.has_blocking_errors
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                }`}
              >
                {submitting ? (
                  <span>Authorizing Submission...</span>
                ) : validationResult && validationResult.has_blocking_errors ? (
                  <span>Resolve {validationResult.error_count} Blocking Error(s) to Submit</span>
                ) : (
                  <>
                    <span>Submit P2P Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SmartCheck Real-Time Validation Feedback Engine */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SmartCheck Pre-Submission Engine</span>
              </h3>
              {validating ? (
                <span className="text-[10px] text-blue-600 animate-pulse font-mono">Checking...</span>
              ) : validationResult && validationResult.valid ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ALL RULES PASSED
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  {validationResult?.error_count || 0} BLOCKING ERRORS
                </span>
              )}
            </div>

            {validationResult ? (
              <div className="space-y-3">
                {validationResult.valid ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold">First-Time-Right Verification Complete</span>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Request passes all deterministic organizational checks (P2P-REQ-001 through 008). Zero rework risk detected.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {validationResult.findings.map((f: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          f.severity === 'error'
                            ? 'bg-red-50/80 border-red-200 text-red-900'
                            : 'bg-amber-50/80 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[11px] bg-white/80 px-1.5 py-0.5 rounded border border-current">
                            {f.rule_id}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {f.severity === 'error' ? 'Blocking Error' : 'Policy Warning'}
                          </span>
                        </div>
                        <p className="font-semibold text-xs">{f.message}</p>
                        <p className="text-[11px] opacity-90 italic">
                          <strong>Fix Hint:</strong> {f.correction_hint}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rules Checklist */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">Deterministic Rule Coverage:</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span>• P2P-REQ-001: Position Active</span>
                    <span>• P2P-REQ-002: FTE Vacancy</span>
                    <span>• P2P-REQ-003: Grade Progression</span>
                    <span>• P2P-REQ-004: Cost Center Code</span>
                    <span>• P2P-REQ-005: 14d Lead Time</span>
                    <span>• P2P-REQ-006: Airside Clearance</span>
                    <span>• P2P-REQ-007: Release Endorsement</span>
                    <span>• P2P-REQ-008: Circular Line Check</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Evaluating submission parameters...</p>
            )}
          </div>
        </div>

      </div>

      {/* My Submitted Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Requests & Lifecycle Tracking</h3>
            <p className="text-xs text-slate-500">Live operational status, current owners, and audit timelines.</p>
          </div>
          <button
            onClick={loadMyRequests}
            disabled={loadingReqs}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingReqs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Request ID</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Destination Pos</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Current Stage</th>
                <th className="px-4 py-3 text-left">Current Owner</th>
                <th className="px-4 py-3 text-left">Elapsed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {myRequests.map((r) => (
                <tr key={r.request_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.request_id}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{r.request_type}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{r.candidate_id}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{r.destination_position_id}</td>
                  <td className="px-4 py-3 text-slate-600">{r.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.current_state === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.current_state === 'Returned for Correction'
                        ? 'bg-red-100 text-red-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {r.current_state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.current_owner_role}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">{r.total_elapsed_days}d</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenDetail(r.request_id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>FlowTrack</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
