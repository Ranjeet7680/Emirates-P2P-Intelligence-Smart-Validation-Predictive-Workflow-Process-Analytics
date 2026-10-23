import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { UserSession } from './Header';

export function MedicalReportAnalyzerView({ currentUser }: { currentUser: UserSession }) {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingMeas, setEditingMeas] = useState<any | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.listReports(currentUser.token);
      setReports(data);
      if (data.length > 0) {
        setSelectedReport(data[0]);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', `Lab Report - ${file.name.replace(/\.[^/.]+$/, '')}`);
    fd.append('laboratory_name', 'Automated Outpatient Workup');

    try {
      const newReport = await api.uploadReport(fd, currentUser.token);
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setToastMessage(`Report "${file.name}" uploaded and parsed successfully!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!selectedReport || !editingMeas) return;
    const num = parseFloat(editValue);
    if (isNaN(num)) return;

    try {
      await api.correctMeasurement(selectedReport.id, editingMeas.id, { value_numeric: num }, currentUser.token);
      setToastMessage(`Corrected ${editingMeas.test_name} to ${num} ${editingMeas.units}`);
      setTimeout(() => setToastMessage(null), 3000);

      // Refresh report
      const updated = await api.getReportDetail(selectedReport.id, currentUser.token);
      setSelectedReport(updated);
      setEditingMeas(null);
    } catch (err: any) {
      alert(`Correction failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-teal-500 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-teal-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Upload Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">document_scanner</span>
            AI Medical Report Analyzer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated PDF &amp; image OCR parsing, reference interval alignment, and clinical biomarker extraction
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>{uploading ? 'Parsing Document...' : 'Upload Medical Report (PDF)'}</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Report Selection Strip */}
      {reports.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Reports:</span>
          {reports.map((r) => {
            const active = selectedReport?.id === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReport(r)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                  active
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-teal-600">article</span>
                <span className="truncate max-w-[200px]">{r.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">({r.test_date || 'Recent'})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Analysis View */}
      {selectedReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Parsed Lab Measurements Table (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedReport.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Lab: {selectedReport.laboratory_name || 'Central Lab'}</span>
                  <span>•</span>
                  <span>Extracted: {selectedReport.measurements?.length || 0} biomarkers</span>
                  <span>•</span>
                  <span className="text-teal-700 font-semibold">Status: {selectedReport.status}</span>
                </div>
              </div>

              <a
                href={api.getPdfSummaryUrl(selectedReport.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-teal-600">picture_as_pdf</span>
                <span>Download Clinical PDF</span>
              </a>
            </div>

            {/* Extracted Summary Callout */}
            {selectedReport.extracted_summary && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-teal-600 shrink-0 mt-0.5">summarize</span>
                <p className="leading-relaxed">{selectedReport.extracted_summary}</p>
              </div>
            )}

            {/* Measurements Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4">Test Name</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Ref. Range</th>
                    <th className="py-2.5 px-3 text-center">Flag</th>
                    <th className="py-2.5 px-3 text-center">Confidence</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {(selectedReport.measurements || []).map((m: any) => {
                    const isHigh = m.flag === 'HIGH';
                    const isCrit = m.flag === 'CRITICAL';
                    const isLow = m.flag === 'LOW';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{m.test_name}</div>
                          <div className="text-[10px] text-slate-400">{m.category}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {m.value_numeric}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{m.units}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {m.ref_low !== null && m.ref_high !== null
                            ? `${m.ref_low} - ${m.ref_high}`
                            : 'Standard'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              isCrit
                                ? 'bg-red-100 text-red-800'
                                : isHigh
                                ? 'bg-amber-100 text-amber-800'
                                : isLow
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {m.flag}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                          {Math.round((m.confidence_score || 0.96) * 100)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMeas(m);
                              setEditValue(String(m.value_numeric));
                            }}
                            className="text-xs text-teal-600 hover:text-teal-800 hover:underline cursor-pointer font-medium"
                          >
                            Correct
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Clinical Verification & Doctor's Notes (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Clinician Review Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="material-symbols-outlined text-teal-600 text-[20px]">verified_user</span>
                <h3 className="font-bold text-sm text-slate-900">Clinical Verification Status</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Review Status:</span>
                  <span className="font-bold text-emerald-700 capitalize">{selectedReport.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Specimen Source:</span>
                  <span className="font-semibold text-slate-700">{selectedReport.laboratory_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Processing Engine:</span>
                  <span className="font-mono text-slate-700">PyMuPDF / Regex Matcher v2.5</span>
                </div>
              </div>

              {selectedReport.clinical_notes && (
                <div className="mt-2 p-3 rounded-lg bg-teal-50/60 border border-teal-200 text-xs text-teal-900">
                  <div className="font-bold text-[11px] text-teal-800 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">stethoscope</span>
                    Attending Physician Note:
                  </div>
                  <p className="leading-relaxed">{selectedReport.clinical_notes}</p>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed italic">
                * Note: Automated extraction values must be verified prior to medical decision-making. Flagged values do not constitute an independent diagnosis.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          No reports found. Upload a PDF or sample document to begin.
        </div>
      )}

      {/* Edit Measurement Correction Modal */}
      {editingMeas && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">edit_document</span>
                Correct Extracted Value
              </h3>
              <button
                type="button"
                onClick={() => setEditingMeas(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">Biomarker:</span>
                <span className="font-bold text-slate-900 ml-1.5">{editingMeas.test_name}</span>
              </div>

              <div>
                <span className="text-slate-500">Standard Interval:</span>
                <span className="font-mono text-slate-700 ml-1.5">
                  {editingMeas.ref_low} - {editingMeas.ref_high} {editingMeas.units}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Corrected Numeric Value:</label>
                <input
                  type="number"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMeas(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs cursor-pointer"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
