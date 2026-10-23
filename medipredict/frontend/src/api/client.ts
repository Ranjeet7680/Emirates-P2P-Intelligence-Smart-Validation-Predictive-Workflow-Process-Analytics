const API_BASE = import.meta.env.VITE_MEDIPREDICT_API_URL || 'http://127.0.0.1:8001/api/v1';

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

function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  const t = token || localStorage.getItem('medipredict_token');
  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }
  return headers;
}

export const api = {
  // Auth
  login: (payload: { email: string; password: string }) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  register: (payload: { email: string; password: string; full_name: string; role?: string }) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  getMe: (token?: string) =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  // Assistant
  chat: (payload: { message: string; conversation_history?: any[]; attached_report_id?: string }, token?: string) =>
    fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  getTopics: () => fetch(`${API_BASE}/assistant/topics`).then(handleResponse),

  // Reports
  uploadReport: (formData: FormData, token?: string) =>
    fetch(`${API_BASE}/reports/upload`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: formData,
    }).then(handleResponse),

  listReports: (token?: string) =>
    fetch(`${API_BASE}/reports`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  getReportDetail: (id: string, token?: string) =>
    fetch(`${API_BASE}/reports/${id}`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  correctMeasurement: (reportId: string, measId: string, payload: { value_numeric: number; units?: string; ref_low?: number; ref_high?: number }, token?: string) =>
    fetch(`${API_BASE}/reports/${reportId}/measurements/${measId}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  getPdfSummaryUrl: (reportId: string) => `${API_BASE}/reports/${reportId}/pdf-summary`,

  // Metrics
  getMetrics: (params: { metric_type?: string; limit?: number } = {}, token?: string) => {
    const q = new URLSearchParams();
    if (params.metric_type) q.append('metric_type', params.metric_type);
    if (params.limit) q.append('limit', String(params.limit));
    return fetch(`${API_BASE}/metrics?${q.toString()}`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse);
  },

  recordMetric: (payload: { metric_type: string; value: number; unit: string; notes?: string }, token?: string) =>
    fetch(`${API_BASE}/metrics`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  deleteMetric: (id: string, token?: string) =>
    fetch(`${API_BASE}/metrics/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  getTrends: (days = 30, token?: string) =>
    fetch(`${API_BASE}/metrics/trends?days=${days}`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  getExportCsvUrl: () => `${API_BASE}/metrics/export-csv`,

  // Diseases & Genetics
  listDiseases: (params: { search?: string; specialty?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.specialty) q.append('specialty', params.specialty);
    return fetch(`${API_BASE}/diseases?${q.toString()}`).then(handleResponse);
  },

  getDisease: (id: string) => fetch(`${API_BASE}/diseases/${id}`).then(handleResponse),

  listGenes: (params: { search?: string; inheritance?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.inheritance) q.append('inheritance', params.inheritance);
    return fetch(`${API_BASE}/genetics/genes?${q.toString()}`).then(handleResponse);
  },

  getGene: (symbol: string) => fetch(`${API_BASE}/genetics/genes/${symbol}`).then(handleResponse),

  // Research
  searchPubMed: (query: string, limit = 10, token?: string) =>
    fetch(`${API_BASE}/research/pubmed?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  savePaper: (paper: any, collection = 'General Research', token?: string) =>
    fetch(`${API_BASE}/research/save?collection_name=${encodeURIComponent(collection)}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(paper),
    }).then(handleResponse),

  getSavedPapers: (token?: string) =>
    fetch(`${API_BASE}/research/saved`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  getCitation: (pmid: string, style = 'apa') =>
    fetch(`${API_BASE}/research/citation?pmid=${pmid}&style=${style}`).then(handleResponse),

  // Risk Lab
  getRiskModels: () => fetch(`${API_BASE}/risk-lab/models`).then(handleResponse),

  predictRisk: (payload: { model_id: string; features: Record<string, number> }, token?: string) =>
    fetch(`${API_BASE}/risk-lab/predict`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),

  // Clinician
  getClinicianQueue: (token?: string) =>
    fetch(`${API_BASE}/clinician/queue`, {
      headers: getAuthHeaders(token),
    }).then(handleResponse),

  verifyReport: (reportId: string, clinicalNotes: string, token?: string) =>
    fetch(`${API_BASE}/clinician/reports/${reportId}/verify`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinical_notes: clinicalNotes }),
    }).then(handleResponse),

  // Admin
  getAdminHealth: () => fetch(`${API_BASE}/admin/health`).then(handleResponse),
  getAuditLogs: (limit = 50) => fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`).then(handleResponse),
  getAIProviders: () => fetch(`${API_BASE}/admin/ai-providers`).then(handleResponse),
};
