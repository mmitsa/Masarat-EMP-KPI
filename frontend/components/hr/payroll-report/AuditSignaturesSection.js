/**
 * قسم التوقيعات والاعتماد
 * Audit Signatures Section Component
 */

import React from 'react';
import { formatDateArabic } from '../../../constants/payroll-report-types';

const AuditSignaturesSection = ({
    preparer,
    auditor,
    hrManager,
    showEmployee = false,
    employee = null,
    date = new Date(),
    printMode = false,
}) => {
    const signatures = [];

    // إضافة الموظف إذا كان مطلوباً
    if (showEmployee && employee) {
        signatures.push({
            title: 'الموظف',
            name: employee.fullName || employee.nameAr || '-',
            position: employee.position || 'موظف',
            date: null,
        });
    }

    // الموظف المختص
    if (preparer) {
        signatures.push({
            title: 'الموظف المختص',
            name: preparer.fullName || preparer.nameAr || preparer.name || '-',
            position: preparer.position || 'أخصائي موارد بشرية',
            date: date,
        });
    }

    // المدقق
    if (auditor) {
        signatures.push({
            title: 'المدقق',
            name: auditor.fullName || auditor.nameAr || auditor.name || '-',
            position: auditor.position || 'مدقق',
            date: date,
        });
    }

    // مدير الموارد البشرية
    if (hrManager) {
        signatures.push({
            title: 'مدير الموارد البشرية',
            name: hrManager.fullName || hrManager.nameAr || hrManager.name || '-',
            position: 'مدير الموارد البشرية',
            date: date,
        });
    }

    // إذا لم يكن هناك توقيعات، أضف توقيعات افتراضية للطباعة
    if (signatures.length === 0 && printMode) {
        signatures.push(
            { title: 'الموظف المختص', name: '', position: '', date: null },
            { title: 'المدقق', name: '', position: '', date: null },
            { title: 'مدير الموارد البشرية', name: '', position: '', date: null }
        );
    }

    if (signatures.length === 0) return null;

    // تحديد عدد الأعمدة بناءً على عدد التوقيعات
    const gridCols = signatures.length === 2 ? 'grid-cols-2' :
                     signatures.length === 3 ? 'grid-cols-3' :
                     signatures.length === 4 ? 'grid-cols-4' : 'grid-cols-3';

    if (printMode) {
        return (
            <div className="signature-section mt-8">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">
                    التوقيعات
                </h3>
                <div className={`grid ${gridCols} gap-6`}>
                    {signatures.map((sig, index) => (
                        <div key={index} className="text-center">
                            <div className="font-semibold text-gray-800 dark:text-gray-100 mb-8">
                                {sig.title}
                            </div>
                            <div className="border-t border-gray-400 pt-2 mx-4">
                                <div className="text-sm text-gray-600 dark:text-gray-300">التوقيع</div>
                            </div>
                            {sig.name && (
                                <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                                    الاسم: {sig.name}
                                </div>
                            )}
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                التاريخ: {sig.date ? formatDateArabic(sig.date) : '_______________'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                التوقيعات والاعتماد
            </h3>
            <div className={`grid ${gridCols} gap-4`}>
                {signatures.map((sig, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center"
                    >
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {sig.title}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            {sig.name || '-'}
                        </div>
                        {sig.position && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {sig.position}
                            </div>
                        )}
                        {sig.date && (
                            <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
                                {formatDateArabic(sig.date)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditSignaturesSection;
