import React, { useState } from 'react';
import Modal from './Modal';
import { useNewsTicker, NEWS_TYPES, NEWS_PRIORITIES } from '../../context/NewsTickerContext';
import { useToast } from '../../context/NotificationContext';
import { useTheme } from '../../context/AppContext';

/**
 * زر النشر على الشريط الإخباري - مكون قابل لإعادة الاستخدام
 * يمكن استخدامه من أي موديول لنشر أخبار مباشرة على الشريط
 */
export default function PublishToTickerButton({
    sourceModule,
    sourceLabel,
    defaultType = 'announcement',
    defaultText = '',
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '',
        text: defaultText,
        type: defaultType,
        priority: 'low',
        expiresAt: '',
    });

    const { addItem } = useNewsTicker();
    const toast = useToast();
    const { darkMode } = useTheme();

    const resetForm = () => {
        setForm({
            title: '',
            text: defaultText,
            type: defaultType,
            priority: 'low',
            expiresAt: '',
        });
    };

    const handleOpen = () => {
        resetForm();
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.text.trim()) return;

        setSubmitting(true);
        try {
            const result = await addItem({
                title: form.title.trim(),
                text: form.text.trim(),
                type: form.type,
                priority: form.priority,
                status: 'published',
                sourceModule,
                sourceLabel,
                expiresAt: form.expiresAt || null,
                createdBy: sourceLabel,
            });

            if (result) {
                toast.success('تم النشر', 'تم نشر الخبر على الشريط الإخباري بنجاح');
                handleClose();
            } else {
                toast.error('فشل النشر', 'تعذر نشر الخبر — حاول مرة أخرى');
            }
        } catch (err) {
            toast.error('خطأ', 'حدث خطأ أثناء النشر');
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass =
        'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors';

    const typeOptions = Object.entries(NEWS_TYPES).map(([key, val]) => ({
        value: key,
        label: `${val.icon} ${val.label}`,
    }));

    const priorityOptions = Object.entries(NEWS_PRIORITIES).map(([key, val]) => ({
        value: key,
        label: val.label,
    }));

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className={`text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-2 ${className}`}
            >
                {/* Megaphone / Broadcast Icon */}
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                </svg>
                <span>نشر على الشريط</span>
            </button>

            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="نشر على الشريط الإخباري"
                subtitle={`النشر من: ${sourceLabel}`}
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            form="publish-ticker-form"
                            disabled={submitting || !form.title.trim() || !form.text.trim()}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? (
                                <span>جاري النشر...</span>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>نشر الآن</span>
                                </>
                            )}
                        </button>
                    </>
                }
            >
                <form id="publish-ticker-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* عنوان الخبر */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            عنوان الخبر <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="أدخل عنوان الخبر..."
                            className={inputClass}
                            required
                            autoFocus
                        />
                    </div>

                    {/* نص الخبر */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            نص الخبر <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.text}
                            onChange={(e) => handleChange('text', e.target.value)}
                            placeholder="أدخل نص الخبر الذي سيظهر على الشريط..."
                            rows={3}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* نوع الخبر + الأولوية */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                نوع الخبر
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className={inputClass}
                            >
                                {typeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                الأولوية
                            </label>
                            <select
                                value={form.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                className={inputClass}
                            >
                                {priorityOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* تاريخ الانتهاء */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            تاريخ الانتهاء
                            <span className="text-gray-400 dark:text-gray-500 font-normal mr-1">(اختياري)</span>
                        </label>
                        <input
                            type="date"
                            value={form.expiresAt}
                            onChange={(e) => handleChange('expiresAt', e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </form>
            </Modal>
        </>
    );
}
