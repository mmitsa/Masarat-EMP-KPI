/**
 * Setup API Adapter - محول API للتهيئة
 * يربط خدمة التهيئة بالـ APIs الخلفية الحقيقية
 * يدعم الفصل بين الجهات (Multi-Tenancy)
 *
 * @version 1.0.0
 * @date 2026-02-07
 */

import { getSession } from 'next-auth/react';

// Browser: relative URLs to avoid mixed-content; Server: direct Gateway URL
const GATEWAY_URL = typeof window !== 'undefined'
    ? '' // Browser: relative URLs, proxied by Next.js catch-all
    : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080');

// ═══════════════════════════════════════════════════════════════════
// تكوين الـ API لكل موديول
// ═══════════════════════════════════════════════════════════════════

const MODULE_API_CONFIG = {
    // ═══════════════════════════════════════════════════════════════════
    // الموارد البشرية - HR Module
    // الـ Gateway يزيل /api/hr ويوجه إلى HR API
    // ═══════════════════════════════════════════════════════════════════
    Departments: { module: 'hr', endpoint: '/api/hr/departments' },
    Positions: { module: 'hr', endpoint: '/api/hr/jobs' }, // JobsController
    Employees: { module: 'hr', endpoint: '/api/hr/employees' },
    LeaveTypes: { module: 'hr', endpoint: '/api/hr/leaves/types' }, // LeavesController
    LeaveBalances: { module: 'hr', endpoint: '/api/hr/leaves/balances' }, // LeavesController

    // ═══════════════════════════════════════════════════════════════════
    // المستودعات - Warehouse Module
    // ═══════════════════════════════════════════════════════════════════
    Warehouses: { module: 'warehouse', endpoint: '/api/warehouse/warehouses' },
    ItemCategories: { module: 'warehouse', endpoint: '/api/warehouse/items-master/categories' },
    UnitsOfMeasure: { module: 'warehouse', endpoint: '/api/warehouse/items-master/units' },
    Items: { module: 'warehouse', endpoint: '/api/warehouse/items-master' },
    InventoryOpeningBalances: { module: 'warehouse', endpoint: '/api/warehouse/items-master/opening-balances' },

    // ═══════════════════════════════════════════════════════════════════
    // الأصول الثابتة - Fixed Assets (IPSAS 45/46)
    // ═══════════════════════════════════════════════════════════════════
    FixedAssetCategories: { module: 'warehouse', endpoint: '/api/warehouse/fixed-assets/categories' },
    FixedAssets: { module: 'warehouse', endpoint: '/api/warehouse/fixed-assets' },

    // ═══════════════════════════════════════════════════════════════════
    // العهد - Custody Management
    // يربط الأصول والأصناف بالموظفين مع تتبع الحالة والمسؤولية
    // ═══════════════════════════════════════════════════════════════════
    EmployeeCustody: { module: 'warehouse', endpoint: '/api/warehouse/employee-custody' },
    FinancialCustody: { module: 'warehouse', endpoint: '/api/warehouse/financial-custody' },
    KindCustody: { module: 'warehouse', endpoint: '/api/warehouse/kind-custody' },
    AssetCustody: { module: 'warehouse', endpoint: '/api/warehouse/fixed-assets/custody' },

    // ═══════════════════════════════════════════════════════════════════
    // إدارة الحركة - Movement Module
    // ═══════════════════════════════════════════════════════════════════
    Vehicles: { module: 'movement', endpoint: '/api/movement/vehicles' },
    Drivers: { module: 'movement', endpoint: '/api/movement/drivers' },

    // ═══════════════════════════════════════════════════════════════════
    // الإدارة المالية - Finance Module (عبر Sadad)
    // ملاحظة: المالية حالياً تحت Sadad حتى يتم إضافة finance-route
    // ═══════════════════════════════════════════════════════════════════
    ChartOfAccounts: { module: 'sadad', endpoint: '/api/sadad/general-ledger/accounts' },
    CostCenters: { module: 'sadad', endpoint: '/api/sadad/general-ledger/cost-centers' },
    BankAccounts: { module: 'sadad', endpoint: '/api/sadad/accounts-payable/banks' },
    GLOpeningBalances: { module: 'sadad', endpoint: '/api/sadad/general-ledger/opening-balances' },

    // ═══════════════════════════════════════════════════════════════════
    // الأرشفة - Archiving Module
    // ═══════════════════════════════════════════════════════════════════
    DocumentCategories: { module: 'archiving', endpoint: '/api/archiving/classifications' },

    // ═══════════════════════════════════════════════════════════════════
    // قياس الأداء - EPM Module
    // ═══════════════════════════════════════════════════════════════════
    KPIDefinitions: { module: 'epm', endpoint: '/api/epm/performance/kpis' },
    EvaluationCriteria: { module: 'epm', endpoint: '/api/epm/performance/criteria' },

    // ═══════════════════════════════════════════════════════════════════
    // تتبع التهيئة - Setup (Frontend API Routes)
    // ═══════════════════════════════════════════════════════════════════
    SetupProgress: { module: 'setup', endpoint: '/api/setup/progress' },
    ActivityLog: { module: 'setup', endpoint: '/api/setup/activity-log' },
};

// ═══════════════════════════════════════════════════════════════════
// دالة الطلب الموحدة مع المصادقة
// ═══════════════════════════════════════════════════════════════════

async function apiRequest(endpoint, options = {}, session = null) {
    if (!session) {
        session = await getSession();
    }

    if (!session?.accessToken) {
        throw new Error('يجب تسجيل الدخول للوصول إلى هذه الخدمة');
    }

    const url = `${GATEWAY_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
        'X-Tenant-Id': String(session.user?.tenantId || '1'),
        'X-Tenant-Code': session.user?.tenantCode || '',
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `خطأ في الاتصال: ${response.status}`);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }

        // بعض الاستجابات قد تكون فارغة (مثل DELETE)
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('تعذر الاتصال بالخادم. تأكد من تشغيل الخدمات الخلفية.');
        }
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════
// دوال قاعدة البيانات الموحدة
// ═══════════════════════════════════════════════════════════════════

/**
 * إدراج سجل جديد
 */
export async function insert(tableName, data, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    return apiRequest(config.endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    }, session);
}

/**
 * تحديث سجل موجود
 */
export async function update(tableName, id, data, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    return apiRequest(`${config.endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }, session);
}

/**
 * حذف سجل
 */
export async function remove(tableName, id, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    return apiRequest(`${config.endpoint}/${id}`, {
        method: 'DELETE',
    }, session);
}

/**
 * البحث عن سجل بالمعرف
 */
export async function findById(tableName, id, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    try {
        return await apiRequest(`${config.endpoint}/${id}`, {
            method: 'GET',
        }, session);
    } catch (error) {
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * البحث عن سجل بحقل معين
 */
export async function findBy(tableName, field, value, tenantId = null, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    try {
        const params = new URLSearchParams({
            [field]: value,
            ...(tenantId && { tenant_id: tenantId }),
        });

        const result = await apiRequest(`${config.endpoint}?${params}`, {
            method: 'GET',
        }, session);

        // API يعيد مصفوفة، نأخذ أول عنصر
        const records = result?.data || result || [];
        return Array.isArray(records) && records.length > 0 ? records[0] : null;
    } catch (error) {
        if (error.status === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * جلب جميع السجلات بشرط معين
 */
export async function findAll(tableName, conditions = {}, tenantId = null, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    const params = new URLSearchParams({
        ...conditions,
        ...(tenantId && { tenant_id: tenantId }),
    });

    try {
        const result = await apiRequest(`${config.endpoint}?${params}`, {
            method: 'GET',
        }, session);

        return result?.data || result || [];
    } catch (error) {
        if (error.status === 404) {
            return [];
        }
        throw error;
    }
}

/**
 * عدد السجلات
 */
export async function count(tableName, conditions = {}, tenantId = null, session = null) {
    const records = await findAll(tableName, conditions, tenantId, session);
    return records.length;
}

/**
 * التحقق من وجود سجل
 */
export async function exists(tableName, field, value, tenantId = null, session = null) {
    const record = await findBy(tableName, field, value, tenantId, session);
    return record !== null;
}

/**
 * إدراج مجموعة من السجلات (Bulk Insert)
 */
export async function insertMany(tableName, records, session = null) {
    const config = MODULE_API_CONFIG[tableName];
    if (!config) {
        throw new Error(`جدول غير معروف: ${tableName}`);
    }

    // محاولة استخدام API الإدراج الجماعي إن وجد
    try {
        return await apiRequest(`${config.endpoint}/bulk`, {
            method: 'POST',
            body: JSON.stringify({ records }),
        }, session);
    } catch (error) {
        // إذا لم يكن API الإدراج الجماعي متاحاً، نستخدم الإدراج الفردي
        if (error.status === 404) {
            const results = [];
            for (const data of records) {
                const result = await insert(tableName, data, session);
                results.push(result);
            }
            return results;
        }
        throw error;
    }
}

/**
 * تحديث أو إدراج سجل (Upsert)
 */
export async function upsert(tableName, keyField, data, tenantId = null, session = null) {
    const existingRecord = await findBy(tableName, keyField, data[keyField], tenantId, session);

    if (existingRecord) {
        return update(tableName, existingRecord.id, data, session);
    } else {
        return insert(tableName, data, session);
    }
}

// ═══════════════════════════════════════════════════════════════════
// إدارة المعاملات (Transactions)
// ═══════════════════════════════════════════════════════════════════

// حالة المعاملة الحالية
let transactionState = null;
let transactionRecords = [];

/**
 * بدء معاملة
 */
export async function beginTransaction() {
    transactionState = 'active';
    transactionRecords = [];
    return { status: 'started' };
}

/**
 * تأكيد المعاملة
 * ملاحظة: في الوضع الحالي، السجلات تُحفظ فوراً
 * في الإنتاج، يجب استخدام Distributed Transactions أو Saga Pattern
 */
export async function commit() {
    transactionState = null;
    transactionRecords = [];
    return { status: 'committed' };
}

/**
 * التراجع عن المعاملة
 * ملاحظة: هذا يتطلب حذف السجلات المضافة
 */
export async function rollback(session = null) {
    // حذف السجلات التي تم إدراجها خلال المعاملة
    for (const record of transactionRecords.reverse()) {
        try {
            await remove(record.tableName, record.id, session);
        } catch (error) {
            console.error('خطأ في التراجع عن السجل:', error);
        }
    }

    transactionState = null;
    transactionRecords = [];
    return { status: 'rolled_back' };
}

// ═══════════════════════════════════════════════════════════════════
// تسجيل النشاط
// ═══════════════════════════════════════════════════════════════════

/**
 * تسجيل نشاط الاستيراد
 */
export async function logActivity(action, details, userId, tenantId, session = null) {
    try {
        return await apiRequest('/api/setup/activity-log', {
            method: 'POST',
            body: JSON.stringify({
                action,
                details,
                user_id: userId,
                tenant_id: tenantId,
                timestamp: new Date().toISOString(),
            }),
        }, session);
    } catch (error) {
        // لا نوقف العملية إذا فشل التسجيل
        console.warn('فشل تسجيل النشاط:', error);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════
// إدارة تقدم التهيئة
// ═══════════════════════════════════════════════════════════════════

/**
 * حفظ تقدم التهيئة
 */
export async function saveSetupProgress(templateId, status, recordsCount, tenantId, session = null) {
    return apiRequest('/api/setup/progress', {
        method: 'POST',
        body: JSON.stringify({
            template_id: templateId,
            status,
            records_imported: recordsCount,
            tenant_id: tenantId,
            updated_at: new Date().toISOString(),
        }),
    }, session);
}

/**
 * جلب تقدم التهيئة
 */
export async function getSetupProgress(tenantId, session = null) {
    try {
        return await apiRequest(`/api/setup/progress?tenant_id=${tenantId}`, {
            method: 'GET',
        }, session);
    } catch (error) {
        return {};
    }
}

// ═══════════════════════════════════════════════════════════════════
// التحقق من المتطلبات المسبقة (Dependencies)
// ═══════════════════════════════════════════════════════════════════

const TEMPLATE_DEPENDENCIES = {
    // الموارد البشرية
    employees: ['departments', 'positions'],
    leave_balances: ['employees', 'leave_types'],

    // المستودعات والمخزون
    items: ['item_categories', 'units_of_measure'],
    opening_balances: ['items', 'warehouses'],

    // الأصول الثابتة (IPSAS 45/46)
    fixed_asset_categories: ['chart_of_accounts'], // يتطلب دليل الحسابات للربط المالي
    fixed_assets: ['fixed_asset_categories', 'departments', 'employees'], // ربط بالأقسام والموظفين
    asset_custody: ['fixed_assets', 'employees'], // ربط الأصول بأمناء العهد

    // إدارة الحركة
    drivers: ['employees'],

    // المالية
    opening_balances_gl: ['chart_of_accounts'],
};

/**
 * التحقق من اكتمال المتطلبات المسبقة
 */
export async function checkDependencies(templateId, tenantId, session = null) {
    const dependencies = TEMPLATE_DEPENDENCIES[templateId] || [];

    if (dependencies.length === 0) {
        return { satisfied: true, missing: [] };
    }

    const progress = await getSetupProgress(tenantId, session);
    const missing = [];

    for (const dep of dependencies) {
        const depProgress = progress[dep];
        if (!depProgress || depProgress.status !== 'completed' || depProgress.records_imported === 0) {
            missing.push(dep);
        }
    }

    return {
        satisfied: missing.length === 0,
        missing,
    };
}

// ═══════════════════════════════════════════════════════════════════
// تصدير كائن قاعدة البيانات
// ═══════════════════════════════════════════════════════════════════

const db = {
    insert,
    update,
    remove,
    findById,
    findBy,
    findAll,
    count,
    exists,
    insertMany,
    upsert,
    beginTransaction,
    commit,
    rollback,
    logActivity,
    saveSetupProgress,
    getSetupProgress,
    checkDependencies,
};

export default db;
