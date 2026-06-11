/**
 * عميل التكامل مع المنظومة الحكومية المتكاملة
 * يُستخدم في المنصة الموحدة (مسارات) للتواصل مع:
 * - خدمة المصادقة الموحدة (SSO)
 * - خدمة المزامنة (Sync)
 * - خدمة الأحداث (Events)
 */

const INTEGRATION_URL = process.env.NEXT_PUBLIC_INTEGRATION_URL || 'http://localhost:9000'
const INTEGRATION_KEY = process.env.INTEGRATION_API_KEY || ''
const PLATFORM_NAME = 'masarat'

async function integrationRequest(path, options = {}) {
  const res = await fetch(`${INTEGRATION_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Integration-Key': INTEGRATION_KEY,
      'X-Source-Platform': PLATFORM_NAME,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Integration error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── SSO ──────────────────────────────────────────────────────
export const ssoApi = {
  /** تحقق من JWT الموحد */
  validate: (token) =>
    integrationRequest('/api/sso/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  /** تسجيل دخول موحد */
  login: (employee_id, password, tenant_code) =>
    integrationRequest('/api/sso/login', {
      method: 'POST',
      body: JSON.stringify({ employee_id, password, tenant_code, platform: PLATFORM_NAME }),
    }),

  /** بيانات المستخدم */
  me: (token) =>
    integrationRequest('/api/sso/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** تجديد الرمز */
  refresh: (refreshToken) =>
    integrationRequest('/api/sso/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
}

// ── Sync ─────────────────────────────────────────────────────
export const syncApi = {
  /** مزامنة مستخدم */
  syncUser: (userData) =>
    integrationRequest('/api/sync/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  /** ربط حساب المنصة */
  linkAccount: (employee_id, platform_user_id, tenant_code) =>
    integrationRequest('/api/sync/link-platform', {
      method: 'POST',
      body: JSON.stringify({ employee_id, platform: PLATFORM_NAME, platform_user_id, tenant_code }),
    }),

  /** الملف الشخصي المتكامل */
  getProfile: (employee_id, token) =>
    integrationRequest(`/api/sync/profile/${employee_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** مزامنة أداء */
  syncPerformance: (data) =>
    integrationRequest('/api/sync/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Events ───────────────────────────────────────────────────
export const eventsApi = {
  /** نشر حدث */
  publish: (event_type, payload, tenant_code, actor_id) =>
    integrationRequest('/api/events/webhook', {
      method: 'POST',
      body: JSON.stringify({ event_type, source_platform: PLATFORM_NAME, payload, tenant_code, actor_id }),
    }),

  /** جلب الأحداث */
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return integrationRequest(`/api/events/?${qs}`)
  },

  /** إحصائيات */
  stats: (tenant_code) =>
    integrationRequest(`/api/events/stats${tenant_code ? `?tenant_code=${tenant_code}` : ''}`),
}

// ── Admin ────────────────────────────────────────────────────
export const platformAdminApi = {
  /** لوحة التحكم */
  dashboard: (token) =>
    integrationRequest('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** قائمة الجهات */
  tenants: (token) =>
    integrationRequest('/api/admin/tenants', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** قائمة المستخدمين */
  users: (params, token) => {
    const qs = new URLSearchParams(params).toString()
    return integrationRequest(`/api/admin/users?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── Health ───────────────────────────────────────────────────
export const integrationHealth = () =>
  integrationRequest('/health').catch(() => ({ status: 'disconnected' }))
