import React, { useState } from 'react';
import type { UserProfile } from './components/AuthRoleSelection';
import { AuthRoleSelection, DEMO_PERSONAS } from './components/AuthRoleSelection';
import type { NavTabKey } from './components/Sidebar';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { AiPredictionCentre } from './components/AiPredictionCentre';
import { ImprovementCalculatorView } from './components/ImprovementCalculatorView';
import { ProcessIntelligenceView } from './components/ProcessIntelligenceView';
import { ManagerPortal } from './components/ManagerPortal';
import { HrQueue } from './components/HrQueue';
import { BpiExplorer } from './components/BpiExplorer';
import { GovernanceAudit } from './components/GovernanceAudit';
import { FlowTrackModal } from './components/FlowTrackModal';
import { api } from './api/client';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Check saved session or default to Line Manager for instant demo access
    const saved = localStorage.getItem('emirates_p2p_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_PERSONAS.manager;
      }
    }
    return DEMO_PERSONAS.manager;
  });

  const [activeTab, setActiveTab] = useState<NavTabKey>('ai-predictions');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // FlowTrack Modal State
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('emirates_p2p_user', JSON.stringify(user));

    // Route default view according to role
    if (user.roleKey === 'manager') {
      setActiveTab('my-requests');
    } else if (user.roleKey === 'hr') {
      setActiveTab('operations-queue');
    } else {
      setActiveTab('process-intelligence');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('emirates_p2p_user');
  };

  const handleChangeUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('emirates_p2p_user', JSON.stringify(user));
  };

  const handleOpenDetail = async (requestId: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.getRequestDetail(requestId);
      setSelectedDetail(data);
    } catch (err: any) {
      alert(`Failed to load request ${requestId}: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTransition = async (action: string, reason?: string) => {
    if (!selectedDetail) return;
    const reqId = selectedDetail.request.request_id;
    try {
      await api.transitionRequest(reqId, {
        action,
        actor_role: currentUser?.roleTitle || 'Authorized Approver',
        team: currentUser?.department || 'Operations Audit Hub',
        reason_code: reason,
        comments: `Action ${action} executed by ${currentUser?.name || 'Authorized User'}.`,
      });
      const updated = await api.getRequestDetail(reqId);
      setSelectedDetail(updated);
    } catch (err: any) {
      alert(`Transition failed: ${err.message}`);
    }
  };

  // If unauthenticated, show Authentication & Role Switcher
  if (!currentUser) {
    return <AuthRoleSelection onLogin={handleLogin} />;
  }

  const offsetClass = sidebarCollapsed ? 'pl-[72px]' : 'pl-[248px]';

  return (
    <div className="min-h-screen bg-background font-body text-on-surface antialiased flex flex-col">
      {/* Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Layout Area */}
      <div className={`flex-1 flex flex-col ${offsetClass} transition-all duration-300 min-h-screen`}>
        {/* Top Disclaimer Banner & Navigation Bar */}
        <TopNav
          currentUser={currentUser}
          onChangeUser={handleChangeUser}
          collapsed={sidebarCollapsed}
          activeTab={activeTab}
          onNewRequest={() => setActiveTab('create-request')}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 w-full pt-[96px] px-6 pb-12 max-w-[1680px] mx-auto">
          {activeTab === 'overview' && (
            <AiPredictionCentre onOpenFlowTrack={handleOpenDetail} />
          )}

          {activeTab === 'ai-predictions' && (
            <AiPredictionCentre onOpenFlowTrack={handleOpenDetail} />
          )}

          {activeTab === 'my-requests' && (
            <ManagerPortal onOpenDetail={handleOpenDetail} />
          )}

          {activeTab === 'create-request' && (
            <ManagerPortal onOpenDetail={handleOpenDetail} />
          )}

          {activeTab === 'process-intelligence' && (
            <ProcessIntelligenceView onNavigateToRecommendations={() => setActiveTab('recommendations')} />
          )}

          {activeTab === 'recommendations' && (
            <ImprovementCalculatorView />
          )}

          {activeTab === 'time-savings' && (
            <ImprovementCalculatorView />
          )}

          {activeTab === 'operations-queue' && (
            <HrQueue onOpenDetail={handleOpenDetail} />
          )}

          {activeTab === 'validation-centre' && (
            <GovernanceAudit />
          )}

          {activeTab === 'audit-trail' && (
            <GovernanceAudit />
          )}

          {activeTab === 'bpi-mining' && (
            <BpiExplorer />
          )}
        </main>

        {/* Global Executive Footer */}
        <footer className="bg-primary border-t border-primary-container text-on-primary-container py-4 text-xs">
          <div className="max-w-[1680px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-semibold text-on-primary">
                Emirates P2P Intelligence Prototype v2.4
              </span>
              <span className="text-outline">· Right First Time Smart Position To Person Requisitions</span>
            </div>
            <div className="font-code text-[11px] text-on-primary-container/80 flex items-center gap-4">
              <span>Synthetic Operational Posture</span>
              <span>•</span>
              <span>Explainable AI Risk Engine (SHAP)</span>
              <span>•</span>
              <span>IEEE BPI Challenge 2019 Mining</span>
            </div>
          </div>
        </footer>
      </div>

      {/* FlowTrack Details Modal */}
      {selectedDetail && (
        <FlowTrackModal
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onTransition={handleTransition}
        />
      )}

      {/* Loading Indicator */}
      {loadingDetail && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 z-50 border border-secondary/50">
          <div className="w-2 h-2 rounded-full bg-secondary animate-ping" />
          <span>Retrieving FlowTrack event log &amp; timeline...</span>
        </div>
      )}
    </div>
  );
}

export default App;
