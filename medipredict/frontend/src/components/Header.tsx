import React, { useState } from 'react';

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'clinician' | 'researcher' | 'admin';
  token: string;
}

export const DEMO_USERS: Record<string, UserSession> = {
  patient: {
    id: 'demo-patient-01',
    email: 'patient@medipredict.internal',
    full_name: 'John Doe',
    role: 'patient',
    token: 'demo-token-patient',
  },
  clinician: {
    id: 'demo-clinician-01',
    email: 'dr.jenkins@medipredict.internal',
    full_name: 'Dr. Sarah Jenkins, MD',
    role: 'clinician',
    token: 'demo-token-clinician',
  },
  researcher: {
    id: 'demo-researcher-01',
    email: 'dr.rahman@medipredict.internal',
    full_name: 'Dr. A. Rahman, PhD',
    role: 'researcher',
    token: 'demo-token-researcher',
  },
  admin: {
    id: 'demo-admin-01',
    email: 'admin@medipredict.internal',
    full_name: 'Systems Administrator',
    role: 'admin',
    token: 'demo-token-admin',
  },
};

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserSession;
  onChangeUser: (user: UserSession) => void;
}

export function Header({ currentTab, onSelectTab, currentUser, onChangeUser }: HeaderProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const tabs = [
    { key: 'assistant', label: 'AI Assistant', icon: 'chat' },
    { key: 'reports', label: 'Report Analyzer', icon: 'description' },
    { key: 'metrics', label: 'Health Vitals', icon: 'monitoring' },
    { key: 'diseases', label: 'Disease Explorer', icon: 'coronavirus' },
    { key: 'genetics', label: 'Genetics Hub', icon: 'biotech' },
    { key: 'research', label: 'PubMed Intel', icon: 'menu_book' },
    { key: 'risk-lab', label: 'AI Risk Lab', icon: 'science' },
    { key: 'clinician', label: 'Clinician Portal', icon: 'stethoscope' },
    { key: 'admin', label: 'Safety & Admin', icon: 'security' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Clinical Safety & Emergency Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white text-[11px] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-teal-300">MediPredict AI v2.5</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-200">
            Clinical Decision Support &amp; Health Intelligence · Non-Diagnostic Educational Platform
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            Emergency Hotline: <strong>911 / 999 / 112</strong>
          </span>
          <span className="text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">ISO-14971 Compliant</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('assistant')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-700 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">vital_signs</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tight leading-tight">
                MediPredict <span className="text-teal-600 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Medical Intelligence Platform
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const active = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onSelectTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-50 text-teal-700 font-bold shadow-xs border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Role Switcher */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors border border-slate-300 cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser.role === 'clinician'
                    ? 'bg-blue-600'
                    : currentUser.role === 'researcher'
                    ? 'bg-purple-600'
                    : currentUser.role === 'admin'
                    ? 'bg-amber-600'
                    : 'bg-teal-500'
                }`}
              />
              <span className="truncate max-w-[140px]">{currentUser.full_name}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                {currentUser.role}
              </span>
              <span className="material-symbols-outlined text-[16px] text-slate-500">expand_more</span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona
                </div>
                {Object.entries(DEMO_USERS).map(([key, u]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChangeUser(u);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      currentUser.role === u.role ? 'bg-teal-50/70 font-bold text-teal-800' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sub-tabs strip */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 bg-slate-100 overflow-x-auto border-t border-slate-200 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              currentTab === tab.key ? 'bg-teal-600 text-white font-bold' : 'text-slate-600 bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
