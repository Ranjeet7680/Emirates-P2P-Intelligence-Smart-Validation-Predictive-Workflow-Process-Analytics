import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

interface Measurement {
  id: string;
  test_name: string;
  value_numeric?: number;
  value_text?: string;
  units?: string;
  reference_low?: number;
  reference_high?: number;
  flag?: string;
  confidence_score: number;
}

interface ReportSummary {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  status: string;
  extracted_summary?: string;
  clinical_notes?: string;
  test_date?: string;
  laboratory_name?: string;
  created_at: string;
  measurements: Measurement[];
}

export const ClinicianWorkspaceView: React.FC = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getClinicianQueue();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
        setClinicalNotes(data[0].clinical_notes || '');
      }
    } catch (err: any) {
      console.error('Failed to load clinician queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectReport = (r: ReportSummary) => {
    setSelectedReport(r);
    setClinicalNotes(r.clinical_notes || '');
    setFeedback(null);
  };

  const handleVerify = async () => {
    if (!selectedReport) return;
    if (!clinicalNotes.trim()) {
      alert('Please enter your clinical impression and sign-off notes before verifying.');
      return;
    }
    setVerifying(true);
    try {
      await api.verifyReport(selectedReport.id, clinicalNotes);
      setFeedback('Report verified successfully and signed with clinical credentials.');
      // Refresh list
      const updatedReports = reports.map((r) =>
        r.id === selectedReport.id
          ? { ...r, status: 'verified', clinical_notes: clinicalNotes }
          : r
      );
      setReports(updatedReports);
      setSelectedReport({ ...selectedReport, status: 'verified', clinical_notes: clinicalNotes });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const pendingCount = reports.filter((r) => r.status !== 'verified').length;
  const verifiedCount = reports.filter((r) => r.status === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-700 animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-sm">verified</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-9xl">stethoscope</span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold mb-3">
            <span className="material-symbols-outlined text-sm">clinical_notes</span>
            Clinical Decision Support & Review Queue
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            Clinician Review Workspace
          </h1>
          <p className="text-teal-100 text-sm leading-relaxed">
            Secondary verification portal for physicians and pathologists. Review AI-extracted laboratory telemetry, correct discrepancies, and affix binding clinical interpretation signatures.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">assignment</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{reports.length}</div>
            <div className="text-xs text-slate-500">Total Patient Reports</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-700">{pendingCount}</div>
            <div className="text-xs text-slate-500">Awaiting Physician Sign-Off</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">{verifiedCount}</div>
            <div className="text-xs text-slate-500">Clinically Verified & Locked</div>
          </div>
        </div>
      </div>

      {/* Review Layout: Queue on Left, Detail & Sign-off on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Queue List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Verification Queue ({reports.length})
            </h3>
            <button
              onClick={fetchQueue}
              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <span className="material-symbols-outlined animate-spin text-3xl text-blue-600 mb-2">progress_activity</span>
              <p className="text-xs text-slate-500">Loading queue...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">done_all</span>
              <p className="text-xs text-slate-500 font-medium">All reports reviewed!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {reports.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                const abnormalCount = r.measurements.filter((m) => m.flag && m.flag !== 'NORMAL').length;
                const isVerified = r.status === 'verified';

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 text-xs line-clamp-1">{r.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 mb-2">
                      <div>Lab: {r.laboratory_name || 'Standard Diagnostics'}</div>
                      <div>Date: {r.test_date || new Date(r.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                      <span className="font-mono text-slate-400">{r.measurements.length} analytes</span>
                      {abnormalCount > 0 ? (
                        <span className="text-red-600 font-semibold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span>
                          {abnormalCount} abnormal
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Normal panel</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Report Inspection & Sign-off Pane */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              {/* Report Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedReport.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                      selectedReport.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedReport.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Laboratory: <span className="text-slate-700 font-medium">{selectedReport.laboratory_name || 'Standard PathLab'}</span> • Date: <span className="text-slate-700 font-medium">{selectedReport.test_date || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={api.getPdfSummaryUrl(selectedReport.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    <span>Download Summary PDF</span>
                  </a>
                </div>
              </div>

              {/* Lab Summary */}
              {selectedReport.extracted_summary && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Automated Extracted Summary
                  </h4>
                  <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedReport.extracted_summary}
                  </div>
                </div>
              )}

              {/* Analytes / Lab Measurements Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Report Analytes ({selectedReport.measurements.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Reference Intervals</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Test / Analyte</th>
                        <th className="py-2.5 px-3">Result</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Reference Interval</th>
                        <th className="py-2.5 px-3">Clinical Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReport.measurements.map((m) => {
                        const isAbnormal = m.flag && m.flag !== 'NORMAL';
                        return (
                          <tr key={m.id} className={isAbnormal ? 'bg-red-50/40' : 'hover:bg-slate-50'}>
                            <td className="py-2 px-3 font-medium text-slate-800">{m.test_name}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                              {m.value_numeric ?? m.value_text ?? '—'}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{m.units || '—'}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {m.reference_low !== undefined && m.reference_high !== undefined
                                ? `${m.reference_low} - ${m.reference_high}`
                                : 'See standard'}
                            </td>
                            <td className="py-2 px-3">
                              {isAbnormal ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  {m.flag}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical Verification & Sign-Off Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-teal-600 text-base">draw</span>
                    Physician Clinical Impression & Instructions
                  </h4>
                  {selectedReport.status === 'verified' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Signed by Attending Clinician
                    </span>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter clinical assessment, differential diagnosis considerations, and recommendations for patient follow-up..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Verification creates an immutable cryptographic audit event.
                  </span>

                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  >
                    {verifying ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        <span>Signing...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>{selectedReport.status === 'verified' ? 'Update & Re-Sign' : 'Sign & Verify Report'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">assignment_turned_in</span>
              <p className="text-sm text-slate-500 font-medium">Select a patient report from the queue to begin review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
