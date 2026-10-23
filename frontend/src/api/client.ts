/**
 * client.ts - Centralized Typed API Client for Emirates P2P Intelligence
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

async function handleResponse<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const json = await res.json();
      errorDetail = json.detail ? (typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail)) : JSON.stringify(json);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(handleResponse),

  // Positions & Rules
  getPositions: (params: { department?: string; vacant_only?: boolean; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.department) q.append('department', params.department);
    if (params.vacant_only) q.append('vacant_only', 'true');
    if (params.search) q.append('search', params.search);
    return fetch(`${API_BASE}/positions?${q.toString()}`).then(handleResponse);
  },

  getRules: () => fetch(`${API_BASE}/rules`).then(handleResponse),

  // SmartCheck Validation
  validateRequest: (payload: any) =>
    fetch(`${API_BASE}/requests/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // Requests
  createRequest: (payload: any) =>
    fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  getRequests: (params: { stage?: string; department?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.stage) q.append('stage', params.stage);
    if (params.department) q.append('department', params.department);
    if (params.limit) q.append('limit', String(params.limit));
    return fetch(`${API_BASE}/requests?${q.toString()}`).then(handleResponse);
  },

  getRequestDetail: (id: string) => fetch(`${API_BASE}/requests/${id}`).then(handleResponse),

  transitionRequest: (id: string, payload: { action: string; actor_role: string; team: string; reason_code?: string; comments?: string }) =>
    fetch(`${API_BASE}/requests/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // HR Queue
  getHrQueue: (params: { stage?: string; risk?: string; department?: string; unassigned_only?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.stage) q.append('stage', params.stage);
    if (params.risk) q.append('risk', params.risk);
    if (params.department) q.append('department', params.department);
    if (params.unassigned_only) q.append('unassigned_only', 'true');
    return fetch(`${API_BASE}/hr/queue?${q.toString()}`).then(handleResponse);
  },

  // Predictive ML
  scorePrediction: (payload: any) =>
    fetch(`${API_BASE}/predictions/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  getModelRegistry: () => fetch(`${API_BASE}/predictions/registry`).then(handleResponse),

  // ProcessLens Analytics
  getAnalyticsOverview: () => fetch(`${API_BASE}/analytics/overview`).then(handleResponse),
  getBottlenecks: () => fetch(`${API_BASE}/analytics/bottlenecks`).then(handleResponse),
  getReturnLoops: () => fetch(`${API_BASE}/analytics/loops`).then(handleResponse),
  getProcessVariants: () => fetch(`${API_BASE}/analytics/variants`).then(handleResponse),

  // Recommendations & Savings
  getRecommendations: () => fetch(`${API_BASE}/recommendations`).then(handleResponse),
  calculateSavings: (payload: { monthly_volume: number; avoidable_minutes_per_request: number; avoided_returns_share: number }) =>
    fetch(`${API_BASE}/recommendations/calculate-savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // BPI Challenge 2019 Enterprise Process Mining
  getBpiOverview: () => fetch(`${API_BASE}/bpi/overview`).then(handleResponse),

  // Audit
  getAuditEvents: (params: { object_id?: string; action?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.object_id) q.append('object_id', params.object_id);
    if (params.action) q.append('action', params.action);
    if (params.limit) q.append('limit', String(params.limit));
    return fetch(`${API_BASE}/audit?${q.toString()}`).then(handleResponse);
  },

  getExportPredictionsUrl: () => `${API_BASE}/export/test-predictions`
};
