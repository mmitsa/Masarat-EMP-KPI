import React, { useState } from 'react';
import Badge from './Badge';
import Button from './Button';

/**
 * مكون عرض نتائج التحقق من البيانات
 * ValidationPanel Component
 */
export default function ValidationPanel({
    result,
    onClose,
    onExportReport,
    onExportExcel,
    onFixErrors,
    showDetails = true,
}) {
    const [expandedErrors, setExpandedErrors] = useState({});
    const [activeTab, setActiveTab] = useState('errors');

    if (!result) return null;

    const { isValid, totalRecords, validRecords, invalidRecords, errors, warnings, summary } = result;

    const toggleError = (index) => {
        setExpandedErrors(prev => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getFieldNameArabic = (field) => {
        const fieldNames = {
            nationalId: 'رقم الهوية',
            name: 'الاسم',
            bankAccount: 'رقم الحساب',
            bankCode: 'كود البنك',
            basicSalary: 'الراتب الأساسي',
            netSalary: 'صافي الراتب',
            month: 'الشهر',
            email: 'البريد الإلكتروني',
            phone: 'رقم الهاتف',
        };
        return fieldNames[field] || field;
    };

    const getTypeNameArabic = (type) => {
        const typeNames = {
            validation: 'خطأ في البيانات',
            connection: 'خطأ في الاتصال',
            server: 'خطأ من الخادم',
            data_format: 'خطأ في الصيغة',
            missing_data: 'بيانات مفقودة',
            duplicate: 'تكرار',
            permission: 'صلاحيات',
        };
        return typeNames[type] || type;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with Summary */}
            <div className={`p-4 ${isValid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isValid ? (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h3 className={`font-bold text-lg ${isValid ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
                                {isValid ? 'البيانات جاهزة للتصدير' : 'يوجد أخطاء في البيانات'}
                            </h3>
                            <p className={`text-sm ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                تم فحص {totalRecords} سجل - {validRecords} صحيح، {invalidRecords} يحتاج تصحيح
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRecords}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي السجلات</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{validRecords}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">سجلات صحيحة</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{errors.length}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">أخطاء</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warnings.length}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">تحذيرات</p>
                </div>
            </div>

            {/* Tabs */}
            {showDetails && (errors.length > 0 || warnings.length > 0) && (
                <>
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('errors')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTab === 'errors'
                                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 bg-red-50 dark:bg-red-900/10'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            الأخطاء ({errors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('warnings')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTab === 'warnings'
                                    ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            التحذيرات ({warnings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTab === 'summary'
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/10'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            الملخص
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {/* Errors Tab */}
                        {activeTab === 'errors' && (
                            <div className="p-4 space-y-3">
                                {errors.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>لا توجد أخطاء</p>
                                    </div>
                                ) : (
                                    errors.map((error, index) => (
                                        <div
                                            key={index}
                                            className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden"
                                        >
                                            <div
                                                className="p-3 flex items-start gap-3 cursor-pointer"
                                                onClick={() => toggleError(index)}
                                            >
                                                {getSeverityIcon(error.severity)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-red-800 dark:text-red-300">{error.message}</span>
                                                        <Badge variant="danger" size="sm">{getFieldNameArabic(error.field)}</Badge>
                                                    </div>
                                                    {error.recordName && (
                                                        <p className="text-sm text-red-600 dark:text-red-400">
                                                            السجل: {error.recordName} {error.recordId && `(${error.recordId})`}
                                                        </p>
                                                    )}
                                                </div>
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedErrors[index] ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            {expandedErrors[index] && (
                                                <div className="px-3 pb-3 pt-0 border-t border-red-200 dark:border-red-800 mt-2">
                                                    <div className="bg-white dark:bg-gray-800 rounded p-3 space-y-2 text-sm">
                                                        {error.value && (
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">القيمة الحالية:</span>
                                                                <code className="mr-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-red-600 dark:text-red-400">
                                                                    {error.value}
                                                                </code>
                                                            </div>
                                                        )}
                                                        {error.suggestion && (
                                                            <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                                                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                </svg>
                                                                <span>الحل: {error.suggestion}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Warnings Tab */}
                        {activeTab === 'warnings' && (
                            <div className="p-4 space-y-3">
                                {warnings.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>لا توجد تحذيرات</p>
                                    </div>
                                ) : (
                                    warnings.map((warning, index) => (
                                        <div
                                            key={index}
                                            className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-3"
                                        >
                                            {getSeverityIcon('warning')}
                                            <div>
                                                <p className="font-medium text-yellow-800 dark:text-yellow-300">{warning.message}</p>
                                                {warning.recordName && (
                                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                                        السجل: {warning.recordName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Summary Tab */}
                        {activeTab === 'summary' && summary && (
                            <div className="p-4 space-y-4">
                                {/* By Field */}
                                {summary.byField && Object.keys(summary.byField).length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">الأخطاء حسب الحقل</h4>
                                        <div className="space-y-2">
                                            {Object.entries(summary.byField).map(([field, fieldErrors]) => (
                                                <div key={field} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                    <span className="text-gray-700 dark:text-gray-300">{getFieldNameArabic(field)}</span>
                                                    <Badge variant="danger">{fieldErrors.length}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* By Type */}
                                {summary.byType && Object.keys(summary.byType).length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">الأخطاء حسب النوع</h4>
                                        <div className="space-y-2">
                                            {Object.entries(summary.byType).map(([type, typeErrors]) => (
                                                <div key={type} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                    <span className="text-gray-700 dark:text-gray-300">{getTypeNameArabic(type)}</span>
                                                    <Badge variant="warning">{typeErrors.length}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    {onExportReport && (
                        <Button variant="outline" size="sm" onClick={onExportReport}>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            JSON
                        </Button>
                    )}
                    {onExportExcel && (
                        <Button variant="outline" size="sm" onClick={onExportExcel}>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel
                        </Button>
                    )}
                    {onFixErrors && errors.length > 0 && (
                        <Button variant="success" size="sm" onClick={onFixErrors}>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            إصلاح تلقائي
                        </Button>
                    )}
                </div>
                {isValid && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        جاهز للتصدير
                    </p>
                )}
            </div>
        </div>
    );
}
