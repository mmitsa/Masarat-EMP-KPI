/**
 * بطاقة رصيد محفظة التعزيزات المالية
 * WalletBalanceCard - العنصر الرئيسي لعرض حالة المحفظة
 *
 * يعرض:
 * - رأس البطاقة بخلفية متدرجة ذهبية مع اسم المحفظة وحالتها والسنة المالية
 * - شبكة إحصائيات: المبلغ المخصص، المرتبط، المتاح
 * - شريط تقدم متحرك يعكس نسبة الاستخدام
 * - تذييل بآخر عملية وأزرار الإجراءات
 *
 * @version 1.0.0
 * @date 2026-02-12
 */

import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '../../context/WalletContext';
import {
    formatCurrency,
    formatWalletDate,
    getUtilizationPercent,
    getUtilizationColor,
    WALLET_STATUSES,
} from '../../lib/walletData';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * أيقونة المحفظة SVG
 * @param {object} props - className
 */
function WalletIcon({ className = 'w-8 h-8' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z" />
            <path d="M16 12a1 1 0 100 2 1 1 0 000-2z" fill="currentColor" />
            <path d="M3 7l9-4 9 4" />
        </svg>
    );
}

/**
 * هيكل التحميل (Skeleton) للبطاقة
 */
function BalanceCardSkeleton({ compact }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
            {/* رأس البطاقة */}
            <div className={`bg-gradient-to-l from-amber-400 to-yellow-500 ${compact ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20" />
                        <div className="space-y-2">
                            <div className="h-5 w-40 bg-white/30 rounded" />
                            <div className="h-3 w-24 bg-white/20 rounded" />
                        </div>
                    </div>
                    <div className="h-6 w-16 bg-white/20 rounded-full" />
                </div>
            </div>

            {/* الإحصائيات */}
            <div className={`grid grid-cols-3 gap-3 ${compact ? 'p-3' : 'p-5'}`}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl p-3 bg-gray-100 dark:bg-gray-700/50">
                        <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                        <div className="h-6 w-24 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            {/* شريط التقدم */}
            <div className={`${compact ? 'px-3 pb-3' : 'px-5 pb-5'}`}>
                <div className="h-3 w-full bg-gray-200 rounded-full" />
            </div>
        </div>
    );
}

/**
 * حالة فارغة عندما لا توجد محفظة
 */
function EmptyWalletState() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <WalletIcon className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                لا توجد محفظة
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                لم يتم إنشاء محفظة التعزيزات المالية بعد. تواصل مع الإدارة المالية.
            </p>
        </div>
    );
}

/**
 * تحديد نمط شارة الحالة
 * @param {string} status - حالة المحفظة
 * @returns {string} نمط Badge variant
 */
function getStatusVariant(status) {
    const map = {
        active: 'success',
        frozen: 'danger',
        depleted: 'warning',
    };
    return map[status] || 'default';
}

/**
 * WalletBalanceCard
 * بطاقة عرض رصيد المحفظة الرئيسية
 *
 * @param {object} props
 * @param {boolean} props.compact - الوضع المضغوط (حشوة أقل، بدون تذييل)
 * @param {boolean} props.showActions - عرض أزرار الإجراءات
 * @param {Function} props.onTopUp - استدعاء عند الضغط على زر الإيداع
 * @param {Function} props.onViewHistory - استدعاء عند الضغط على عرض السجل
 * @param {string} props.className - كلاسات CSS إضافية
 */
const WalletBalanceCard = memo(function WalletBalanceCard({
    compact = false,
    showActions = true,
    onTopUp,
    onViewHistory,
    className = '',
}) {
    const { wallet, transactions, loading } = useWallet();

    // نسبة الاستخدام ولونها
    const utilization = useMemo(() => {
        if (!wallet) return { percent: 0, color: getUtilizationColor(0) };
        const percent = getUtilizationPercent(wallet);
        return { percent, color: getUtilizationColor(percent) };
    }, [wallet]);

    // آخر عملية
    const lastTransaction = useMemo(() => {
        if (!transactions || transactions.length === 0) return null;
        return transactions[0];
    }, [transactions]);

    // ── حالة التحميل ──
    if (loading) {
        return <BalanceCardSkeleton compact={compact} />;
    }

    // ── حالة عدم وجود محفظة ──
    if (!wallet) {
        return <EmptyWalletState />;
    }

    const statusInfo = WALLET_STATUSES[wallet.status] || WALLET_STATUSES.active;

    return (
        <div
            className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}
            role="region"
            aria-label="بطاقة رصيد محفظة التعزيزات المالية"
        >
            {/* ═══ رأس البطاقة - خلفية ذهبية متدرجة ═══ */}
            <div
                className={`bg-gradient-to-l from-amber-500 to-yellow-600 text-white ${
                    compact ? 'px-4 py-3' : 'px-6 py-5'
                }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                            <WalletIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-bold text-white ${compact ? 'text-base' : 'text-lg'}`}>
                                {wallet.name}
                            </h3>
                            <p className="text-xs text-amber-100 mt-0.5">
                                السنة المالية {wallet.fiscalYear}
                            </p>
                        </div>
                    </div>

                    {/* شارة الحالة */}
                    <Badge
                        variant={getStatusVariant(wallet.status)}
                        size="sm"
                        dot
                        className="!bg-white/20 !text-white backdrop-blur-sm"
                        aria-label={`حالة المحفظة: ${statusInfo.label}`}
                    >
                        {statusInfo.label}
                    </Badge>
                </div>
            </div>

            {/* ═══ شبكة الإحصائيات ═══ */}
            <div className={`grid grid-cols-3 gap-3 ${compact ? 'p-3' : 'p-5'}`}>
                {/* المبلغ المخصص */}
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                    <p className="text-[11px] font-medium text-blue-500 mb-1">
                        المبلغ المخصص
                    </p>
                    <p className={`font-bold text-blue-700 dark:text-blue-300 ${compact ? 'text-sm' : 'text-base'}`}>
                        {formatCurrency(wallet.totalAllocated)}
                    </p>
                </div>

                {/* المرتبط */}
                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 p-3 text-center">
                    <p className="text-[11px] font-medium text-orange-500 mb-1">
                        المرتبط
                    </p>
                    <p className={`font-bold text-orange-700 ${compact ? 'text-sm' : 'text-base'}`}>
                        {formatCurrency(wallet.totalCommitted)}
                    </p>
                </div>

                {/* المتاح */}
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                    <p className="text-[11px] font-medium text-emerald-500 mb-1">
                        المتاح
                    </p>
                    <p className={`font-bold text-emerald-700 ${compact ? 'text-base' : 'text-xl'}`}>
                        {formatCurrency(wallet.availableBalance)}
                    </p>
                </div>
            </div>

            {/* ═══ شريط التقدم ═══ */}
            <div className={`${compact ? 'px-3 pb-3' : 'px-5 pb-4'}`}>
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        نسبة الاستخدام
                    </span>
                    <span className={`text-xs font-bold ${utilization.color.text}`}>
                        {utilization.percent}%
                    </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-l ${utilization.color.from} ${utilization.color.to} transition-all duration-700 ease-out`}
                        style={{ width: `${Math.min(utilization.percent, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={utilization.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`نسبة استخدام المحفظة ${utilization.percent}%`}
                    />
                </div>
            </div>

            {/* ═══ التذييل (في الوضع الكامل فقط) ═══ */}
            {!compact && (
                <div className="px-5 pb-5">
                    {/* خط فاصل */}
                    <div className="border-t border-gray-100 dark:border-gray-800 mb-4" />

                    <div className="flex items-center justify-between flex-wrap gap-3">
                        {/* آخر عملية */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                            <svg
                                className="w-4 h-4 flex-shrink-0 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {lastTransaction ? (
                                <span className="truncate">
                                    آخر عملية: {lastTransaction.description?.slice(0, 45)}
                                    {lastTransaction.description?.length > 45 ? '...' : ''}
                                    {' - '}
                                    {formatWalletDate(lastTransaction.createdAt)}
                                </span>
                            ) : (
                                <span>لا توجد عمليات سابقة</span>
                            )}
                        </div>

                        {/* أزرار الإجراءات */}
                        {showActions && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {onViewHistory && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onViewHistory}
                                        icon={
                                            <svg
                                                className="w-4 h-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        }
                                        aria-label="عرض سجل العمليات"
                                    >
                                        السجل
                                    </Button>
                                )}
                                {onTopUp && (
                                    <Button
                                        variant="gold"
                                        size="sm"
                                        onClick={onTopUp}
                                        icon={
                                            <svg
                                                className="w-4 h-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        }
                                        aria-label="إيداع مبلغ في المحفظة"
                                    >
                                        إيداع
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

WalletBalanceCard.displayName = 'WalletBalanceCard';

WalletBalanceCard.propTypes = {
    /** الوضع المضغوط - حشوة أقل وبدون تذييل */
    compact: PropTypes.bool,
    /** عرض أزرار الإجراءات (إيداع، سجل) */
    showActions: PropTypes.bool,
    /** استدعاء عند الضغط على زر الإيداع */
    onTopUp: PropTypes.func,
    /** استدعاء عند الضغط على عرض السجل */
    onViewHistory: PropTypes.func,
    /** كلاسات CSS إضافية */
    className: PropTypes.string,
};

export default WalletBalanceCard;
