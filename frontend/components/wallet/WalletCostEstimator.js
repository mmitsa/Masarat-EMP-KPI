/**
 * مكون تقدير التكلفة والتحقق من المحفظة
 * Wallet Cost Estimator
 *
 * مكون مضمّن يُدرج داخل نماذج إصدار القرارات (انتداب، عمل إضافي، إلخ)
 * للتحقق الفوري من كفاية رصيد المحفظة قبل الإصدار.
 *
 * يعرض:
 * - عنوان: "تقدير التكلفة والمحفظة"
 * - صف 1: التكلفة التقديرية
 * - صف 2: الرصيد المتاح
 * - صف 3: مؤشر الحالة (أربع حالات):
 *   1. تكلفة <= 0: رمادي محايد - "أدخل بيانات القرار لحساب التكلفة"
 *   2. رصيد كافٍ: أخضر - "رصيد كافٍ - يمكن إصدار القرار" + الرصيد بعد الارتباط
 *   3. يتطلب تجاوز: أصفر - "يتطلب موافقة صاحب الصلاحية" + checkbox
 *   4. محظور: أحمر - "لا يمكن إصدار القرار"
 * - حساب "الرصيد بعد الارتباط" عند كفاية الرصيد
 *
 * @requires WalletContext - سياق المحفظة للتحقق من الرصيد والصلاحيات
 * @requires walletData - مساعدات التنسيق
 *
 * @version 2.0.0
 * @date 2026-02-12
 */

import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency } from '../../lib/walletData';

/**
 * أيقونة صح (Check Circle)
 */
function CheckIcon({ className = 'w-5 h-5' }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

/**
 * أيقونة تحذير (Warning Triangle)
 */
function WarningIcon({ className = 'w-5 h-5' }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
        </svg>
    );
}

/**
 * أيقونة X (X Circle)
 */
function XIcon({ className = 'w-5 h-5' }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

/**
 * أيقونة معلومات (Info Circle)
 */
function InfoIcon({ className = 'w-5 h-5' }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

/**
 * WalletCostEstimator
 * مكون تقدير التكلفة المضمّن في نماذج القرارات
 *
 * @param {object} props
 * @param {number} [props.estimatedCost=0] - التكلفة التقديرية للقرار
 * @param {'secondment'|'overtime'} [props.decisionType='secondment'] - نوع القرار
 * @param {function} [props.onOverrideConfirm] - دالة تأكيد التجاوز (تُستدعى بـ true/false)
 * @param {boolean} [props.disabled=false] - تعطيل المكون
 */
const WalletCostEstimator = memo(function WalletCostEstimator({
    estimatedCost = 0,
    decisionType = 'secondment',
    onOverrideConfirm,
    disabled = false,
}) {
    const { wallet, canIssueDecision } = useWallet();

    // ── تحديد حالة القرار ──
    const decision = useMemo(
        () => canIssueDecision(estimatedCost),
        [canIssueDecision, estimatedCost]
    );

    // ── حساب الرصيد بعد الارتباط ──
    const balanceAfterCommitment = useMemo(() => {
        if (!wallet || estimatedCost <= 0) return 0;
        return wallet.availableBalance - estimatedCost;
    }, [wallet, estimatedCost]);

    // ── تحديد الحالة البصرية ──
    const status = useMemo(() => {
        if (estimatedCost <= 0) return 'neutral';
        if (decision.allowed) return 'sufficient';
        if (decision.requiresOverride) return 'override';
        return 'blocked';
    }, [estimatedCost, decision]);

    // ── أنماط الحالات ──
    const statusConfig = {
        neutral: {
            borderColor: 'border-gray-200 dark:border-gray-700',
            bg: 'bg-white dark:bg-gray-900',
        },
        sufficient: {
            borderColor: 'border-emerald-200',
            bg: 'bg-white dark:bg-gray-900',
        },
        override: {
            borderColor: 'border-amber-200',
            bg: 'bg-white dark:bg-gray-900',
        },
        blocked: {
            borderColor: 'border-red-200 dark:border-red-800',
            bg: 'bg-white dark:bg-gray-900',
        },
    };

    const config = statusConfig[status];

    return (
        <div
            className={`rounded-xl border shadow-sm dark:shadow-gray-900/20 ${config.bg} ${config.borderColor} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            dir="rtl"
            role="status"
            aria-live="polite"
            aria-label="تقدير التكلفة والمحفظة"
        >
            {/* ═══ العنوان ═══ */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                    </svg>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        تقدير التكلفة والمحفظة
                    </span>
                </div>
            </div>

            {/* ═══ المحتوى ═══ */}
            <div className="p-4 space-y-3">
                {/* ── صف 1: التكلفة التقديرية ── */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">التكلفة التقديرية</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {formatCurrency(estimatedCost)}
                    </span>
                </div>

                {/* ── صف 2: الرصيد المتاح ── */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">الرصيد المتاح</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {formatCurrency(wallet?.availableBalance || 0)}
                    </span>
                </div>

                {/* ── الخط الفاصل ── */}
                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* ── صف 3: مؤشر الحالة ── */}

                {/* الحالة 1: محايد - لا توجد تكلفة */}
                {status === 'neutral' && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <InfoIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            أدخل بيانات القرار لحساب التكلفة
                        </p>
                    </div>
                )}

                {/* الحالة 2: رصيد كافٍ */}
                {status === 'sufficient' && (
                    <div className="space-y-2.5">
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                            <CheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold text-emerald-700">
                                رصيد كاف - يمكن إصدار القرار
                            </p>
                        </div>

                        {/* الرصيد بعد الارتباط */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                الرصيد بعد الارتباط
                            </span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                {formatCurrency(balanceAfterCommitment)}
                            </span>
                        </div>
                    </div>
                )}

                {/* الحالة 3: يتطلب تجاوز */}
                {status === 'override' && (
                    <div className="space-y-2.5">
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                            <WarningIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold text-amber-700">
                                رصيد غير كاف - يتطلب موافقة صاحب الصلاحية
                            </p>
                        </div>

                        {/* مربع اختيار التجاوز */}
                        {onOverrideConfirm && (
                            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 cursor-pointer hover:bg-amber-100/70 transition-colors">
                                <input
                                    type="checkbox"
                                    onChange={(e) => onOverrideConfirm(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                                    اقر التجاوز بصلاحية صاحب الصلاحية
                                </span>
                            </label>
                        )}
                    </div>
                )}

                {/* الحالة 4: محظور */}
                {status === 'blocked' && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <XIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                لا يمكن إصدار القرار - الرصيد غير كاف والتجاوز غير مفعّل
                            </p>
                            <p className="text-xs text-red-500 mt-0.5">
                                تواصل مع الإدارة المالية لتعزيز المحفظة أو تفعيل خيار التجاوز
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

WalletCostEstimator.displayName = 'WalletCostEstimator';

WalletCostEstimator.propTypes = {
    /** التكلفة التقديرية للقرار */
    estimatedCost: PropTypes.number,
    /** نوع القرار (انتداب أو عمل إضافي) */
    decisionType: PropTypes.oneOf(['secondment', 'overtime']),
    /** دالة تأكيد التجاوز - تُستدعى بقيمة boolean */
    onOverrideConfirm: PropTypes.func,
    /** تعطيل المكون بالكامل */
    disabled: PropTypes.bool,
};

export default WalletCostEstimator;
