import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { NAVIGATION } from '../../lib/routes';
import { navigateTo } from '../../lib/routeHelpers';
import { Button, Badge } from '../ui';
import { validateBeforeExport } from '../../utils/validation-system';

/**
 * ويدجت ملخص التحقق من البيانات للداشبورد
 * Data Validation Summary Widget
 */
export default function ValidationSummaryWidget({ className = '' }) {
    const router = useRouter();
    const [validationStatus, setValidationStatus] = useState({
        isLoading: true,
        lastChecked: null,
        employees: { total: 0, valid: 0, invalid: 0, status: 'unknown' },
        payroll: { total: 0, valid: 0, invalid: 0, status: 'unknown' },
        overall: 'unknown',
    });

    useEffect(() => {
        checkValidation();
    }, []);

    const checkValidation = async () => {
        setValidationStatus(prev => ({ ...prev, isLoading: true }));

        try {
            // جلب بيانات الموظفين من الـ API
            const empRes = await fetch('/api/hr/employees?pageSize=500').catch(() => null);
            const empData = empRes?.ok ? await empRes.json() : null;
            const employees = empData?.data || empData?.employees || [];

            // جلب بيانات الرواتب من الـ API
            const payRes = await fetch('/api/hr/payroll?pageSize=500').catch(() => null);
            const payData = payRes?.ok ? await payRes.json() : null;
            const payrollRecords = payData?.data || payData?.payrolls || [];

            if (employees.length === 0 && payrollRecords.length === 0) {
                setValidationStatus({
                    isLoading: false,
                    lastChecked: new Date().toISOString(),
                    employees: { total: 0, valid: 0, invalid: 0, errors: 0, warnings: 0, status: 'unknown' },
                    payroll: { total: 0, valid: 0, invalid: 0, errors: 0, warnings: 0, status: 'unknown' },
                    overall: 'unknown',
                });
                return;
            }

            const employeeResult = validateBeforeExport(employees, 'employees');
            const payrollResult = validateBeforeExport(payrollRecords, 'payroll');

            const getStatus = (result) => {
                if (result.totalRecords === 0) return 'unknown';
                if (result.invalidRecords === 0) return 'ready';
                if (result.invalidRecords < result.totalRecords / 2) return 'warning';
                return 'error';
            };

            const employeeStatus = getStatus(employeeResult);
            const payrollStatus = getStatus(payrollResult);

            let overall = 'ready';
            if (employeeStatus === 'error' || payrollStatus === 'error') {
                overall = 'error';
            } else if (employeeStatus === 'warning' || payrollStatus === 'warning') {
                overall = 'warning';
            } else if (employeeStatus === 'unknown' && payrollStatus === 'unknown') {
                overall = 'unknown';
            }

            setValidationStatus({
                isLoading: false,
                lastChecked: new Date().toISOString(),
                employees: {
                    total: employeeResult.totalRecords,
                    valid: employeeResult.validRecords,
                    invalid: employeeResult.invalidRecords,
                    errors: employeeResult.errors.length,
                    warnings: employeeResult.warnings.length,
                    status: employeeStatus,
                },
                payroll: {
                    total: payrollResult.totalRecords,
                    valid: payrollResult.validRecords,
                    invalid: payrollResult.invalidRecords,
                    errors: payrollResult.errors.length,
                    warnings: payrollResult.warnings.length,
                    status: payrollStatus,
                },
                overall,
            });
        } catch (error) {
            console.warn('Validation check failed:', error?.message);
            setValidationStatus(prev => ({
                ...prev,
                isLoading: false,
                overall: 'unknown',
            }));
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            ready: {
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                border: 'border-emerald-200 dark:border-emerald-800',
                label: 'جاهز',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ),
            },
            warning: {
                color: 'text-yellow-600 dark:text-yellow-400',
                bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                border: 'border-yellow-200 dark:border-yellow-800',
                label: 'يحتاج مراجعة',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                ),
            },
            error: {
                color: 'text-red-600 dark:text-red-400',
                bg: 'bg-red-100 dark:bg-red-900/30',
                border: 'border-red-200 dark:border-red-800',
                label: 'يوجد أخطاء',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                ),
            },
            unknown: {
                color: 'text-gray-600 dark:text-gray-400',
                bg: 'bg-gray-100 dark:bg-gray-700',
                border: 'border-gray-200 dark:border-gray-600',
                label: 'غير محدد',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                ),
            },
        };
        return configs[status] || configs.unknown;
    };

    const overallConfig = getStatusConfig(validationStatus.overall);

    if (validationStatus.isLoading) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header */}
            <div className={`px-4 py-3 ${overallConfig.bg} ${overallConfig.border} border-b flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className={overallConfig.color}>{overallConfig.icon}</span>
                    <h3 className={`font-bold ${overallConfig.color}`}>حالة البيانات للتصدير</h3>
                </div>
                <Badge variant={validationStatus.overall === 'ready' ? 'success' : validationStatus.overall === 'warning' ? 'warning' : 'danger'}>
                    {overallConfig.label}
                </Badge>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Employee Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getStatusConfig(validationStatus.employees.status).bg} flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${getStatusConfig(validationStatus.employees.status).color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">بيانات الموظفين</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {validationStatus.employees.valid} صحيح من {validationStatus.employees.total}
                            </p>
                        </div>
                    </div>
                    {validationStatus.employees.errors > 0 && (
                        <Badge variant="danger" size="sm">{validationStatus.employees.errors} خطأ</Badge>
                    )}
                </div>

                {/* Payroll Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${getStatusConfig(validationStatus.payroll.status).bg} flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${getStatusConfig(validationStatus.payroll.status).color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">بيانات الرواتب</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {validationStatus.payroll.valid} صحيح من {validationStatus.payroll.total}
                            </p>
                        </div>
                    </div>
                    {validationStatus.payroll.errors > 0 && (
                        <Badge variant="danger" size="sm">{validationStatus.payroll.errors} خطأ</Badge>
                    )}
                </div>

                {/* Progress Bar */}
                {validationStatus.overall === 'unknown' ? (
                    <div className="pt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                        يتم التحقق من بيانات الموظفين...
                    </div>
                ) : (
                <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>نسبة صحة البيانات</span>
                        <span>
                            {(() => {
                                const total = validationStatus.employees.total + validationStatus.payroll.total;
                                const valid = validationStatus.employees.valid + validationStatus.payroll.valid;
                                return total > 0 ? Math.round((valid / total) * 100) : 0;
                            })()}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${
                                validationStatus.overall === 'ready'
                                    ? 'bg-emerald-500'
                                    : validationStatus.overall === 'warning'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                            style={{
                                width: (() => {
                                    const total = validationStatus.employees.total + validationStatus.payroll.total;
                                    const valid = validationStatus.employees.valid + validationStatus.payroll.valid;
                                    return total > 0 ? `${(valid / total) * 100}%` : '0%';
                                })(),
                            }}
                        />
                    </div>
                </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    آخر فحص: {validationStatus.lastChecked
                        ? new Date(validationStatus.lastChecked).toLocaleTimeString('ar-SA')
                        : '-'}
                </p>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={checkValidation}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigateTo(router, NAVIGATION.HR.INTEGRATION)}>
                        التفاصيل
                    </Button>
                </div>
            </div>
        </div>
    );
}
