import React, { useState } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  email: string;
  avatarUrl: string;
  roleKey: 'manager' | 'hr' | 'process';
}

export const DEMO_PERSONAS: Record<'manager' | 'hr' | 'process', UserProfile> = {
  manager: {
    id: 'sarah-jenkins',
    name: 'Sarah Jenkins',
    roleTitle: 'Line Manager',
    department: 'Flight Crew Ops (DXB)',
    email: 'sarah.jenkins@demo.p2p.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    roleKey: 'manager',
  },
  hr: {
    id: 'khalid-alnuaimi',
    name: 'Khalid Al-Nuaimi',
    roleTitle: 'HR Operations Specialist',
    department: 'Central Audit Hub',
    email: 'khalid.alnuaimi@demo.p2p.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roleKey: 'hr',
  },
  process: {
    id: 'dr-a-rahman',
    name: 'Dr. A. Rahman',
    roleTitle: 'Process Owner & Analytics Director',
    department: 'VP Talent Analytics',
    email: 'a.rahman@demo.p2p.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    roleKey: 'process',
  },
};

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export function AuthRoleSelection({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<'roles' | 'credentials'>('roles');
  const [selectedRoleKey, setSelectedRoleKey] = useState<'manager' | 'hr' | 'process'>('manager');
  const [emailInput, setEmailInput] = useState('sarah.jenkins@demo.p2p.internal');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSelectRole = (key: 'manager' | 'hr' | 'process') => {
    setSelectedRoleKey(key);
    setEmailInput(DEMO_PERSONAS[key].email);
  };

  const handleEnterSelectedRole = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onLogin(DEMO_PERSONAS[selectedRoleKey]);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to the selected persona or create custom
    const user = DEMO_PERSONAS[selectedRoleKey];
    onLogin({ ...user, email: emailInput });
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background font-body text-on-surface antialiased">
      {/* Left Column: Executive Brand Intel Deck (50% desktop) */}
      <div className="relative overflow-hidden lg:col-span-6 bg-primary-container text-on-primary flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        {/* Subtle Dynamic Flight Network SVG Grid Backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="60" id="flight-grid" patternUnits="userSpaceOnUse" width="60">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#7ca8fd" strokeDasharray="2 4" strokeWidth="0.5" />
                <circle cx="60" cy="0" fill="#7ca8fd" r="1.5" />
              </pattern>
              <radialGradient cx="20%" cy="30%" id="navy-glow" r="70%">
                <stop offset="0%" stopColor="#2b5cad" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10233f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect fill="url(#flight-grid)" height="100%" width="100%" />
            <rect fill="url(#navy-glow)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Constellation Nodes Accents */}
        <div className="absolute top-1/4 right-8 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-10 w-72 h-72 bg-tertiary-container/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Section: Brand Identity */}
        <div className="relative z-10 flex flex-col items-start gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-lowest p-2 shadow-xl flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-lg tracking-tighter">
                EK
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-surface-container-lowest tracking-tight">Emirates P2P</span>
                <span className="bg-secondary/40 text-secondary-fixed text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  Intelligence
                </span>
              </div>
              <p className="text-on-primary-container font-code text-[11px] uppercase tracking-widest mt-0.5">
                OPS AUDIT ENGINE v4.2
              </p>
            </div>
          </div>

          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-variant/10 text-primary-fixed border border-primary-fixed/15 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />
            <span className="text-xs font-semibold">Intelligent Workflows. Clearer Decisions. Faster Processing.</span>
          </div>

          {/* Headline & Core Vision */}
          <div className="space-y-3 mt-4 max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-container-lowest leading-tight tracking-tight">
              Make Every P2P Request Count.
            </h1>
            <p className="text-sm text-on-primary-container leading-relaxed">
              Eliminate submission rework, preempt compliance disputes, and automate multi-tier personnel validations
              across global flight and ground operations.
            </p>
          </div>
        </div>

        {/* Middle Section: 4 Value Pillars */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 my-10 max-w-2xl">
          {/* Pillar 1 */}
          <div className="p-4 rounded-xl bg-primary/40 backdrop-blur-sm hover:bg-primary/60 transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-secondary-fixed">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <span className="text-xs font-bold text-surface-container-lowest">1. Smart Pre-Validation</span>
            </div>
            <p className="text-xs text-on-primary-container leading-relaxed">
              Catch blocking errors, grade mismatches, and missing documentation instantly prior to submission dispatch.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-xl bg-primary/40 backdrop-blur-sm hover:bg-primary/60 transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-secondary-fixed">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
              </div>
              <span className="text-xs font-bold text-surface-container-lowest">2. Transparent Tracking</span>
            </div>
            <p className="text-xs text-on-primary-container leading-relaxed">
              Full visibility into stage ownership, real-time review queues, and definitive SLA countdowns per jurisdiction.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-xl bg-primary/40 backdrop-blur-sm hover:bg-primary/60 transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-tertiary-container flex items-center justify-center text-tertiary-fixed">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <span className="text-xs font-bold text-surface-container-lowest">3. Predictive AI Risk</span>
            </div>
            <p className="text-xs text-on-primary-container leading-relaxed">
              Early detection of return cycles, SLA delays, and bottlenecks with transparent, explainable audit evidence.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 rounded-xl bg-primary/40 backdrop-blur-sm hover:bg-primary/60 transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-secondary/30 flex items-center justify-center text-secondary-fixed">
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
              </div>
              <span className="text-xs font-bold text-surface-container-lowest">4. Process Mining</span>
            </div>
            <p className="text-xs text-on-primary-container leading-relaxed">
              Transform raw workflow logs into quantifiable operational hours conserved, fueling continuous route improvements.
            </p>
          </div>
        </div>

        {/* Bottom Assurance Footer */}
        <div className="relative z-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-on-primary-container/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary-fixed">shield_lock</span>
            <span className="font-code text-xs tracking-wide">Enterprise Workflow Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
            <span className="font-code text-xs">Prototype Demonstration · Synthetic Data</span>
          </div>
        </div>
      </div>

      {/* Right Column: Card Authentication & Demo Role Switcher (50% desktop) */}
      <div className="lg:col-span-6 bg-surface-container-lowest flex flex-col justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
          {/* Header Ribbon & Subtitle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-secondary text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                Demonstration Access Portal
              </span>
              <span className="font-code text-xs text-outline">ENV: DXB-STAGE-01</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight mt-1">
              Sign in to Your Workspace
            </h2>
            <p className="text-sm text-on-surface-variant">
              Select your demonstration credentials or choose a pre-configured role profile to explore the platform.
            </p>
          </div>

          {/* Mode Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl">
            <button
              type="button"
              onClick={() => setMode('roles')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                mode === 'roles'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">badge</span>
              <span>
                Role Profiles <span className="text-secondary text-[10px] uppercase font-bold tracking-wider ml-1">Quick</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('credentials')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                mode === 'credentials'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>Standard Credentials</span>
            </button>
          </div>

          {/* MODE A: QUICK DEMO ROLE SELECTION */}
          {mode === 'roles' && (
            <div className="flex flex-col gap-3.5 transition-opacity duration-300">
              {/* Role 1: Line Manager (Sarah Jenkins) */}
              <div
                onClick={() => handleSelectRole('manager')}
                className={`group relative p-4 rounded-xl transition-all cursor-pointer shadow-sm border ${
                  selectedRoleKey === 'manager'
                    ? 'bg-surface-container border-secondary ring-1 ring-secondary'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">Line Manager</span>
                        <span className="bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Submit requests, monitor validation status, resolve returned items, and track approval stages.
                      </p>
                      <p className="font-code text-xs text-secondary font-semibold mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">account_circle</span>
                        Sarah Jenkins · Flight Crew Ops (DXB)
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      selectedRoleKey === 'manager'
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface-variant text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                </div>
                <div className="mt-3.5 pt-3 border-t border-surface-container-high/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleEnterSelectedRole}
                    className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  >
                    Enter as Line Manager (Sarah Jenkins)
                  </button>
                </div>
              </div>

              {/* Role 2: HR Operations Specialist (Khalid Al-Nuaimi) */}
              <div
                onClick={() => handleSelectRole('hr')}
                className={`group relative p-4 rounded-xl transition-all cursor-pointer shadow-sm border ${
                  selectedRoleKey === 'hr'
                    ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-surface-container-lowest flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">HR Operations Specialist</span>
                        <span className="bg-surface-container-high text-on-surface-variant text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          Operational Queue
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Manage operational queues, investigate exceptions, audit submissions, and clear dependencies.
                      </p>
                      <p className="font-code text-xs text-on-surface-variant font-medium mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">account_circle</span>
                        Khalid Al-Nuaimi · Central Audit Hub
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      selectedRoleKey === 'hr'
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-variant text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                </div>
                <div className="mt-3.5 pt-3 border-t border-surface-container-high/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleEnterSelectedRole}
                    className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  >
                    Enter as HR Specialist (Khalid Al-Nuaimi)
                  </button>
                </div>
              </div>

              {/* Role 3: HR Process Owner / Analytics Director (Dr. A. Rahman) */}
              <div
                onClick={() => handleSelectRole('process')}
                className={`group relative p-4 rounded-xl transition-all cursor-pointer shadow-sm border ${
                  selectedRoleKey === 'process'
                    ? 'bg-surface-container border-tertiary-container ring-1 ring-tertiary-container'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-tertiary-container text-tertiary-fixed flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">insights</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">HR Process Owner</span>
                        <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          Executive AI
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Analyse stage bottlenecks, evaluate ML risk models, and simulate time-saving recommendations.
                      </p>
                      <p className="font-code text-xs text-on-surface-variant font-medium mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">account_circle</span>
                        Dr. A. Rahman · VP Talent Analytics
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      selectedRoleKey === 'process'
                        ? 'bg-tertiary-container text-tertiary-fixed'
                        : 'bg-surface-variant text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                </div>
                <div className="mt-3.5 pt-3 border-t border-surface-container-high/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleEnterSelectedRole}
                    className="px-4 py-2 rounded-lg bg-tertiary-container text-tertiary-fixed text-xs font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  >
                    Enter as Process Owner (Dr. A. Rahman)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: STANDARD CREDENTIALS DEMO FORM */}
          {mode === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="work-email">
                  <span>Work Email Address</span>
                  <span className="text-outline text-[11px]">Corporate SSO Compatible</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                    alternate_email
                  </span>
                  <input
                    id="work-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-code border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between" htmlFor="password">
                  <span>Security Password</span>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-secondary text-[11px] hover:underline">
                    Reset token?
                  </a>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-code border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-outline-variant text-secondary accent-secondary"
                  />
                  <span>Persist session on this workstation</span>
                </label>
                <span className="font-code text-[11px] text-outline">TLS 1.3 AES-256</span>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-secondary text-on-secondary font-bold text-xs uppercase tracking-wider shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Sign in to Workspace</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-surface-container-high" />
                <span className="flex-shrink mx-4 text-[11px] font-code uppercase text-outline">Or Single Sign-On</span>
                <div className="flex-grow border-t border-surface-container-high" />
              </div>

              <button
                type="button"
                onClick={handleEnterSelectedRole}
                className="w-full h-10 rounded-lg bg-surface-container-low text-on-surface font-semibold text-xs border border-outline-variant/40 hover:bg-surface-container transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">corporate_fare</span>
                <span>Sign in with Emirates Corporate SSO</span>
              </button>
            </form>
          )}

          {/* Security Notice & Synthetic Data Disclaimer */}
          <div className="p-3 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] flex items-start gap-2 border border-surface-container-high">
            <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">info</span>
            <div className="leading-relaxed">
              <strong>Demonstration Environment Notice:</strong> This prototype runs on synthetic P2P requests and IEEE BPI 2019 event logs.
              All pre-validation rules, XGBoost / Random Forest models, and savings simulations are fully functional.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
