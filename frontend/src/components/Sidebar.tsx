import React from 'react';
import type { UserProfile } from './AuthRoleSelection';

export type NavTabKey =
  | 'overview'
  | 'my-requests'
  | 'create-request'
  | 'ai-predictions'
  | 'process-intelligence'
  | 'recommendations'
  | 'time-savings'
  | 'operations-queue'
  | 'validation-centre'
  | 'audit-trail'
  | 'bpi-mining';

interface SidebarProps {
  activeTab: NavTabKey;
  onSelectTab: (tab: NavTabKey) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const navSections = [
    {
      title: 'Workspace',
      items: [
        { key: 'overview', label: 'Overview / Dashboard', icon: 'space_dashboard' },
        { key: 'my-requests', label: 'My Requests', icon: 'inbox' },
        { key: 'create-request', label: 'Create Request', icon: 'add_circle' },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        { key: 'ai-predictions', label: 'AI Predictions', icon: 'auto_awesome' },
        { key: 'process-intelligence', label: 'Process Intelligence', icon: 'hub' },
        { key: 'recommendations', label: 'Recommendations', icon: 'lightbulb' },
        { key: 'time-savings', label: 'Time Savings', icon: 'timelapse' },
      ],
    },
    {
      title: 'HR Operations',
      items: [
        { key: 'operations-queue', label: 'Operations Queue', icon: 'pending_actions' },
        { key: 'validation-centre', label: 'Validation Centre', icon: 'verified' },
        { key: 'audit-trail', label: 'Audit Trail', icon: 'history_toggle_off' },
      ],
    },
    {
      title: 'Comparative Benchmark',
      items: [
        { key: 'bpi-mining', label: 'IEEE BPI 2019 Mining', icon: 'dataset' },
      ],
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-primary text-on-primary z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.06)] transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[248px]'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header Branding */}
        <div className="h-[72px] px-4 flex items-center justify-between shrink-0 bg-primary-container/40 border-b border-primary-container/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              EK
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm text-on-primary leading-tight tracking-tight">Emirates P2P</span>
                <span className="text-[10px] text-on-primary-container tracking-wider uppercase font-semibold">
                  Intelligence
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label="Toggle Navigation"
            className="text-on-primary-container hover:text-on-primary transition-colors cursor-pointer p-1 rounded hover:bg-primary-container"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((sec) => (
            <nav key={sec.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2 pb-1 text-on-primary-container text-[11px] font-bold uppercase tracking-wider">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectTab(item.key as NavTabKey)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer text-left ${
                      isActive
                        ? 'bg-secondary text-on-secondary shadow-sm'
                        : 'text-on-primary-container hover:bg-primary-container hover:text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          ))}
        </div>

        {/* Profile Footer */}
        <div className="p-3 shrink-0 bg-primary-container/60 border-t border-primary-container/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/50"
                  src={currentUser.avatarUrl}
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary ring-1 ring-primary" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-on-primary truncate">{currentUser.name}</span>
                  <span className="text-[11px] text-on-primary-container truncate">{currentUser.roleTitle}</span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={onLogout}
                aria-label="Logout"
                className="text-on-primary-container hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                title="Sign Out"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
