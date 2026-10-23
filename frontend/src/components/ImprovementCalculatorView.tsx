import React, { useState, useMemo } from 'react';

interface Preset {
  volume: number;
  proportion: number;
  reworkMinutes: number;
  efficiency: number;
  name: string;
  effort: string;
}

export function ImprovementCalculatorView() {
  const [volume, setVolume] = useState<number>(350);
  const [proportion, setProportion] = useState<number>(42);
  const [reworkMinutes, setReworkMinutes] = useState<number>(75);
  const [efficiency, setEfficiency] = useState<number>(65);
  const [effort, setEffort] = useState<string>('Medium - 3 Weeks');
  const [activeModelName, setActiveModelName] = useState<string>('Baseline Simulation');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadPreset = (preset: Preset) => {
    setVolume(preset.volume);
    setProportion(preset.proportion);
    setReworkMinutes(preset.reworkMinutes);
    setEfficiency(preset.efficiency);
    setEffort(preset.effort);
    setActiveModelName(preset.name);

    setToastMessage(`Loaded simulation preset: ${preset.name}`);
    setTimeout(() => setToastMessage(null), 3000);

    const calcEl = document.getElementById('simulation-calculator');
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetDefaults = () => {
    setVolume(350);
    setProportion(42);
    setReworkMinutes(75);
    setEfficiency(65);
    setEffort('Medium - 3 Weeks');
    setActiveModelName('Baseline Simulation');
    setToastMessage('Reset calculator to baseline parameters.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Calculations
  const metrics = useMemo(() => {
    const affectedRequests = Math.round(volume * (proportion / 100));
    const totalPotentialReworkMinutes = affectedRequests * reworkMinutes;
    const minutesSaved = Math.round(totalPotentialReworkMinutes * (efficiency / 100));
    const hoursSavedMonthly = Number((minutesSaved / 60).toFixed(1));
    const hoursSavedAnnual = Math.round(hoursSavedMonthly * 12);
    const hourlyRateAED = 130; // standard blended HR Ops rate
    const financialSavingsAED = Math.round(hoursSavedAnnual * hourlyRateAED);

    // Scenarios
    const conservativeHours = Number((hoursSavedMonthly * 0.8).toFixed(1));
    const optimisticHours = Number((hoursSavedMonthly * 1.25).toFixed(1));

    return {
      affectedRequests,
      minutesSaved,
      hoursSavedMonthly,
      hoursSavedAnnual,
      financialSavingsAED,
      conservativeHours,
      optimisticHours,
    };
  }, [volume, proportion, reworkMinutes, efficiency]);

  const exportBriefingMemo = () => {
    const memo = `# EMIRATES P2P INTELLIGENCE — PROCESS IMPROVEMENT MEMO
Date: ${new Date().toLocaleDateString()}
Model: ${activeModelName}
Governance Tier: ISO-9001 / P2P Enterprise Workflow Quality

## EXECUTIVE SUMMARY
Based on simulation analysis calibrated with 1,420 synthetic trace logs:
- Monthly Requisition Volume: ${volume}
- Targeted Friction Share: ${proportion}% (${metrics.affectedRequests} requests/month)
- Baseline Avoidable Rework: ${reworkMinutes} minutes / request
- Automation Efficiency Target: ${efficiency}%
- Estimated Monthly Hours Recovered: ${metrics.hoursSavedMonthly} hrs / month
- Annualized Enterprise Salvage: ${metrics.hoursSavedAnnual} hrs / year
- Projected Financial Cost Recovery: AED ${metrics.financialSavingsAED.toLocaleString()} / year

## SENSITIVITY PROJECTIONS
- Conservative (-20%): ${metrics.conservativeHours} hrs / month (${Math.round(metrics.conservativeHours * 12)} hrs/yr)
- Base Target: ${metrics.hoursSavedMonthly} hrs / month (${metrics.hoursSavedAnnual} hrs/yr)
- Optimistic (+25%): ${metrics.optimisticHours} hrs / month (${Math.round(metrics.optimisticHours * 12)} hrs/yr)

Generated via Emirates P2P Intelligence v2.4 Recommendation Engine.`;

    const blob = new Blob([memo], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emirates_p2p_briefing_memo_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setToastMessage('Exported executive briefing memo markdown.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-secondary/50 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Executive Header & Context Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-surface-container-lowest p-6 rounded-xl shadow-sm relative overflow-hidden border border-surface-container-high">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-2 max-w-3xl z-10">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px] text-tertiary">analytics</span>
              Synthetic Benchmark Dataset
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Model Confidence: High (92% sample coverage)
            </span>
            <span className="font-code text-xs text-on-surface-variant font-semibold">REC-MOD-2025-Q1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Improvement Recommendations &amp; Time-Saving Calculator
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            Evidence-based process enhancements paired with an interactive ROI simulation engine to quantify operational time savings across procurement and personnel requisitions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 z-10">
          <button
            onClick={exportBriefingMemo}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Briefing Memo</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('simulation-calculator');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Configure Simulation</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Evidence-Based Recommendation Cards */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-secondary" />
            <h2 className="text-xl font-bold text-on-surface">Evidence-Based Recommendations</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
              3 Strategic Opportunities
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-on-surface-variant">Aggregated Target Salvage:</span>
            <span className="text-sm font-bold text-secondary ml-1">~385 hrs / month</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* REC CARD 1 */}
          <div className="flex flex-col justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary to-secondary-container" />
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-code text-[11px] font-bold">
                  REC-01 · CORE INTEGRATION
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant" />
                  Ready for Pilot
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary group-hover:text-secondary transition-colors">
                  Automated Pre-Submission Grade &amp; Hierarchy Validation
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Target Domain:
                  </span>
                  <span className="font-code text-xs text-on-surface font-semibold">Personnel to Post (P2P)</span>
                </div>
              </div>

              {/* Problem & Intervention */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/60">
                  <div className="flex items-center gap-1.5 text-error text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">report_problem</span>
                    <span>Root Disruption</span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">
                    <strong className="text-on-surface font-bold">41% of all P2P returns</strong> occur at Initial Validation due to Grade and Department discrepancies.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-high/60">
                  <div className="flex items-center gap-1.5 text-secondary text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>Proposed Intervention</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Real-time blocking validation at Step 2 of the request form using live SAP-HR organizational structural tables.
                  </p>
                </div>
              </div>

              {/* Impact Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-surface-container-high/40">
                  <span className="text-[11px] text-on-surface-variant">Rework Loop Reduction</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-secondary">-38%</span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">trending_down</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-surface-container-high/40">
                  <span className="text-[11px] text-on-surface-variant">Estimated Salvage</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-primary">210h</span>
                    <span className="text-[11px] text-on-surface-variant">/ month</span>
                  </div>
                </div>
              </div>

              {/* Telemetry bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Return Rate Mitigation</span>
                  <span className="font-code font-bold text-secondary">41% → 25.4%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-surface-container-high">
              <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[16px]">speed</span>
                <span>Effort: <strong className="text-on-surface font-semibold">Medium</strong> (3 wks)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  loadPreset({
                    volume: 350,
                    proportion: 41,
                    reworkMinutes: 75,
                    efficiency: 65,
                    name: 'Automated Pre-Submission Validation',
                    effort: 'Medium - 3 Weeks',
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-secondary hover:bg-secondary hover:text-on-secondary text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Load in Calculator</span>
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </button>
            </div>
          </div>

          {/* REC CARD 2 */}
          <div className="flex flex-col justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary-container to-surface-tint" />
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-code text-[11px] font-bold">
                  REC-02 · WORKFLOW CHAINING
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Engineering Spec
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary group-hover:text-secondary transition-colors">
                  Automated Prerequisite Dependency Notification
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Target Domain:
                  </span>
                  <span className="font-code text-xs text-on-surface font-semibold">Crew Fleet Reallocation</span>
                </div>
              </div>

              {/* Problem & Intervention */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/60">
                  <div className="flex items-center gap-1.5 text-error text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">report_problem</span>
                    <span>Root Disruption</span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">
                    Requests stall for an average of <strong className="text-on-surface font-bold">4.6 days</strong> waiting for unlinked source position backfill creation.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-high/60">
                  <div className="flex items-center gap-1.5 text-secondary text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>Proposed Intervention</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Prompt requester to trigger linked backfill with one-click position cloning during initial submission stage.
                  </p>
                </div>
              </div>

              {/* Impact Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-surface-container-high/40">
                  <span className="text-[11px] text-on-surface-variant">Stage Idle Reduction</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-secondary">-52%</span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">hourglass_bottom</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-surface-container-high/40">
                  <span className="text-[11px] text-on-surface-variant">Cycle Acceleration</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-primary">2.4d</span>
                    <span className="text-[11px] text-on-surface-variant">faster</span>
                  </div>
                </div>
              </div>

              {/* Telemetry bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Backfill Synchronization Velocity</span>
                  <span className="font-code font-bold text-secondary">4.6d → 2.2d</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '52%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-surface-container-high">
              <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[16px]">speed</span>
                <span>Effort: <strong className="text-on-surface font-semibold">Low</strong> (1 wk)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  loadPreset({
                    volume: 280,
                    proportion: 31,
                    reworkMinutes: 110,
                    efficiency: 52,
                    name: 'Automated Prerequisite Dependency Notification',
                    effort: 'Low - 1 Week',
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-secondary hover:bg-secondary hover:text-on-secondary text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Load in Calculator</span>
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </button>
            </div>
          </div>

          {/* REC CARD 3 */}
          <div className="flex flex-col justify-between bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-tertiary to-secondary" />
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-code text-[11px] font-bold">
                  REC-03 · ADAPTIVE ORCHESTRATION
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Governance Scoping
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary group-hover:text-secondary transition-colors">
                  Smart Approver Re-routing for Backlogged Queues
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    Target Domain:
                  </span>
                  <span className="font-code text-xs text-on-surface font-semibold">Peak Flight Scheduling</span>
                </div>
              </div>

              {/* Problem & Intervention */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/60">
                  <div className="flex items-center gap-1.5 text-error text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">report_problem</span>
                    <span>Root Disruption</span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">
                    Single-point approval bottlenecks <strong className="text-on-surface font-bold">exceed SLA by 48h</strong> during peak flight scheduling cycles.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-high/60">
                  <div className="flex items-center gap-1.5 text-secondary text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>Proposed Intervention</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Dynamic secondary delegate routing initiated automatically after 24 hours of inactivity during defined rosters.
                  </p>
                </div>
              </div>

              {/* Impact Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-surface-container-high/40">
                  <span className="text-[11px] text-on-surface-variant">Bottleneck Bypass</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-secondary">-44%</span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
                  </div>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-surface-container-high/40">
                  <span className="text-[11px] text-on-surface-variant">SLA Recovery</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-primary">1.8d</span>
                    <span className="text-[11px] text-on-surface-variant">faster</span>
                  </div>
                </div>
              </div>

              {/* Telemetry bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Approval Bottleneck Mitigation</span>
                  <span className="font-code font-bold text-secondary">48h → 14h</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-surface-container-high">
              <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[16px]">speed</span>
                <span>Effort: <strong className="text-on-surface font-semibold">High</strong> (6 wks)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  loadPreset({
                    volume: 420,
                    proportion: 28,
                    reworkMinutes: 90,
                    efficiency: 48,
                    name: 'Smart Approver Re-routing',
                    effort: 'High - 6 Weeks',
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-secondary hover:bg-secondary hover:text-on-secondary text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Load in Calculator</span>
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Interactive Time-Saving Calculator */}
      <section className="flex flex-col gap-5 mt-2" id="simulation-calculator">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-secondary" />
              <h2 className="text-xl font-bold text-on-surface">Interactive Time-Saving Calculator</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Scenario Simulation Model — Calculate potential operational time savings using explicit variables.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">Active Model:</span>
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-primary font-bold text-xs">
              {activeModelName}
            </span>
          </div>
        </div>

        {/* Dual-Column Interactive Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Input Parameters Form (5 Cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-secondary">tune</span>
                <h3 className="font-bold text-sm text-primary">Input Parameters</h3>
              </div>
              <button
                type="button"
                onClick={resetDefaults}
                className="text-xs text-secondary hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset Defaults
              </button>
            </div>

            {/* Param 1: Monthly Request Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-on-surface" htmlFor="inputVolume">
                  Monthly Request Volume
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-code font-bold text-primary">{volume}</span>
                  <span className="text-on-surface-variant text-[11px]">req / mo</span>
                </div>
              </div>
              <input
                id="inputVolume"
                type="range"
                min="50"
                max="1200"
                step="10"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-code">
                <span>50 min</span>
                <span>Historical Baseline: 350</span>
                <span>1,200 max</span>
              </div>
            </div>

            {/* Param 2: Proportion Affected */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-on-surface" htmlFor="inputProportion">
                  Proportion Affected (%)
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-code font-bold text-primary">{proportion}%</span>
                  <span className="text-on-surface-variant text-[11px]">({metrics.affectedRequests} requests)</span>
                </div>
              </div>
              <input
                id="inputProportion"
                type="range"
                min="5"
                max="95"
                step="1"
                value={proportion}
                onChange={(e) => setProportion(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-code">
                <span>5%</span>
                <span>Typical: 30% - 45%</span>
                <span>95%</span>
              </div>
            </div>

            {/* Param 3: Avoidable Rework Time per Request */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-on-surface" htmlFor="inputReworkMinutes">
                  Avoidable Rework Time per Request
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-code font-bold text-primary">{reworkMinutes}</span>
                  <span className="text-on-surface-variant text-[11px]">minutes</span>
                </div>
              </div>
              <input
                id="inputReworkMinutes"
                type="range"
                min="15"
                max="240"
                step="5"
                value={reworkMinutes}
                onChange={(e) => setReworkMinutes(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-code">
                <span>15 min</span>
                <span>Avg Audit Cycle: 75 min</span>
                <span>240 min (4h)</span>
              </div>
            </div>

            {/* Param 4: Expected Reduction Efficiency */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-on-surface" htmlFor="inputEfficiency">
                  Expected Reduction Efficiency (%)
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-code font-bold text-primary">{efficiency}%</span>
                  <span className="text-on-surface-variant text-[11px]">mitigation</span>
                </div>
              </div>
              <input
                id="inputEfficiency"
                type="range"
                min="10"
                max="95"
                step="5"
                value={efficiency}
                onChange={(e) => setEfficiency(Number(e.target.value))}
                className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-code">
                <span>10% Low</span>
                <span>Automated Gate Target: 65%</span>
                <span>95% Max</span>
              </div>
            </div>

            {/* Param 5: Implementation Effort */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-xs font-semibold text-on-surface" htmlFor="inputEffort">
                Implementation &amp; Rollout Effort
              </label>
              <div className="relative">
                <select
                  id="inputEffort"
                  value={effort}
                  onChange={(e) => setEffort(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none border border-outline-variant/40 appearance-none cursor-pointer pr-10"
                >
                  <option value="Low - 1 Week">Low - 1 Week (Field validation &amp; triggers)</option>
                  <option value="Medium - 3 Weeks">Medium - 3 Weeks (API verification &amp; policy rules)</option>
                  <option value="High - 6 Weeks">High - 6 Weeks (Matrix dynamic delegation &amp; full engine)</option>
                  <option value="Enterprise Pilot - 10 Weeks">Enterprise Pilot - 10 Weeks (Group-wide orchestration)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-high/60 flex items-center justify-between text-on-surface text-xs border border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                <span>Simulation Parameters Validated</span>
              </div>
              <span className="font-code text-on-surface-variant font-semibold text-[11px]">ISO-9001/P2P</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Dynamic Output Cards & Scenario Comparison (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Output KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* KPI 1 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container-high flex flex-col justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Requests Affected
                </span>
                <div className="my-2">
                  <span className="text-3xl font-bold text-primary">{metrics.affectedRequests}</span>
                  <span className="text-xs text-on-surface-variant ml-1">/ month</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary">pie_chart</span>
                  <span>{proportion}% of monthly total</span>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container-high flex flex-col justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Minutes Saved
                </span>
                <div className="my-2">
                  <span className="text-3xl font-bold text-secondary">{metrics.minutesSaved.toLocaleString()}</span>
                  <span className="text-xs text-on-surface-variant ml-1">min / mo</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  <span>Reallocated ops time</span>
                </div>
              </div>

              {/* KPI 3 (Hero KPI) */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/40 flex flex-col justify-between sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-surface-container-lowest to-surface-container-high/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  Operational Hours
                </span>
                <div className="my-2">
                  <span className="text-3xl font-bold text-primary">{metrics.hoursSavedMonthly}</span>
                  <span className="text-xs text-on-surface-variant ml-1">hrs / mo</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-secondary font-semibold">
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Direct capacity unlock</span>
                </div>
              </div>
            </div>

            {/* Scenario Comparison Strip */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-high flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                <span className="font-bold text-xs text-primary uppercase tracking-wider">
                  Sensitivity Scenario Matrix (Annualized)
                </span>
                <span className="font-code text-[11px] text-on-surface-variant">Baseline Rate: AED 130/hr</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Conservative */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high/60 flex flex-col">
                  <span className="text-xs font-semibold text-on-surface-variant">Conservative (-20%)</span>
                  <span className="text-xl font-bold text-on-surface mt-1">{metrics.conservativeHours}h</span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    {Math.round(metrics.conservativeHours * 12)} hrs/yr · AED {Math.round(metrics.conservativeHours * 12 * 130).toLocaleString()}
                  </span>
                </div>

                {/* Base Case */}
                <div className="p-3 rounded-lg bg-surface-container border border-secondary/50 flex flex-col relative">
                  <span className="absolute top-2 right-2 px-1.5 py-0.2 bg-secondary text-on-secondary rounded text-[9px] uppercase font-bold">
                    Target
                  </span>
                  <span className="text-xs font-bold text-secondary">Base Case (Expected)</span>
                  <span className="text-xl font-bold text-primary mt-1">{metrics.hoursSavedMonthly}h</span>
                  <span className="text-[11px] text-secondary font-semibold mt-0.5">
                    {metrics.hoursSavedAnnual} hrs/yr · AED {metrics.financialSavingsAED.toLocaleString()}
                  </span>
                </div>

                {/* Optimistic */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high/60 flex flex-col">
                  <span className="text-xs font-semibold text-on-surface-variant">Optimistic (+25%)</span>
                  <span className="text-xl font-bold text-emerald-700 mt-1">{metrics.optimisticHours}h</span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    {Math.round(metrics.optimisticHours * 12)} hrs/yr · AED {Math.round(metrics.optimisticHours * 12 * 130).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Inline Comparative Visual SVG Sparkline Chart */}
              <div className="mt-2 pt-3 border-t border-surface-container-high">
                <div className="flex justify-between items-center text-xs text-on-surface-variant mb-2">
                  <span className="font-semibold text-on-surface">12-Month Cumulative Hours Recovered Trajectory</span>
                  <div className="flex items-center gap-3 font-code text-[11px]">
                    <span className="flex items-center gap-1 text-outline">
                      <span className="w-2.5 h-0.5 bg-outline inline-block" /> Conservative
                    </span>
                    <span className="flex items-center gap-1 text-secondary font-bold">
                      <span className="w-2.5 h-0.5 bg-secondary inline-block" /> Base Target
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" /> Optimistic
                    </span>
                  </div>
                </div>

                <div className="w-full h-32 bg-surface-container-low rounded-lg p-3 relative overflow-hidden flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 600 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="600" y2="25" stroke="#c5c6ce" strokeDasharray="3 3" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#c5c6ce" strokeDasharray="3 3" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="600" y2="75" stroke="#c5c6ce" strokeDasharray="3 3" strokeWidth="0.5" />

                    {/* Conservative Trajectory */}
                    <path
                      d={`M 0,95 Q 300,${95 - metrics.conservativeHours * 0.4} 600,${Math.max(10, 95 - metrics.conservativeHours * 0.65)}`}
                      fill="none"
                      stroke="#75777e"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />

                    {/* Base Case Trajectory */}
                    <path
                      d={`M 0,95 Q 300,${95 - metrics.hoursSavedMonthly * 0.45} 600,${Math.max(10, 95 - metrics.hoursSavedMonthly * 0.72)}`}
                      fill="none"
                      stroke="#2b5cad"
                      strokeWidth="3"
                    />

                    {/* Optimistic Trajectory */}
                    <path
                      d={`M 0,95 Q 300,${95 - metrics.optimisticHours * 0.5} 600,${Math.max(5, 95 - metrics.optimisticHours * 0.8)}`}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2"
                    />

                    {/* End markers */}
                    <circle cx="600" cy={Math.max(10, 95 - metrics.hoursSavedMonthly * 0.72)} r="4" fill="#2b5cad" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] font-code text-on-surface-variant mt-1.5">
                  <span>Month 1 (Rollout)</span>
                  <span>Month 6 (Maturity)</span>
                  <span>Month 12 (Target: {metrics.hoursSavedAnnual} hrs)</span>
                </div>
              </div>

              {/* Governance Disclaimer */}
              <div className="mt-2 p-3 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-start gap-2 border border-surface-container-high/60">
                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">verified</span>
                <span>
                  All savings simulations are calculated deterministically from request volume distributions and average stage rework timings.
                  Effort estimates assume standard SAP-HR API and Microsoft Power Automate connector integrations.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
