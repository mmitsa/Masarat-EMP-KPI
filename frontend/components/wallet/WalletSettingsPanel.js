/**
 * لوحة إعدادات المحفظة
 * Wallet Settings Panel
 *
 * تتيح لقسم المالية / تقنية المعلومات تكوين قواعد عمل المحفظة:
 * - التجميد التلقائي عند نفاد الرصيد
 * - حد التنبيه للرصيد المنخفض
 * - السماح بتجاوز صاحب الصلاحية
 * - مبلغ الموافقة الإضافية
 *
 * @requires WalletContext - سياق المحفظة للوصول للإعدادات ودالة التحديث
 * @requires NotificationContext - لعرض إشعار نجاح الحفظ
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ContentCard, Button } from '../ui';
import { useWallet } from '../../context/WalletContext';
import { useToast } from '../../context/NotificationContext';

/**
 * مفتاح تبديل مخصص (Toggle Switch)
 * @param {object} props
 * @param {boolean} props.checked - الحالة الحالية
 * @param {function} props.onChange - دالة تغيير الحالة
 * @param {string} props.id - معرف العنصر للربط مع label
 */
function ToggleSwitch({ checked, onChange, id }) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
                rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:ring-offset-2
                ${checked ? 'bg-blue-600' : 'bg-gray-300'}
            `}
        >
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5
                    transform rounded-full bg-white dark:bg-gray-900 shadow ring-0
                    transition duration-200 ease-in-out
                    ${checked ? '-translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
}

/**
 * لوحة إعدادات المحفظة
 * @param {object} props
 * @param {string} [props.className] - أصناف CSS إضافية
 */
export default function WalletSettingsPanel({ className = '' }) {
    const { wallet, updateSettings } = useWallet();
    const toast = useToast();

    // حالة محلية للنموذج، يتم تهيئتها من إعدادات المحفظة
    const [localSettings, setLocalSettings] = useState({
        autoFreeze: true,
        lowBalanceThreshold: 100000,
        authorityOverrideEnabled: true,
        requireApprovalAbove: 50000,
    });

    const [saving, setSaving] = useState(false);

    // مزامنة الحالة المحلية عند تحميل / تغيير إعدادات المحفظة
    useEffect(() => {
        if (wallet?.settings) {
            setLocalSettings({
                autoFreeze: wallet.settings.autoFreeze ?? true,
                lowBalanceThreshold: wallet.settings.lowBalanceThreshold ?? 100000,
                authorityOverrideEnabled: wallet.settings.authorityOverrideEnabled ?? true,
                requireApprovalAbove: wallet.settings.requireApprovalAbove ?? 50000,
            });
        }
    }, [wallet?.settings]);

    /** تحديث حقل في الإعدادات المحلية */
    const updateField = useCallback((field, value) => {
        setLocalSettings((prev) => ({ ...prev, [field]: value }));
    }, []);

    /** حفظ الإعدادات */
    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await updateSettings(localSettings);
            toast?.success('تم حفظ الإعدادات', 'تم تحديث إعدادات المحفظة بنجاح');
        } catch {
            toast?.error('خطأ', 'فشل حفظ الإعدادات، حاول مرة أخرى');
        } finally {
            setSaving(false);
        }
    }, [localSettings, updateSettings, toast]);

    /** أيقونة الإعدادات */
    const settingsIcon = (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );

    return (
        <ContentCard
            title="إعدادات المحفظة"
            icon={settingsIcon}
            className={className}
        >
            <div className="space-y-6" dir="rtl">
                {/* ══════════════════════════════════════════════
                    1. تجميد تلقائي عند نفاد الرصيد
                   ══════════════════════════════════════════════ */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <label
                            htmlFor="toggle-auto-freeze"
                            className="block text-sm font-semibold text-gray-800 dark:text-gray-100 cursor-pointer"
                        >
                            تجميد تلقائي عند نفاد الرصيد
                        </label>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            سيتم تجميد المحفظة تلقائيا عند وصول الرصيد للصفر
                        </p>
                    </div>
                    <ToggleSwitch
                        id="toggle-auto-freeze"
                        checked={localSettings.autoFreeze}
                        onChange={(val) => updateField('autoFreeze', val)}
                    />
                </div>

                {/* ══════════════════════════════════════════════
                    2. حد التنبيه للرصيد المنخفض
                   ══════════════════════════════════════════════ */}
                <div>
                    <label
                        htmlFor="low-balance-threshold"
                        className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1.5"
                    >
                        حد التنبيه للرصيد المنخفض (ر.س)
                    </label>
                    <input
                        id="low-balance-threshold"
                        type="number"
                        min={0}
                        step={10000}
                        value={localSettings.lowBalanceThreshold}
                        onChange={(e) =>
                            updateField('lowBalanceThreshold', Number(e.target.value) || 0)
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-base"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        سيظهر تنبيه عند انخفاض الرصيد عن هذا المبلغ
                    </p>
                </div>

                {/* ══════════════════════════════════════════════
                    3. السماح بتجاوز صاحب الصلاحية
                   ══════════════════════════════════════════════ */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <label
                            htmlFor="toggle-authority-override"
                            className="block text-sm font-semibold text-gray-800 dark:text-gray-100 cursor-pointer"
                        >
                            السماح بتجاوز صاحب الصلاحية
                        </label>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            يسمح لصاحب الصلاحية على الجهة باصدار قرارات عند عدم كفاية الرصيد
                        </p>
                    </div>
                    <ToggleSwitch
                        id="toggle-authority-override"
                        checked={localSettings.authorityOverrideEnabled}
                        onChange={(val) => updateField('authorityOverrideEnabled', val)}
                    />
                </div>

                {/* ══════════════════════════════════════════════
                    4. مبلغ يتطلب موافقة إضافية
                   ══════════════════════════════════════════════ */}
                <div>
                    <label
                        htmlFor="require-approval-above"
                        className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1.5"
                    >
                        مبلغ يتطلب موافقة إضافية (ر.س)
                    </label>
                    <input
                        id="require-approval-above"
                        type="number"
                        min={0}
                        step={5000}
                        value={localSettings.requireApprovalAbove}
                        onChange={(e) =>
                            updateField('requireApprovalAbove', Number(e.target.value) || 0)
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-base"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        القرارات التي تتجاوز هذا المبلغ تتطلب موافقة إضافية
                    </p>
                </div>

                {/* ══════════════════════════════════════════════
                    زر الحفظ
                   ══════════════════════════════════════════════ */}
                <div className="pt-2">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                جاري الحفظ...
                            </span>
                        ) : (
                            'حفظ الإعدادات'
                        )}
                    </Button>
                </div>
            </div>
        </ContentCard>
    );
}
