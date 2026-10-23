import React from 'react';
import { Plane, ShieldCheck, Database, UserCheck, AlertTriangle, Cpu } from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  health: any;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, health }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Plane className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-wider text-white">EMIRATES</span>
                <span className="text-xs bg-red-600/30 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono font-bold">P2P INTELLIGENCE</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Smart Validation, Predictive Workflow & Process Analytics</p>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onRoleChange('manager')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentRole === 'manager'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Manager Portal
            </button>
            <button
              onClick={() => onRoleChange('hr')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentRole === 'hr'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              HR Queue
            </button>
            <button
              onClick={() => onRoleChange('process')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentRole === 'process'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              ProcessLens
            </button>
            <button
              onClick={() => onRoleChange('savings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentRole === 'savings'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Improvement Engine
            </button>
            <button
              onClick={() => onRoleChange('bpi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentRole === 'bpi'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              BPI 2019 Mining
            </button>
            <button
              onClick={() => onRoleChange('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentRole === 'audit'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Governance & Audit
            </button>
          </div>

          {/* System & Data Posture Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API: HEALTHY</span>
            </div>
            <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Synthetic Posture</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
