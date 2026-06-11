// Simple client for Authorization Workflow endpoints
// Browser: relative URLs to avoid mixed-content; Dev: direct to service
const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const AUTHZ_DEV_URL = process.env.NEXT_PUBLIC_AUTHORIZATION_API_URL || 'http://localhost:5014';
const BASE = isDev
  ? AUTHZ_DEV_URL  // مباشر للـ API في التطوير
  : (typeof window !== 'undefined' ? '' : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/?$/, '') || 'http://localhost:8080'));
const AUTHZ = `${BASE}/api/authorization`;

async function http(method, url, body) {
  try {
    console.log(`[API] ${method} ${url}`);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });
    if (!res.ok) {
      console.warn(`[API Error] ${res.status} ${res.statusText}`);
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    return res.status === 204 ? null : res.json().catch(() => ({}));
  } catch (error) {
    console.warn(`[API Exception] ${error.message}`);
    throw error;
  }
}

export const approvalApi = {
  positions: {
    list: (q) => http('GET', `${AUTHZ}/positions${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    create: (data) => http('POST', `${AUTHZ}/positions`, data),
    get: (id) => http('GET', `${AUTHZ}/positions/${id}`),
    update: (id, data) => http('PUT', `${AUTHZ}/positions/${id}`, data),
  },
  matrix: {
    entities: () => http('GET', `${AUTHZ}/approval-matrix/entities`),
    stages: (entityType) => http('GET', `${AUTHZ}/approval-matrix/${encodeURIComponent(entityType)}/stages`),
  },
  workflow: {
    initiate: (data) => http('POST', `${AUTHZ}/workflow/initiate`, data),
    approve: (data) => http('POST', `${AUTHZ}/workflow/approve`, data),
  }
};
