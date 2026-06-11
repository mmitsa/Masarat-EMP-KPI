import React from 'react';
import { JOB_TITLES } from '../../lib/permissions';
import { Badge } from '../ui';

/**
 * ApprovalWorkflowDiagram - رسم بياني عمودي لتسلسل الاعتماد
 * يعرض خطوات الاعتماد بشكل بصري متسلسل + تدفق الرفض
 *
 * @param {Array} steps - خطوات الاعتماد [{order, roleId, label, required}]
 * @param {Object} rejectionPolicy - سياسة الرفض (اختياري)
 * @param {Array} requiredAttachments - المرفقات الإجبارية (اختياري)
 * @param {string} className - CSS classes
 */
export default function ApprovalWorkflowDiagram({ steps = [], rejectionPolicy, requiredAttachments, className = '' }) {
    if (!steps || steps.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <svg className="w-7 h-7 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
                <p className="text-sm text-[var(--text-tertiary)]">لم يتم تعريف خطوات اعتماد</p>
            </div>
        );
    }

    const getRoleName = (roleId) => {
        const role = Object.values(JOB_TITLES).find(r => r.id === roleId);
        return role?.nameAr || roleId;
    };

    const hasRejectionFlow = rejectionPolicy?.returnToCreator;

    return (
        <div className={`relative ${className}`}>
            {/* خطوة البداية: مدخل المحضر */}
            {hasRejectionFlow && (
                <div className="flex items-start mb-2">
                    <div className="flex flex-col items-center ml-4 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-[var(--color-secondary-500)] text-white shadow-md">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="w-0.5 min-h-[32px] my-1 bg-[var(--color-secondary-300)]" style={{ height: '100%' }} />
                    </div>
                    <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-[var(--text-primary)]">مدخل المحضر</span>
                            <Badge variant="secondary" className="text-[10px]">منشئ</Badge>
                        </div>
                        <div className="text-sm text-[var(--text-tertiary)] mt-0.5">إنشاء وإعداد المحضر مع المرفقات</div>
                    </div>
                </div>
            )}

            {/* خطوات الاعتماد */}
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                const isRequired = step.required !== false;

                return (
                    <div key={step.id || index} className="flex items-start relative">
                        {/* سهم الرفض - خط منقط يعود للمنشئ */}
                        {hasRejectionFlow && (
                            <div className="absolute -right-8 top-0 bottom-0 flex flex-col items-center" style={{ width: '24px' }}>
                                <div className="h-full border-r-2 border-dashed border-red-300 dark:border-red-700" />
                            </div>
                        )}

                        {/* العمود الأيمن: الدائرة والخط */}
                        <div className="flex flex-col items-center ml-4 flex-shrink-0">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                    ${isRequired
                                        ? 'bg-[var(--color-primary-500)] text-white shadow-md'
                                        : 'border-2 border-dashed border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'
                                    }`}
                            >
                                {step.order || index + 1}
                            </div>

                            {!isLast && (
                                <div
                                    className={`w-0.5 min-h-[40px] my-1 ${
                                        isRequired
                                            ? 'bg-[var(--color-primary-300)]'
                                            : 'border-r-2 border-dashed border-gray-300 dark:border-gray-600'
                                    }`}
                                    style={{ height: '100%' }}
                                />
                            )}
                        </div>

                        {/* المحتوى */}
                        <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-[var(--text-primary)]">
                                    {step.label}
                                </span>
                                <Badge
                                    variant={isRequired ? 'primary' : 'default'}
                                    className="text-[10px]"
                                >
                                    {isRequired ? 'مطلوب' : 'اختياري'}
                                </Badge>
                                {hasRejectionFlow && (
                                    <span className="text-[10px] text-red-500 dark:text-red-400 flex items-center gap-0.5">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                        </svg>
                                        يمكن الرفض
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-[var(--text-tertiary)] mt-0.5">
                                {getRoleName(step.roleId)}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* بانل سياسة الرفض */}
            {hasRejectionFlow && (
                <div className="mt-6 p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">آلية الرفض والإرجاع</h5>
                            <p className="text-xs text-red-600/80 dark:text-red-400/70 leading-relaxed">
                                {rejectionPolicy.description}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-3">
                                {rejectionPolicy.requireRejectionReason && (
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        سبب الرفض إجباري
                                    </span>
                                )}
                                {rejectionPolicy.resumeFromRejector && (
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        يستأنف من الرافض
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* رسم توضيحي مبسط لتدفق الرفض */}
                    <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800/30">
                        <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-medium">المعتمد (أي مرحلة)</span>
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">رفض</span>
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="px-2 py-1 rounded-lg bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] font-medium">مدخل المحضر</span>
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">تصحيح وإعادة</span>
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="px-2 py-1 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-medium">الرافض (تحقق)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* المرفقات الإجبارية */}
            {requiredAttachments && requiredAttachments.length > 0 && (
                <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">المرفقات الإجبارية</h5>
                            <div className="space-y-1.5">
                                {requiredAttachments.map((att, idx) => (
                                    <div key={att.id} className="flex items-center gap-2 text-xs">
                                        <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[10px]">
                                            {idx + 1}
                                        </span>
                                        <span className="text-amber-800 dark:text-amber-300">{att.nameAr}</span>
                                        {att.required && (
                                            <span className="text-red-500 text-[10px]">*</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
