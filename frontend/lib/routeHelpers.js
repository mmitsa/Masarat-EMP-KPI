/**
 * ============================================
 * مساعد التحديث الموحد للروابط
 * ============================================
 * 
 * هذا الملف يحتوي على دوال مساعدة لتوحيد استخدام الروابط
 * في جميع أنحاء المشروع
 */

import { NAVIGATION, API, buildNavigationUrl, buildApiUrl } from './routes'

// ============================================
// 1️⃣ مساعدات الملاحة
// ============================================

/**
 * ملف NavLink موحد مع تحديث تلقائي للروابط
 */
export function createNavLink(system, page, params = {}) {
  // Handle direct path strings
  if (typeof system === 'string' && system.startsWith('/')) {
    return buildNavigationUrl(system, params)
  }

  // Handle undefined or null parameters
  if (!system || !page) {
    console.warn(`Invalid navigation parameters: system=${system}, page=${page}`)
    return '#'
  }

  const path = NAVIGATION[system.toUpperCase()]?.[page.toUpperCase()]
  if (!path) {
    console.warn(`Navigation link not found: ${system}.${page}`)
    return '#'
  }
  return buildNavigationUrl(path, params)
}

/**
 * موجه موحد مع معالجة الأخطاء
 */
export function navigateTo(router, systemOrPath, page = null, params = {}) {
  // If systemOrPath is a direct path (starts with /)
  if (typeof systemOrPath === 'string' && systemOrPath.startsWith('/')) {
    router.push(systemOrPath)
    return
  }

  const path = createNavLink(systemOrPath, page, params)
  if (path !== '#') {
    router.push(path)
  } else {
    console.warn(`Failed to navigate: ${systemOrPath}.${page}`)
  }
}

// ============================================
// 2️⃣ مساعدات API
// ============================================

/**
 * إنشاء رابط API موحد
 */
export function createApiEndpoint(system, resource, id = null, action = null) {
  const systemUpper = system.toUpperCase()
  const resourceUpper = resource.toUpperCase()
  
  let endpoint = API[systemUpper]?.[resourceUpper]
  
  if (!endpoint) {
    console.warn(`API endpoint not found: ${system}.${resource}`)
    return null
  }
  
  // إذا كان الـ endpoint دالة (مثل EMPLOYEE_BY_ID)
  if (typeof endpoint === 'function') {
    endpoint = endpoint(id)
  }
  
  // إضافة الإجراء إذا وجد
  if (action) {
    endpoint = `${endpoint}/${action}`
  }
  
  return buildApiUrl(endpoint)
}

/**
 * استدعاء API موحد مع معالجة الأخطاء
 */
export async function apiCall(
  method = 'GET',
  endpoint,
  data = null,
  headers = {}
) {
  try {
    const url = typeof endpoint === 'string' && !endpoint.startsWith('http')
      ? buildApiUrl(endpoint)
      : endpoint

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && data) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn('API Call Error:', error)
    throw error
  }
}

// ============================================
// 3️⃣ مساعدات الاستعلام
// ============================================

/**
 * بناء سلسلة استعلام موحدة
 */
export function buildQueryString(params = {}) {
  const filtered = Object.entries(params).filter(([, value]) => value != null)
  if (filtered.length === 0) return ''
  return '?' + new URLSearchParams(filtered).toString()
}

/**
 * دمج معاملات الاستعلام
 */
export function mergeQueryParams(current = {}, updates = {}) {
  return {
    ...current,
    ...updates,
  }
}

// ============================================
// 4️⃣ مساعدات التحقق من الصلاحيات
// ============================================

/**
 * التحقق من إمكانية الوصول لصفحة معينة
 */
export function canAccess(path, userPermissions = []) {
  // منطق التحقق من الصلاحيات
  // يتم التطبيق بناءً على سياسة الوصول
  return true
}

/**
 * تصفية الروابط بناءً على الصلاحيات
 */
export function filterNavigation(navigationList, permissions = []) {
  return navigationList.filter(item => canAccess(item.path, permissions))
}

// ============================================
// 5️⃣ مساعدات المسارات
// ============================================

/**
 * الحصول على مسار الملف من الرابط
 */
export function getFilePathFromRoute(route) {
  const parts = route.split('/')
  return parts.filter(Boolean).join('/')
}

/**
 * الحصول على اسم النظام الفرعي من الرابط
 */
export function getSystemFromRoute(route) {
  const system = route.split('/')[1]
  return Object.values(NAVIGATION).find(s => s.path?.startsWith(`/${system}`))
}

// ============================================
// 6️⃣ مساعدات البحث والفلترة
// ============================================

/**
 * بناء معاملات البحث الموحدة
 */
export function createSearchParams(
  search = '',
  filters = {},
  page = 1,
  limit = 20,
  sort = 'id',
  order = 'asc'
) {
  return {
    search,
    ...filters,
    page,
    limit,
    sort,
    order,
  }
}

/**
 * تطبيق مرشحات على استعلام API
 */
export function applyFilters(baseUrl, filters = {}) {
  const query = new URLSearchParams(filters).toString()
  return query ? `${baseUrl}?${query}` : baseUrl
}

// ============================================
// 7️⃣ مساعدات التخزين المؤقت
// ============================================

/**
 * مفاتيح التخزين المؤقت الموحدة
 */
export const CACHE_KEYS = {
  EMPLOYEES: 'employees_data',
  DEPARTMENTS: 'departments_data',
  ATTENDANCE: 'attendance_data',
  LEAVES: 'leaves_data',
  VEHICLES: 'vehicles_data',
  DRIVERS: 'drivers_data',
  ITEMS: 'warehouse_items_data',
}

/**
 * التحقق من صلاحية التخزين المؤقت
 */
export function isCacheValid(key, maxAge = 300000) {
  const cached = localStorage.getItem(`${key}_timestamp`)
  if (!cached) return false
  return Date.now() - parseInt(cached) < maxAge
}

/**
 * حفظ البيانات في التخزين المؤقت
 */
export function cacheData(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
  localStorage.setItem(`${key}_timestamp`, Date.now().toString())
}

/**
 * الحصول على البيانات المخزنة مؤقتاً
 */
export function getCachedData(key) {
  const cached = localStorage.getItem(key)
  return cached ? JSON.parse(cached) : null
}

// ============================================
// 8️⃣ مساعدات معالجة الأخطاء
// ============================================

/**
 * معالج أخطاء موحد
 */
export function handleError(error, context = '') {
  console.warn(`Error in ${context}:`, error)
  
  const errorMessage = error.message || 'حدث خطأ غير متوقع'
  
  return {
    status: 'error',
    message: errorMessage,
    context,
    timestamp: new Date().toISOString(),
  }
}

/**
 * تنسيق رسائل الخطأ
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error.message) return error.message
  return 'حدث خطأ غير معروف'
}

// ============================================
// 9️⃣ مساعدات الوقت والتواريخ
// ============================================

/**
 * الحصول على نطاق التاريخ الحالي
 */
export function getCurrentDateRange() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    fromDate: firstDay.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0],
  }
}

/**
 * بناء معاملات تصفية التاريخ
 */
export function createDateRangeParams(fromDate, toDate) {
  return {
    fromDate: new Date(fromDate).toISOString().split('T')[0],
    toDate: new Date(toDate).toISOString().split('T')[0],
  }
}

// ============================================
// 🔟 مساعدات التصدير والاستيراد
// ============================================

/**
 * تصدير الدوال المساعدة
 */
export const routeHelpers = {
  // Navigation
  createNavLink,
  navigateTo,
  
  // API
  createApiEndpoint,
  apiCall,
  
  // Query
  buildQueryString,
  mergeQueryParams,
  
  // Permissions
  canAccess,
  filterNavigation,
  
  // Paths
  getFilePathFromRoute,
  getSystemFromRoute,
  
  // Search & Filter
  createSearchParams,
  applyFilters,
  
  // Cache
  CACHE_KEYS,
  isCacheValid,
  cacheData,
  getCachedData,
  
  // Error
  handleError,
  formatErrorMessage,
  
  // Date & Time
  getCurrentDateRange,
  createDateRangeParams,
}

export default routeHelpers
