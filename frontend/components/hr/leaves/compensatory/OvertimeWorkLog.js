/**
 * سجل العمل الإضافي
 * Overtime Work Log Component
 */

import React, { useState } from 'react';
import {
    PlusIcon,
    TrashIcon,
    ClockIcon,
    CalendarIcon,
    PaperClipIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Input, Badge } from '../../../ui';
import { formatDateArabic } from '../../../../utils/hr-helpers';

const OvertimeWorkLog = ({
    entries = [],
    onChange,
    error = null,
    readOnly = false,
}) => {
    const [newEntry, setNewEntry] = useState({
        date: '',
        hours: '',
        reason: '',
        approvedBy: '',
    });

    const handleNewEntryChange = (field, value) => {
        setNewEntry(prev => ({ ...prev, [field]: value }));
    };

    const addEntry = () => {
        if (!newEntry.date || !newEntry.hours) return;

        const entry = {
            ...newEntry,
            id: Date.now(),
            hours: parseFloat(newEntry.hours) || 0,
        };

        onChange?.([...entries, entry]);
        setNewEntry({ date: '', hours: '', reason: '', approvedBy: '' });
    };

    const removeEntry = (entryId) => {
        onChange?.(entries.filter(e => e.id !== entryId));
    };

    // حساب إجمالي الساعات
    const totalHours = entries.reduce(
        (sum, entry) => sum + (parseFloat(entry.hours) || 0),
        0
    );

    return (
        <ContentCard
            title="سجل ساعات العمل الإضافي"
            icon={<ClockIcon className="w-5 h-5" />}
            subtitle={`${entries.length} سجل - إجمالي ${totalHours} ساعة`}
        >
            <div className="space-y-4">
                {/* نموذج إضافة سجل جديد */}
                {!readOnly && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* التاريخ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    تاريخ العمل
                                </label>
                                <Input
                                    type="date"
                                    value={newEntry.date}
                                    onChange={(e) => handleNewEntryChange('date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* عدد الساعات */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    عدد الساعات
                                </label>
                                <Input
                                    type="number"
                                    value={newEntry.hours}
                                    onChange={(e) => handleNewEntryChange('hours', e.target.value)}
                                    min={0.5}
                                    max={16}
                                    step={0.5}
                                    placeholder="مثال: 4"
                                />
                            </div>

                            {/* سبب العمل */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    سبب العمل الإضافي
                                </label>
                                <Input
                                    value={newEntry.reason}
                                    onChange={(e) => handleNewEntryChange('reason', e.target.value)}
                                    placeholder="مهمة طارئة..."
                                />
                            </div>

                            {/* زر الإضافة */}
                            <div className="flex items-end">
                                <Button
                                    variant="primary"
                                    onClick={addEntry}
                                    disabled={!newEntry.date || !newEntry.hours}
                                    icon={<PlusIcon className="w-4 h-4" />}
                                    className="w-full"
                                >
                                    إضافة
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* خطأ التحقق */}
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                {/* قائمة السجلات */}
                {entries.length > 0 ? (
                    <div className="space-y-3">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id || index}
                                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {/* رقم السجل */}
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                        {index + 1}
                                    </div>

                                    {/* التفاصيل */}
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {formatDateArabic(entry.date)}
                                            </span>
                                            <Badge variant="primary" size="sm">
                                                {entry.hours} ساعة
                                            </Badge>
                                        </div>
                                        {entry.reason && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {entry.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* زر الحذف */}
                                {!readOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeEntry(entry.id)}
                                        icon={<TrashIcon className="w-4 h-4 text-red-500" />}
                                    />
                                )}
                            </div>
                        ))}

                        {/* الإجمالي */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <span className="font-bold text-blue-800 dark:text-blue-200">الإجمالي</span>
                            <div className="flex items-center gap-4">
                                <Badge variant="primary">
                                    {totalHours} ساعة
                                </Badge>
                                <span className="text-blue-600 dark:text-blue-400">
                                    = {Math.floor(totalHours / 8)} يوم + {totalHours % 8} ساعة
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>لا توجد سجلات عمل إضافي</p>
                        <p className="text-sm">أضف سجلات العمل الإضافي لحساب الأيام التعويضية</p>
                    </div>
                )}

                {/* ملاحظات */}
                <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <strong>ملاحظات:</strong>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>يجب أن يكون العمل الإضافي موثقاً ومعتمداً من المدير المباشر</li>
                        <li>كل 8 ساعات عمل إضافي تعادل يوم تعويضي واحد</li>
                        <li>الساعات المتبقية (أقل من 8) تُحفظ للطلبات المستقبلية</li>
                    </ul>
                </div>
            </div>
        </ContentCard>
    );
};

export default OvertimeWorkLog;
