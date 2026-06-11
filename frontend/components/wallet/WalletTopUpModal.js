/**
 * نافذة إيداع في المحفظة
 * Wallet Top-Up Modal
 *
 * تتيح لقسم المالية إيداع مبالغ جديدة في محفظة التعزيزات المالية.
 * تعرض معاينة مباشرة للرصيد الجديد بعد الإيداع مع اختيار مصدر التمويل.
 *
 * @requires WalletContext - سياق المحفظة للوصول لدالة topUp وبيانات المحفظة
 * @requires walletData - مساعدات التنسيق ومصادر الإيداع
 */

import React, { useState, useCallback } from 'react';
import { Modal, Button } from '../ui';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency, TOPUP_SOURCES } from '../../lib/walletData';

/**
 * نافذة إيداع في المحفظة
 * @param {object} props
 * @param {boolean} props.isOpen - حالة فتح النافذة
 * @param {function} props.onClose - دالة إغلاق النافذة
 */
export default function WalletTopUpModal({ isOpen, onClose }) {
    const { wallet, topUp } = useWallet();

    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('operational');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const numericAmount = Number(amount) || 0;

    /** إعادة تهيئة النموذج */
    const resetForm = useCallback(() => {
        setAmount('');
        setSource('operational');
        setDescription('');
    }, []);

    /** تنفيذ عملية الإيداع */
    const handleSubmit = useCallback(async () => {
        if (numericAmount <= 0 || submitting) return;

        setSubmitting(true);
        try {
            await topUp(numericAmount, description || 'إيداع في المحفظة', source);
            resetForm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    }, [numericAmount, submitting, topUp, description, source, resetForm, onClose]);

    /** إغلاق النافذة مع إعادة تهيئة النموذج */
    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const currentBalance = wallet?.availableBalance || 0;
    const newBalance = currentBalance + numericAmount;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="إيداع في المحفظة"
            size="md"
            footer={
                <>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={numericAmount <= 0 || submitting}
                    >
                        {submitting ? 'جاري الإيداع...' : 'إيداع'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        إلغاء
                    </Button>
                </>
            }
        >
            <div className="space-y-5" dir="rtl">
                {/* ── حقل المبلغ ── */}
                <div>
                    <label
                        htmlFor="topup-amount"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5"
                    >
                        المبلغ
                    </label>
                    <input
                        id="topup-amount"
                        type="number"
                        min={1}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="أدخل المبلغ بالريال"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-base"
                        autoFocus
                    />
                    {numericAmount > 0 && (
                        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                            = {formatCurrency(numericAmount)}
                        </p>
                    )}
                </div>

                {/* ── مصدر الإيداع ── */}
                <div>
                    <label
                        htmlFor="topup-source"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5"
                    >
                        مصدر الإيداع
                    </label>
                    <select
                        id="topup-source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-base"
                    >
                        {TOPUP_SOURCES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ── الوصف / السبب ── */}
                <div>
                    <label
                        htmlFor="topup-description"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5"
                    >
                        الوصف / السبب
                    </label>
                    <textarea
                        id="topup-description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="سبب الإيداع..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-base resize-none"
                    />
                </div>

                {/* ── معاينة الرصيد ── */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        معاينة الرصيد
                    </h4>
                    <div className="space-y-2">
                        {/* الرصيد الحالي */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">الرصيد الحالي</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                {formatCurrency(currentBalance)}
                            </span>
                        </div>

                        {/* مبلغ الإيداع */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">+ الإيداع</span>
                            <span className="font-semibold text-emerald-600">
                                {formatCurrency(numericAmount)}
                            </span>
                        </div>

                        {/* الفاصل */}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                        {/* الرصيد الجديد */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300 font-bold">= الرصيد الجديد</span>
                            <span className="font-bold text-blue-700 dark:text-blue-300 text-base">
                                {formatCurrency(newBalance)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
