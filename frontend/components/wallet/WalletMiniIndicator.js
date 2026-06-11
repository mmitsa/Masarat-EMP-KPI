/**
 * مؤشر المحفظة المصغّر لشريط الرأس
 * WalletMiniIndicator - زر صغير مع قائمة منسدلة لعرض حالة المحفظة
 *
 * يعرض:
 * - أيقونة محفظة مع نقطة ملونة تشير إلى الحالة:
 *   - أخضر ثابت: نشطة ورصيد جيد
 *   - أصفر نابض: رصيد منخفض (أقل من lowBalanceThreshold)
 *   - أحمر نابض: نفدت أو مجمّدة
 * - قائمة منسدلة عند النقر:
 *   - اسم المحفظة وشارة الحالة
 *   - الرصيد المتاح (كبير وعريض)
 *   - شريط تقدم مصغّر لنسبة الاستخدام
 *   - إحصائيات سريعة: المخصص / المرتبط
 *   - رابط "إدارة المحفظة" -> /finance/wallet
 *   - رابط "عرض السجل" -> /finance/wallet?tab=history
 * - إغلاق القائمة عند النقر خارجها
 *
 * @requires WalletContext - سياق المحفظة للوصول لبيانات المحفظة
 * @requires walletData - مساعدات التنسيق وحساب الاستخدام
 *
 * @version 2.0.0
 * @date 2026-02-12
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useWallet } from '../../context/WalletContext';
import {
    formatCurrency,
    getUtilizationPercent,
    getUtilizationColor,
    WALLET_STATUSES,
} from '../../lib/walletData';

/**
 * تحديد حالة النقطة المؤشرة
 * @param {object} wallet - بيانات المحفظة
 * @returns {{ color: string, pulse: boolean }} لون النقطة وحالة النبض
 */
function getDotStatus(wallet) {
    if (!wallet) {
        return { color: 'bg-gray-400', pulse: false };
    }

    // أحمر نابض: نفدت أو مجمّدة
    if (wallet.status === 'frozen' || wallet.status === 'depleted' || wallet.availableBalance <= 0) {
        return { color: 'bg-red-500', pulse: true };
    }

    // أصفر نابض: رصيد منخفض
    const threshold = wallet.settings?.lowBalanceThreshold || 100000;
    if (wallet.availableBalance <= threshold) {
        return { color: 'bg-amber-400', pulse: true };
    }

    // أخضر ثابت: نشطة ورصيد جيد
    return { color: 'bg-emerald-500', pulse: false };
}

/**
 * تحديد نمط شارة الحالة
 * @param {string} status - حالة المحفظة
 * @returns {{ bg: string, text: string }} كلاسات الخلفية والنص
 */
function getStatusBadgeStyle(status) {
    const map = {
        active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
        frozen: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
        depleted: { bg: 'bg-orange-100', text: 'text-orange-700' },
    };
    return map[status] || { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-200' };
}

/**
 * أيقونة المحفظة المصغّرة
 */
function WalletSmallIcon({ className = 'w-5 h-5' }) {
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
 * WalletMiniIndicator
 * مؤشر المحفظة المصغّر المخصص لشريط الرأس (Header)
 *
 * @param {object} props
 * @param {string} [props.className] - كلاسات CSS إضافية
 */
const WalletMiniIndicator = memo(function WalletMiniIndicator({
    className = '',
}) {
    const router = useRouter();
    const { wallet, loading } = useWallet();

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);

    // ── حالة النقطة ──
    const dotStatus = useMemo(() => getDotStatus(wallet), [wallet]);

    // ── نسبة الاستخدام ──
    const utilization = useMemo(() => {
        if (!wallet) return { percent: 0, color: getUtilizationColor(0) };
        const percent = getUtilizationPercent(wallet);
        return { percent, color: getUtilizationColor(percent) };
    }, [wallet]);

    // ── إغلاق القائمة عند النقر خارجها ──
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // ── تبديل القائمة ──
    const toggleDropdown = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    // ── الانتقال إلى صفحة ──
    const navigateTo = useCallback(
        (path) => {
            setIsOpen(false);
            router.push(path);
        },
        [router]
    );

    // ── حالة التحميل ──
    if (loading) {
        return (
            <div
                className={`relative w-10 h-10 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex items-center justify-center animate-pulse ${className}`}
                aria-label="جاري تحميل المحفظة"
            >
                <div className="w-5 h-5 rounded bg-gray-300" />
            </div>
        );
    }

    // ── عدم وجود محفظة ──
    if (!wallet) {
        return (
            <div
                className={`relative w-10 h-10 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-40 cursor-not-allowed ${className}`}
                title="المحفظة غير متوفرة"
                aria-label="المحفظة غير متوفرة"
            >
                <WalletSmallIcon className="w-5 h-5 text-amber-600" />
            </div>
        );
    }

    const statusInfo = WALLET_STATUSES[wallet.status] || WALLET_STATUSES.active;
    const statusBadge = getStatusBadgeStyle(wallet.status);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* ═══ الزر الرئيسي ═══ */}
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                className={`
                    relative w-10 h-10 rounded-xl border
                    bg-white dark:bg-gray-900 hover:bg-gray-50 border-gray-200 dark:border-gray-700
                    flex items-center justify-center
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:ring-offset-1
                    ${isOpen ? 'ring-2 ring-amber-400/40' : ''}
                `}
                aria-label={`محفظة التعزيزات: ${formatCurrency(wallet.availableBalance)}`}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <WalletSmallIcon className="w-5 h-5 text-amber-600" />

                {/* نقطة المؤشر */}
                <span
                    className={`
                        absolute -top-1 -left-1
                        w-3 h-3 rounded-full border-2 border-white
                        ${dotStatus.color}
                        ${dotStatus.pulse ? 'animate-pulse' : ''}
                    `}
                    aria-hidden="true"
                />
            </button>

            {/* ═══ القائمة المنسدلة ═══ */}
            {isOpen && (
                <div
                    className="absolute top-full mt-2 left-0 w-72 z-50 rounded-xl shadow-xl border bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 overflow-hidden"
                    role="menu"
                    aria-label="قائمة المحفظة"
                >
                    {/* ── الرأس: الاسم + شارة الحالة ── */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                {wallet.name}
                            </span>
                            <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}
                            >
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* ── الرصيد المتاح (كبير وعريض) ── */}
                    <div className="px-4 pt-3 pb-2 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">الرصيد المتاح</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white" dir="ltr">
                            {formatCurrency(wallet.availableBalance)}
                        </p>
                    </div>

                    {/* ── شريط التقدم المصغّر (نسبة الاستخدام) ── */}
                    <div className="px-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">نسبة الاستخدام</span>
                            <span className={`text-[10px] font-bold ${utilization.color.text}`}>
                                {utilization.percent}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-l ${utilization.color.from} ${utilization.color.to} transition-all duration-500`}
                                style={{ width: `${Math.min(utilization.percent, 100)}%` }}
                                role="progressbar"
                                aria-valuenow={utilization.percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`نسبة استخدام المحفظة ${utilization.percent}%`}
                            />
                        </div>
                    </div>

                    {/* ── إحصائيات سريعة: المخصص / المرتبط ── */}
                    <div className="px-4 pb-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2 text-center">
                                <p className="text-[10px] text-blue-500">المخصص</p>
                                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                    {formatCurrency(wallet.totalAllocated)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-2 text-center">
                                <p className="text-[10px] text-orange-500">المرتبط</p>
                                <p className="text-xs font-bold text-orange-700">
                                    {formatCurrency(wallet.totalCommitted)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── الخط الفاصل ── */}
                    <div className="border-t border-gray-100 dark:border-gray-800" />

                    {/* ── الروابط ── */}
                    <div className="p-2">
                        {/* إدارة المحفظة */}
                        <button
                            type="button"
                            onClick={() => navigateTo('/finance/wallet')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors duration-150 hover:bg-amber-50 text-gray-700 dark:text-gray-200"
                            role="menuitem"
                        >
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-4 h-4 text-amber-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-medium block">إدارة المحفظة</span>
                                <span className="text-[10px] text-gray-400">الإعدادات والإيداعات</span>
                            </div>
                        </button>

                        {/* عرض السجل */}
                        <button
                            type="button"
                            onClick={() => navigateTo('/finance/wallet?tab=history')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors duration-150 hover:bg-blue-50 text-gray-700 dark:text-gray-200"
                            role="menuitem"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
                            </div>
                            <div>
                                <span className="text-sm font-medium block">عرض السجل</span>
                                <span className="text-[10px] text-gray-400">جميع العمليات</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

WalletMiniIndicator.displayName = 'WalletMiniIndicator';

WalletMiniIndicator.propTypes = {
    /** كلاسات CSS إضافية */
    className: PropTypes.string,
};

export default WalletMiniIndicator;
