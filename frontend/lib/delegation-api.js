// Smart environment detection
const isDev = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
// Browser: relative URLs to avoid mixed-content; Dev: direct to service
const gateway = typeof window !== 'undefined'
  ? '' // Browser: relative URLs
  : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/?$/, '') || 'http://localhost:8080');
const AUTHZ_DEV_URL = process.env.NEXT_PUBLIC_AUTHORIZATION_API_URL || 'http://localhost:5014';
const BASE = isDev ? AUTHZ_DEV_URL : gateway;
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
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.status === 204 ? null : res.json().catch(() => ({}));
  } catch (error) {
    console.warn(`[API Exception] ${error.message}`);
    throw error;
  }
}

export const delegationApi = {
  list: () => http('GET', `${AUTHZ}/delegations`),
  create: (data) => http('POST', `${AUTHZ}/delegations`, data),
  activate: (id) => http('PUT', `${AUTHZ}/delegations/${id}/activate`),
  deactivate: (id) => http('PUT', `${AUTHZ}/delegations/${id}/deactivate`),
};

// ============================================================
// Auto-Delegation API - نظام التفويض التلقائي
// يتصل بـ Next.js API routes التي تُوكّل للـ Approvals Backend
// ============================================================

const AUTO_DELEGATION_BASE = '/api/approvals/auto-delegations';

async function platformHttp(method, url, body) {
  try {
    console.log(`[AutoDelegation API] ${method} ${url}`);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.status === 204 ? null : res.json().catch(() => ({}));
  } catch (error) {
    console.warn(`[AutoDelegation API Exception] ${error.message}`);
    throw error;
  }
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
}

export const autoDelegationApi = {
  /** الحصول على جميع التفويضات مع فلاتر اختيارية */
  getAll: (params = {}) =>
    platformHttp('GET', `${AUTO_DELEGATION_BASE}${buildQuery(params)}`),

  /** الحصول على تفويض بالمعرّف */
  getById: (id) =>
    platformHttp('GET', `${AUTO_DELEGATION_BASE}/${id}`),

  /** التفويضات النشطة لموظف معين (بوصفه مفوِّضاً) */
  getActive: (employeeId) =>
    platformHttp('GET', `${AUTO_DELEGATION_BASE}${buildQuery({ status: 1, delegatorEmployeeId: employeeId })}`),

  /** التفويضات التي يعمل فيها الموظف بوصفه نائباً */
  getActingAs: (employeeId) =>
    platformHttp('GET', `${AUTO_DELEGATION_BASE}${buildQuery({ status: 1, delegateEmployeeId: employeeId })}`),

  /** إنشاء تفويض جديد */
  create: (data) =>
    platformHttp('POST', AUTO_DELEGATION_BASE, data),

  /** تفعيل تفويض */
  activate: (id) =>
    platformHttp('POST', `${AUTO_DELEGATION_BASE}/${id}/activate`),

  /** إلغاء تفويض مع ذكر السبب */
  deactivate: (id, reason) =>
    platformHttp('POST', `${AUTO_DELEGATION_BASE}/${id}/deactivate`, { reason }),

  /** التفويض الحالي للموظف (للتحقق السريع) */
  getDelegateFor: (employeeId) =>
    platformHttp('GET', `${AUTO_DELEGATION_BASE}${buildQuery({ delegatorEmployeeId: employeeId, status: 1 })}`),
};
