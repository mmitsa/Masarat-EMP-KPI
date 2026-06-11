/**
 * بيانات محفظة التعزيزات المالية
 * Financial Allocation Wallet - Mock Data & Helpers
 */

// ═══════════════════════════════════════════════════════════
// أنواع العمليات
// ═══════════════════════════════════════════════════════════

export const TRANSACTION_TYPES = {
    commitment: { label: 'ارتباط', color: 'orange', icon: '📋' },
    release: { label: 'تحرير', color: 'green', icon: '✅' },
    topup: { label: 'إيداع', color: 'blue', icon: '💰' },
    adjustment: { label: 'تعديل', color: 'gray', icon: '⚙️' },
};

export const REFERENCE_TYPES = {
    secondment: { label: 'انتداب', color: 'purple' },
    overtime: { label: 'عمل إضافي', color: 'indigo' },
    topup: { label: 'إيداع', color: 'blue' },
    adjustment: { label: 'تعديل', color: 'gray' },
};

export const WALLET_STATUSES = {
    active: { label: 'نشطة', color: 'green' },
    frozen: { label: 'مجمّدة', color: 'red' },
    depleted: { label: 'نفدت', color: 'orange' },
};

export const TOPUP_SOURCES = [
    { value: 'operational', label: 'ميزانية تشغيلية' },
    { value: 'additional', label: 'اعتماد إضافي' },
    { value: 'transfer', label: 'نقل من بند آخر' },
    { value: 'other', label: 'أخرى' },
];

// ═══════════════════════════════════════════════════════════
// دوال حساب التكلفة
// ═══════════════════════════════════════════════════════════

/**
 * حساب عدد الأيام بين تاريخين
 */
export function calculateDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * حساب تكلفة الانتداب التقديرية
 * @param {number} dailyAllowance - البدل اليومي
 * @param {string} startDate - تاريخ البداية
 * @param {string} endDate - تاريخ النهاية
 * @returns {number} التكلفة التقديرية
 */
export function estimateSecondmentCost(dailyAllowance, startDate, endDate) {
    const days = calculateDays(startDate, endDate);
    return Math.round(Number(dailyAllowance || 0) * days);
}

/**
 * معامل التعويض حسب النوع
 */
export function getCompensationMultiplier(compensationType) {
    const multipliers = {
        financial_150: 1.5,
        financial_200: 2.0,
        financial_125: 1.25,
        compensatory: 0,  // لا تكلفة مالية (إجازة تعويضية)
    };
    return multipliers[compensationType] || 1.5;
}

/**
 * حساب تكلفة العمل خارج الدوام التقديرية
 * @param {number} employeeCount - عدد الموظفين
 * @param {string} compensationType - نوع التعويض
 * @param {number} dailyHours - ساعات العمل اليومية
 * @param {string} startDate - تاريخ البداية
 * @param {string} endDate - تاريخ النهاية
 * @param {number} avgBaseSalary - متوسط الراتب الأساسي (افتراضي 15000)
 * @returns {number} التكلفة التقديرية
 */
export function estimateOvertimeCost(
    employeeCount,
    compensationType,
    dailyHours,
    startDate,
    endDate,
    avgBaseSalary = 15000
) {
    if (compensationType === 'compensatory') return 0;

    const days = calculateDays(startDate, endDate);
    const multiplier = getCompensationMultiplier(compensationType);
    // حساب تقديري: (الراتب / 30 يوم / 8 ساعات) × المعامل × الساعات × الأيام × العدد
    const hourlyRate = (avgBaseSalary / 30 / 8) * multiplier;
    return Math.round(employeeCount * days * Number(dailyHours || 0) * hourlyRate);
}

/**
 * تنسيق المبلغ بالريال السعودي
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatWalletDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * حساب نسبة الاستخدام
 */
export function getUtilizationPercent(wallet) {
    if (!wallet || wallet.totalAllocated === 0) return 0;
    return Math.round((wallet.totalCommitted / wallet.totalAllocated) * 100);
}

/**
 * تحديد لون شريط التقدم حسب الاستخدام
 */
export function getUtilizationColor(percent) {
    if (percent < 70) return { from: 'from-emerald-400', to: 'to-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (percent < 90) return { from: 'from-amber-400', to: 'to-amber-600', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { from: 'from-red-400', to: 'to-red-600', text: 'text-red-600', bg: 'bg-red-50' };
}

/**
 * توليد رقم عملية جديد
 */
export function generateTransactionId() {
    const num = Date.now().toString().slice(-4);
    return `TXN-${num}`;
}

/**
 * حساب إحصائيات الشهر الحالي
 */
export function getMonthlyStats(transactions) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTxns = transactions.filter(t => new Date(t.createdAt) >= monthStart);

    const topups = monthTxns.filter(t => t.type === 'topup');
    const commitments = monthTxns.filter(t => t.type === 'commitment');
    const overrides = monthTxns.filter(t => t.authorityOverride);

    return {
        depositsThisMonth: topups.reduce((sum, t) => sum + t.amount, 0),
        depositsCount: topups.length,
        commitmentsThisMonth: commitments.reduce((sum, t) => sum + t.amount, 0),
        commitmentsCount: commitments.length,
        overridesCount: overrides.length,
        avgDecisionCost: commitments.length > 0
            ? Math.round(commitments.reduce((sum, t) => sum + t.amount, 0) / commitments.length)
            : 0,
        highestDecision: commitments.length > 0
            ? Math.max(...commitments.map(t => t.amount))
            : 0,
    };
}
