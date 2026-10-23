import React, { useState } from 'react';
import type { UserProfile } from './AuthRoleSelection';
import { DEMO_PERSONAS } from './AuthRoleSelection';
import type { NavTabKey } from './Sidebar';

interface TopNavProps {
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  collapsed: boolean;
  activeTab: NavTabKey;
  onSearch?: (query: string) => void;
  onNewRequest?: () => void;
}

export function TopNav({
  currentUser,
  onChangeUser,
  collapsed,
  activeTab,
  onNewRequest,
}: TopNavProps) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const tabTitles: Record<NavTabKey, string> = {
    overview: 'Executive Verification & Pipeline',
    'my-requests': 'My Department Requests',
    'create-request': 'Smart Request Authoring Portal',
    'ai-predictions': 'AI Prediction & Early Risk Detection Centre',
    'process-intelligence': 'Process Intelligence & Bottleneck Explorer',
    recommendations: 'Improvement Recommendations Engine',
    'time-savings': 'Interactive Time-Saving Calculator',
    'operations-queue': 'HR Operations Triage Queue',
    'validation-centre': 'SmartCheck Rule Engine & Policy Matrix',
    'audit-trail': 'Enterprise Audit Trail & Immutable Log',
    'bpi-mining': 'IEEE BPI Challenge 2019 Comparative Mining',
  };

  const offsetClass = collapsed ? 'left-[72px]' : 'left-[248px]';

  return (
    <>
      {/* Fixed Top Prototype Disclaimer Banner */}
      <div
        className={`fixed top-0 ${offsetClass} right-0 z-40 bg-surface-container-high/90 backdrop-blur-md px-6 py-1.5 flex items-center justify-between text-on-surface-variant text-xs transition-all duration-300 border-b border-outline-variant/30`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-tertiary">shield_lock</span>
          <span className="font-bold text-on-surface">Prototype Environment</span>
          <span>·</span>
          <span>Synthetic Emirates Operational Data &amp; IEEE BPI 2019 Integration</span>
          <span>·</span>
          <span className="text-secondary font-semibold">All AI Risk Predictions Advisory Only</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-code">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            FastAPI Live (142ms)
          </span>
          <span className="text-outline">v2.4-rc3</span>
        </div>
      </div>

      {/* Main Top Header Strip */}
      <header
        className={`fixed top-7 ${offsetClass} right-0 h-[64px] bg-surface-container-lowest/90 backdrop-blur-xl z-30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-6 flex items-center justify-between transition-all duration-300 border-b border-surface-container-high`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-primary">Emirates P2P</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-semibold">
              v2.4 Demo
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-on-surface-variant text-xs pl-3 border-l border-outline-variant/40">
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span>Console</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface font-semibold">{tabTitles[activeTab] || 'Workspace'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Action Button */}
          {onNewRequest && (
            <button
              onClick={onNewRequest}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>New Smart Request</span>
            </button>
          )}

          {/* Quick Search */}
          <div className="relative hidden md:flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-64 h-9 pl-9 pr-12 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/30 transition-all border border-outline-variant/40"
              placeholder="Search requests, IDs, titles..."
              type="text"
            />
            <kbd className="absolute right-2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-code text-[10px] uppercase">
              Ctrl+K
            </kbd>
          </div>

          <div className="h-6 w-px bg-outline-variant/40 hidden md:block" />

          {/* Notifications Button */}
          <button
            onClick={() => setShowNotificationToast(!showNotificationToast)}
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />
          </button>

          {/* Active Role Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold cursor-pointer hover:bg-surface-container-high transition-colors border border-outline-variant/40"
            >
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Role: {currentUser.roleTitle}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">unfold_more</span>
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Switch Active Persona
                </div>
                {(['manager', 'hr', 'process'] as const).map((key) => {
                  const persona = DEMO_PERSONAS[key];
                  const isCurrent = currentUser.roleKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onChangeUser(persona);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer ${
                        isCurrent ? 'bg-surface-container-low/70 font-bold' : ''
                      }`}
                    >
                      <img src={persona.avatarUrl} alt={persona.name} className="w-7 h-7 rounded-full object-cover" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-on-surface truncate">{persona.name}</span>
                        <span className="text-[10px] text-on-surface-variant truncate">{persona.roleTitle}</span>
                      </div>
                      {isCurrent && (
                        <span className="material-symbols-outlined text-[16px] text-secondary ml-auto">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/50"
              src={currentUser.avatarUrl}
            />
            <div className="hidden 2xl:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-on-surface">{currentUser.name}</span>
              <span className="text-[10px] text-on-surface-variant">{currentUser.department}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast Dropdown */}
      {showNotificationToast && (
        <div className="fixed top-24 right-6 w-80 bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high p-4 z-50 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">notifications_active</span>
              Live Operational Alerts
            </span>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="text-on-surface-variant hover:text-on-surface text-xs"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 mt-2">
            <div className="p-2 rounded bg-tertiary-fixed/30 text-xs">
              <strong className="text-tertiary block">High Delay Alert</strong>
              P2P-10428 at Initial Validation exceeds 78% breach risk. Grade exception waiver missing.
            </div>
            <div className="p-2 rounded bg-surface-container-low text-xs">
              <strong className="text-secondary block">Model Re-calibrated</strong>
              Gradient Boosting ensemble updated with 1,420 trace records (PR-AUC 0.88).
            </div>
          </div>
        </div>
      )}
    </>
  );
}
