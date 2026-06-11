import React, { useState, useMemo, useCallback } from 'react';
import { useOrganizationStructure } from '../../../context/OrganizationStructureContext';
import { useToast } from '../../../context/NotificationContext';
import { calculateFormCompliance, validateStep, validateAllSteps, validateDraft } from '../../../lib/hr/employeeValidation';
import { buildEmployeePayload } from '../../../lib/hr/employeeFormDefaults';
import api from '../../../lib/api';
import StepIndicator from './StepIndicator';
import StepPersonalData from './StepPersonalData';
import StepJobData from './StepJobData';
import StepFinancialData from './StepFinancialData';
import StepAdditionalData from './StepAdditionalData';
import ComplianceGauge from './ComplianceGauge';

export default function EmployeeFormModal({
    isOpen,
    onClose,
    editMode,
    formData,
    setFormData,
    selectedEmployee,
    lookups,
    formatForSelect,
    onSaveComplete,
}) {
    const toast = useToast();
    const {
        departments: orgDepartments,
        getSectionsByDepartment,
        getUnitsBySection,
    } = useOrganizationStructure();

    const [formStep, setFormStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [stepErrors, setStepErrors] = useState({});
    const [visitedSteps, setVisitedSteps] = useState(new Set([1]));

    // حساب نسبة تطابق التزام
    const formCompliance = useMemo(() => calculateFormCompliance(formData), [formData]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // مسح الخطأ عند تعديل الحقل
        if (stepErrors[name]) {
            setStepErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }, [setFormData, stepErrors]);

    // التنقل للخطوة التالية مع التحقق
    const handleNext = () => {
        const validation = validateStep(formStep, formData);
        setVisitedSteps(prev => new Set([...prev, formStep]));

        if (!validation.isValid) {
            setStepErrors(validation.errors);
            const labels = validation.errorList.map(e => e.label).join('، ');
            toast.warning(`الرجاء إكمال الحقول المطلوبة: ${labels}`);
            return;
        }

        setStepErrors({});
        const nextStep = Math.min(formStep + 1, 4);
        setFormStep(nextStep);
        setVisitedSteps(prev => new Set([...prev, nextStep]));
    };

    // التنقل للخطوة السابقة
    const handlePrev = () => {
        setStepErrors({});
        setFormStep(prev => Math.max(prev - 1, 1));
    };

    // التنقل لخطوة محددة (من الشريط العلوي)
    const handleStepClick = (step) => {
        setVisitedSteps(prev => new Set([...prev, formStep]));
        setStepErrors({});
        setFormStep(step);
        setVisitedSteps(prev => new Set([...prev, step]));
    };

    // استخراج رسائل الخطأ من استجابة الباك إند
    const extractErrorMessage = (error) => {
        const data = error?.response?.data;
        if (!data) return error?.message || 'خطأ غير متوقع';

        // حالة 1: ProblemDetails مع أخطاء التحقق { title: "...", errors: { "Field": ["msg"] } }
        if (data.errors && typeof data.errors === 'object') {
            const messages = [];
            for (const [, value] of Object.entries(data.errors)) {
                if (Array.isArray(value)) messages.push(...value);
                else if (typeof value === 'string') messages.push(value);
            }
            if (messages.length > 0) return messages.join(' | ');
        }

        // حالة 2: رسالة خطأ مباشرة { message: "..." }
        if (data.message) return data.message;
        if (data.title) return data.title;

        // حالة 3: أخطاء التحقق (ModelState) { "ArName": ["..."], "NationalId": ["..."] }
        if (typeof data === 'object' && !Array.isArray(data)) {
            const errors = [];
            for (const [key, messages] of Object.entries(data)) {
                // تخطي المفاتيح المعروفة في ProblemDetails
                if (['type', 'title', 'status', 'traceId', 'errors'].includes(key)) continue;
                if (Array.isArray(messages)) {
                    errors.push(...messages);
                } else if (typeof messages === 'string') {
                    errors.push(messages);
                } else if (messages?.errors && Array.isArray(messages.errors)) {
                    errors.push(...messages.errors.map(e => e.errorMessage || e));
                }
            }
            if (errors.length > 0) return errors.join(' | ');
        }

        // حالة 4: نص عادي
        if (typeof data === 'string') return data;

        return error?.message || 'خطأ غير متوقع';
    };

    // ═══ دالة حفظ مشتركة — تستدعي BFF مباشرة لتجاوز Circuit Breaker ═══
    const saveEmployeeDirectly = async (employeeData, empId) => {
        const url = empId ? `/api/hr/employees/${empId}` : '/api/hr/employees';
        const method = empId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(json.message || json.error || `خطأ ${res.status}`);
            err.response = { data: json, status: res.status };
            err.status = res.status;
            throw err;
        }
        if (json.success === false) {
            throw new Error(json.error || json.message || 'فشل في الحفظ');
        }
        return json;
    };

    // حفظ كمسودة
    const handleSaveDraft = async () => {
        const draftValidation = validateDraft(formData);
        if (!draftValidation.isValid) {
            setStepErrors(draftValidation.errors);
            setFormStep(1);
            toast.warning('الرجاء إدخال رقم الهوية والاسم الأول على الأقل لحفظ المسودة');
            return;
        }

        setSaving(true);
        try {
            const employeeData = buildEmployeePayload(formData);
            employeeData.status = 'Draft';

            const result = await saveEmployeeDirectly(
                employeeData,
                editMode && selectedEmployee?.id ? selectedEmployee.id : null,
            );

            if (!result || result.success === false) {
                throw new Error(result?.error || result?.message || 'لم يتم حفظ البيانات');
            }

            await onSaveComplete?.();
            toast.success('تم حفظ المسودة بنجاح');
        } catch (error) {
            console.error('Error saving draft:', error);
            const errorMsg = extractErrorMessage(error);
            toast.error(`فشل في حفظ المسودة: ${errorMsg}`);
        } finally {
            setSaving(false);
        }
    };

    // حفظ نهائي
    const handleFinalSave = async () => {
        // التحقق من جميع الخطوات
        const allValidation = validateAllSteps(formData);
        if (!allValidation.isValid) {
            const failedStep = allValidation.firstFailedStep;
            setFormStep(failedStep);
            setStepErrors(allValidation.results[failedStep].errors);
            const labels = allValidation.results[failedStep].errorList.map(e => e.label).join('، ');
            toast.warning(`الرجاء إكمال حقول الخطوة ${failedStep}: ${labels}`);
            // تحديث الخطوات المزارة
            setVisitedSteps(new Set([1, 2, 3, 4]));
            return;
        }

        setSaving(true);
        try {
            const employeeData = buildEmployeePayload(formData);
            employeeData.status = 'Active';

            const result = await saveEmployeeDirectly(
                employeeData,
                editMode && selectedEmployee?.id ? selectedEmployee.id : null,
            );

            if (!result || result.success === false) {
                throw new Error(result?.error || result?.message || 'لم يتم حفظ البيانات');
            }

            await onSaveComplete?.();
            toast.success(editMode ? 'تم تحديث بيانات الموظف بنجاح' : 'تم إضافة الموظف بنجاح');
        } catch (error) {
            console.error('Error saving employee:', error);
            const errorMsg = extractErrorMessage(error);
            toast.error(`فشل في الحفظ: ${errorMsg}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <ComplianceGauge percentage={formCompliance.percentage} />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {editMode ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                الخطوة {formStep} من 4 — تطابق التزام: <span className={`font-bold ${formCompliance.percentage >= 90 ? 'text-emerald-600' : formCompliance.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{formCompliance.percentage}%</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Step Indicators */}
                <StepIndicator
                    formStep={formStep}
                    setFormStep={handleStepClick}
                    formData={formData}
                    visitedSteps={visitedSteps}
                />

                {/* Compliance Bar */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">تطابق التزام:</span>
                        <div className="flex-1 flex items-center gap-3">
                            {Object.entries(formCompliance.categories).map(([key, cat]) => {
                                const pct = cat.percentage;
                                const colorClass = pct >= 90 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
                                const barClass = pct >= 90 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';
                                return (
                                    <button key={key} className="flex-1 text-right group" onClick={() => handleStepClick(cat.step)} title={`${cat.label} - اضغط للانتقال`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] group-hover:underline ${formStep === cat.step ? 'font-bold text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>{cat.label}</span>
                                            <span className={`text-[10px] font-bold ${colorClass}`}>{pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="text-[9px] text-gray-400 mt-0.5">{cat.valid}/{cat.total} حقل</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {formCompliance.missingFields.length > 0 && formCompliance.percentage < 100 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {formCompliance.missingFields.slice(0, 5).map((f, i) => (
                                <button key={i} onClick={() => handleStepClick(f.step)}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition cursor-pointer border border-red-200 dark:border-red-800">
                                    {f.label}
                                </button>
                            ))}
                            {formCompliance.missingFields.length > 5 && (
                                <span className="text-[10px] px-2 py-0.5 text-gray-500 dark:text-gray-400">+{formCompliance.missingFields.length - 5} حقل آخر</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {formStep === 1 && (
                        <StepPersonalData
                            formData={formData}
                            handleInputChange={handleInputChange}
                            stepErrors={stepErrors}
                            lookups={lookups}
                            formatForSelect={formatForSelect}
                        />
                    )}
                    {formStep === 2 && (
                        <StepJobData
                            formData={formData}
                            setFormData={setFormData}
                            handleInputChange={handleInputChange}
                            stepErrors={stepErrors}
                            lookups={lookups}
                            formatForSelect={formatForSelect}
                            orgDepartments={orgDepartments}
                            getSectionsByDepartment={getSectionsByDepartment}
                            getUnitsBySection={getUnitsBySection}
                        />
                    )}
                    {formStep === 3 && (
                        <StepFinancialData
                            formData={formData}
                            handleInputChange={handleInputChange}
                            stepErrors={stepErrors}
                            lookups={lookups}
                            formatForSelect={formatForSelect}
                        />
                    )}
                    {formStep === 4 && (
                        <StepAdditionalData
                            formData={formData}
                            handleInputChange={handleInputChange}
                            stepErrors={stepErrors}
                            lookups={lookups}
                            formatForSelect={formatForSelect}
                        />
                    )}
                </div>

                {/* Footer - حفظ كمسودة + حفظ نهائي */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-lg transition font-medium"
                    >
                        إلغاء
                    </button>

                    <div className="flex items-center gap-3">
                        {formStep > 1 && (
                            <button
                                onClick={handlePrev}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-300 rounded-lg transition font-medium flex items-center gap-2"
                            >
                                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                السابق
                            </button>
                        )}

                        {/* حفظ كمسودة - متاح في جميع الخطوات */}
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="px-5 py-2.5 border-2 border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            حفظ كمسودة
                        </button>

                        {formStep < 4 ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium flex items-center gap-2"
                            >
                                التالي
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalSave}
                                disabled={saving}
                                className="px-8 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {editMode ? 'حفظ التعديلات' : 'حفظ نهائي'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
