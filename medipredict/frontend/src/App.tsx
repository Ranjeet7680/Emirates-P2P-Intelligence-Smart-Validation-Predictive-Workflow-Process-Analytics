import React, { useState } from 'react';
import { Header, DEMO_USERS, type UserSession } from './components/Header';
import { AiAssistantView } from './components/AiAssistantView';
import { MedicalReportAnalyzerView } from './components/MedicalReportAnalyzerView';
import { HealthMetricsDashboardView } from './components/HealthMetricsDashboardView';
import { DiseaseExplorerView } from './components/DiseaseExplorerView';
import { GeneticsExplorerView } from './components/GeneticsExplorerView';
import { MedicalResearchView } from './components/MedicalResearchView';
import { DiseaseRiskLabView } from './components/DiseaseRiskLabView';
import { ClinicianWorkspaceView } from './components/ClinicianWorkspaceView';
import { AdminSafetyView } from './components/AdminSafetyView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('assistant');
  const [currentUser, setCurrentUser] = useState<UserSession>(DEMO_USERS.clinician);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Platform Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'assistant' && <AiAssistantView currentUser={currentUser} />}
        {currentTab === 'reports' && <MedicalReportAnalyzerView currentUser={currentUser} />}
        {currentTab === 'metrics' && <HealthMetricsDashboardView currentUser={currentUser} />}
        {currentTab === 'diseases' && <DiseaseExplorerView />}
        {currentTab === 'genetics' && <GeneticsExplorerView />}
        {currentTab === 'research' && <MedicalResearchView />}
        {currentTab === 'risk-lab' && <DiseaseRiskLabView />}
        {currentTab === 'clinician' && <ClinicianWorkspaceView />}
        {currentTab === 'admin' && <AdminSafetyView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <span className="font-bold text-slate-800 text-sm">MediPredict AI</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">Intelligent Healthcare. Earlier Insights. Better Decisions.</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>NCBI PubMed E-Utilities</span>
              <span>•</span>
              <span>NIH ClinVar Curations</span>
              <span>•</span>
              <span>ICD-11 Aligned</span>
              <span>•</span>
              <span>ReportLab PDF Generator</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} MediPredict AI Systems. Engineered for clinical research and healthcare informatics.
            </div>
            <div className="text-center md:text-right max-w-xl text-amber-700/80 bg-amber-50/70 p-2 rounded border border-amber-200/60">
              <strong>Mandatory Regulatory Notice:</strong> MediPredict AI is an educational and clinical decision-support research platform. It does not provide definitive medical diagnoses, dispense medication, or replace the independent clinical judgment of a licensed healthcare professional.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
