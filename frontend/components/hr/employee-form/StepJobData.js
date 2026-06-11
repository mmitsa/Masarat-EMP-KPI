import React, { useState, useEffect, useCallback } from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import InlineOrgCreateModal from './InlineOrgCreateModal';
import { formatHijri } from '../../../utils/hijriDate';

export default function StepJobData({
    formData, setFormData, handleInputChange, stepErrors,
    lookups, formatForSelect,
    orgDepartments, getSectionsByDepartment, getUnitsBySection,
}) {
    const [orgCreateType, setOrgCreateType] = useState(null);

    // ═══ بيانات سلم الرواتب ═══
    const [salaryLookup, setSalaryLookup] = useState(null); // كل البيانات الهرمية
    const [salaryLoading, setSalaryLoading] = useState(false);
    const [salaryError, setSalaryError] = useState(null);

    // جلب كل بيانات سلم الرواتب مرة واحدة
    useEffect(() => {
        let cancelled = false;
        async function fetchSalaryLookup() {
            setSalaryLoading(true);
            setSalaryError(null);
            try {
                const res = await fetch('/api/hr/salary-scales/lookup?type=all');
                const json = await res.json();
                if (!cancelled) {
                    if (json.success && Array.isArray(json.data)) {
                        setSalaryLookup(json.data);
                    } else {
                        setSalaryLookup([]);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    console.warn('فشل جلب بيانات سلم الرواتب:', err.message);
                    setSalaryError('فشل في تحميل بيانات سلم الرواتب');
                    setSalaryLookup([]);
                }
            } finally {
                if (!cancelled) setSalaryLoading(false);
            }
        }
        fetchSalaryLookup();
        return () => { cancelled = true; };
    }, []);

    // ═══ استخراج القوائم المتسلسلة من البيانات الهرمية ═══
    const cadreOptions = (salaryLookup || []).map(c => ({
        value: c.id?.toString(),
        label: c.nameAr || c.code,
    }));

    // سلالم الرواتب حسب الكادر المختار
    const selectedCadre = (salaryLookup || []).find(c => c.id?.toString() === formData.cadreId);
    const scaleOptions = (selectedCadre?.scales || []).map(s => ({
        value: s.id?.toString(),
        label: s.nameAr || s.code,
    }));

    // المراتب حسب السلم المختار
    const selectedScale = (selectedCadre?.scales || []).find(s => s.id?.toString() === formData.salaryScaleId);
    const gradeOptions = (selectedScale?.grades || []).map(g => ({
        value: g.id?.toString(),
        label: g.nameAr || `المرتبة ${g.gradeNumber}`,
    }));

    // الدرجات (Steps) حسب المرتبة المختارة
    const selectedGrade = (selectedScale?.grades || []).find(g => g.id?.toString() === formData.gradeScaleId);
    const stepOptions = (selectedGrade?.steps || []).map(st => ({
        value: st.stepNumber?.toString(),
        label: `الدرجة ${st.stepNumber} — ${Number(st.basicSalary || 0).toLocaleString('ar-SA')} ريال`,
    }));

    // ═══ Handlers للقوائم المتسلسلة ═══
    const handleCadreChange = useCallback((e) => {
        setFormData(prev => ({
            ...prev,
            cadreId: e.target.value,
            salaryScaleId: '',
            gradeScaleId: '',
            currentStep: '',
        }));
    }, [setFormData]);

    const handleScaleChange = useCallback((e) => {
        setFormData(prev => ({
            ...prev,
            salaryScaleId: e.target.value,
            gradeScaleId: '',
            currentStep: '',
        }));
    }, [setFormData]);

    const handleGradeChange = useCallback((e) => {
        setFormData(prev => ({
            ...prev,
            gradeScaleId: e.target.value,
            currentStep: '',
        }));
    }, [setFormData]);

    // عند اختيار الدرجة (Step) → تعبئة الراتب تلقائياً
    const handleStepChange = useCallback((e) => {
        const stepNum = e.target.value;
        setFormData(prev => {
            const updated = { ...prev, currentStep: stepNum };

            // البحث عن بيانات الدرجة لتعبئة الراتب
            if (stepNum && selectedGrade?.steps) {
                const stepData = selectedGrade.steps.find(st => st.stepNumber?.toString() === stepNum);
                if (stepData) {
                    updated.basicSalary = stepData.basicSalary?.toString() || '';
                    updated.housingAllowance = stepData.housingAllowance?.toString() || '';
                    updated.transportAllowance = stepData.transportAllowance?.toString() || '';
                    updated.otherAllowances = stepData.otherAllowances?.toString() || '';
                }
            }

            return updated;
        });
    }, [setFormData, selectedGrade]);

    // ═══ Handlers الهيكل التنظيمي ═══
    const handleDepartmentChange = (e) => {
        setFormData(prev => ({ ...prev, departmentId: e.target.value, sectionId: '', unitId: '' }));
    };

    const handleSectionChange = (e) => {
        setFormData(prev => ({ ...prev, sectionId: e.target.value, unitId: '' }));
    };

    // معلومات الإدارة المحددة
    const selectedDept = (orgDepartments || []).find(d => d.id?.toString() === formData.departmentId);

    // معلومات المرتبة المختارة (للعرض)
    const gradeInfo = selectedGrade ? {
        minSalary: Number(selectedGrade.minSalary || 0),
        maxSalary: Number(selectedGrade.maxSalary || 0),
        annualIncrement: Number(selectedGrade.annualIncrement || 0),
        stepCount: selectedGrade.stepCount || 0,
    } : null;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">البيانات الوظيفية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="الرقم الوظيفي *" name="employeeNumber" value={formData.employeeNumber} onChange={handleInputChange} error={stepErrors?.employeeNumber} />
                <FormSelect label="الوظيفة *" name="position" value={formData.position} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر الوظيفة' }, ...formatForSelect(lookups.jobs || [], 'code', 'descAr')]}
                    error={stepErrors?.position} />
            </div>

            {/* الهيكل التنظيمي - قوائم متسلسلة مع أزرار الإضافة */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <p className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-3">الهيكل التنظيمي</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* الإدارة */}
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <FormSelect label="الإدارة *" name="departmentId" value={formData.departmentId}
                                onChange={handleDepartmentChange}
                                options={[
                                    { value: '', label: 'اختر الإدارة' },
                                    ...(orgDepartments || []).filter(d => d.isActive !== false).map(d => ({
                                        value: d.id?.toString(),
                                        label: d.name,
                                    })),
                                ]}
                                error={stepErrors?.departmentId} />
                        </div>
                        <button
                            type="button"
                            onClick={() => setOrgCreateType('department')}
                            className="mb-0.5 w-10 h-10 flex items-center justify-center bg-purple-200 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-300 transition flex-shrink-0"
                            title="إضافة إدارة جديدة"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* القسم */}
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <FormSelect label="القسم" name="sectionId" value={formData.sectionId}
                                onChange={handleSectionChange}
                                disabled={!formData.departmentId}
                                options={[
                                    { value: '', label: formData.departmentId ? 'اختر القسم' : '— اختر الإدارة أولاً —' },
                                    ...(formData.departmentId ? (getSectionsByDepartment(formData.departmentId) || []).map(s => ({
                                        value: s.id?.toString(),
                                        label: s.name,
                                    })) : []),
                                ]} />
                        </div>
                        <button
                            type="button"
                            onClick={() => setOrgCreateType('section')}
                            disabled={!formData.departmentId}
                            className={`mb-0.5 w-10 h-10 flex items-center justify-center rounded-lg transition flex-shrink-0 ${
                                formData.departmentId
                                    ? 'bg-purple-200 text-purple-700 dark:text-purple-300 hover:bg-purple-300'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title="إضافة قسم جديد"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    {/* الوحدة */}
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <FormSelect label="الوحدة" name="unitId" value={formData.unitId}
                                onChange={handleInputChange}
                                disabled={!formData.sectionId}
                                options={[
                                    { value: '', label: formData.sectionId ? 'اختر الوحدة' : '— اختر القسم أولاً —' },
                                    ...(formData.sectionId ? (getUnitsBySection(formData.sectionId) || []).map(u => ({
                                        value: u.id?.toString(),
                                        label: u.name,
                                    })) : []),
                                ]} />
                        </div>
                        <button
                            type="button"
                            onClick={() => setOrgCreateType('unit')}
                            disabled={!formData.sectionId}
                            className={`mb-0.5 w-10 h-10 flex items-center justify-center rounded-lg transition flex-shrink-0 ${
                                formData.sectionId
                                    ? 'bg-purple-200 text-purple-700 dark:text-purple-300 hover:bg-purple-300'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title="إضافة وحدة جديدة"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* التسلسل */}
                {formData.departmentId && (
                    <p className="text-xs text-purple-600 mt-2">
                        التسلسل: {(orgDepartments || []).find(d => d.id?.toString() === formData.departmentId)?.name || ''}
                        {formData.sectionId && ` ← ${(getSectionsByDepartment(formData.departmentId) || []).find(s => s.id?.toString() === formData.sectionId)?.name || ''}`}
                        {formData.unitId && ` ← ${(getUnitsBySection(formData.sectionId) || []).find(u => u.id?.toString() === formData.unitId)?.name || ''}`}
                    </p>
                )}

                {/* معلومات المناصب */}
                {selectedDept && (
                    <div className="mt-3 bg-white/70 rounded-lg p-3 flex items-center gap-6 text-xs text-gray-600 dark:text-gray-300">
                        <span>المدير: <strong className="text-gray-800 dark:text-gray-100">{selectedDept.managerName || 'غير محدد'}</strong></span>
                        <span>عدد الموظفين: <strong className="text-gray-800 dark:text-gray-100">{selectedDept.employeeCount || 0}</strong></span>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* سلم الرواتب والكوادر — قوائم متسلسلة */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-bold text-emerald-800">سلم الرواتب والكوادر</p>
                    {salaryLoading && (
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    )}
                </div>

                {salaryError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{salaryError}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* الكادر */}
                    <FormSelect
                        label="الكادر الوظيفي"
                        name="cadreId"
                        value={formData.cadreId}
                        onChange={handleCadreChange}
                        disabled={salaryLoading || !salaryLookup?.length}
                        options={[
                            { value: '', label: salaryLoading ? 'جاري التحميل...' : (cadreOptions.length ? 'اختر الكادر' : '— لا توجد كوادر —') },
                            ...cadreOptions,
                        ]}
                    />

                    {/* سلم الرواتب */}
                    <FormSelect
                        label="سلم الرواتب"
                        name="salaryScaleId"
                        value={formData.salaryScaleId}
                        onChange={handleScaleChange}
                        disabled={!formData.cadreId || !scaleOptions.length}
                        options={[
                            { value: '', label: formData.cadreId ? (scaleOptions.length ? 'اختر السلم' : '— لا يوجد سلم لهذا الكادر —') : '— اختر الكادر أولاً —' },
                            ...scaleOptions,
                        ]}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {/* المرتبة */}
                    <FormSelect
                        label="المرتبة"
                        name="gradeScaleId"
                        value={formData.gradeScaleId}
                        onChange={handleGradeChange}
                        disabled={!formData.salaryScaleId || !gradeOptions.length}
                        options={[
                            { value: '', label: formData.salaryScaleId ? (gradeOptions.length ? 'اختر المرتبة' : '— لا توجد مراتب —') : '— اختر السلم أولاً —' },
                            ...gradeOptions,
                        ]}
                    />

                    {/* الدرجة (Step) */}
                    <FormSelect
                        label="الدرجة"
                        name="currentStep"
                        value={formData.currentStep}
                        onChange={handleStepChange}
                        disabled={!formData.gradeScaleId || !stepOptions.length}
                        options={[
                            { value: '', label: formData.gradeScaleId ? (stepOptions.length ? 'اختر الدرجة' : '— لا توجد درجات —') : '— اختر المرتبة أولاً —' },
                            ...stepOptions,
                        ]}
                    />
                </div>

                {/* معلومات المرتبة المختارة */}
                {gradeInfo && (
                    <div className="mt-3 bg-white/70 rounded-lg p-3 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                        <span>الحد الأدنى: <strong className="text-emerald-700">{gradeInfo.minSalary.toLocaleString('ar-SA')} ريال</strong></span>
                        <span>الحد الأقصى: <strong className="text-emerald-700">{gradeInfo.maxSalary.toLocaleString('ar-SA')} ريال</strong></span>
                        <span>العلاوة السنوية: <strong className="text-blue-700 dark:text-blue-300">{gradeInfo.annualIncrement.toLocaleString('ar-SA')} ريال</strong></span>
                        <span>عدد الدرجات: <strong className="text-gray-800 dark:text-gray-100">{gradeInfo.stepCount}</strong></span>
                    </div>
                )}

                {/* ملخص الاختيار */}
                {formData.cadreId && (
                    <p className="text-xs text-emerald-600 mt-2">
                        التسلسل: {selectedCadre?.nameAr || ''}
                        {formData.salaryScaleId && ` ← ${(selectedCadre?.scales || []).find(s => s.id?.toString() === formData.salaryScaleId)?.nameAr || ''}`}
                        {formData.gradeScaleId && ` ← ${selectedGrade?.nameAr || `المرتبة ${selectedGrade?.gradeNumber}`}`}
                        {formData.currentStep && ` ← الدرجة ${formData.currentStep}`}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="المسمى الوظيفي" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
                <FormSelect label="الدرجة الوظيفية" name="jobGrade" value={formData.jobGrade} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر الدرجة' }, ...formatForSelect(lookups.salaryScales || [], 'code', 'descAr')]} />
                <FormSelect label="المستوى" name="jobLevel" value={formData.jobLevel} onChange={handleInputChange} options={[
                    { value: '', label: 'اختر المستوى' },
                    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
                    { value: '4', label: '4' }, { value: '5', label: '5' },
                ]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="المدير المباشر" name="managerId" value={formData.managerId} onChange={handleInputChange} />
                <FormSelect label="الفرع" name="branchId" value={formData.branchId} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر الفرع' }, ...formatForSelect(lookups.branches || [], 'id', 'descAr')]} />
            </div>

            {/* تاريخ التعيين — ميلادي + هجري */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    التواريخ الوظيفية
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <FormInput label="تاريخ التعيين (ميلادي) *" name="hireDate" type="date" value={formData.hireDate} onChange={handleInputChange} error={stepErrors?.hireDate} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">تاريخ التعيين (هجري)</label>
                        <div className={`w-full px-3 py-2 border rounded-lg text-sm min-h-[42px] flex items-center ${formData.hireDate ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                            {formData.hireDate ? formatHijri(formData.hireDate, 'short') : '— أدخل تاريخ التعيين —'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect label="نوع العقد *" name="contractType" value={formData.contractType} onChange={handleInputChange}
                    options={formatForSelect(lookups.contractTypes || [], 'code', 'descAr')}
                    error={stepErrors?.contractType} />
                <div>
                    <FormInput label="انتهاء العقد (ميلادي)" name="contractEndDate" type="date" value={formData.contractEndDate} onChange={handleInputChange} />
                    {formData.contractEndDate && (
                        <div className="mt-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded text-xs text-emerald-800 font-bold">
                            هـ: {formatHijri(formData.contractEndDate, 'short')}
                        </div>
                    )}
                </div>
                <div>
                    <FormInput label="انتهاء التجربة (ميلادي)" name="probationEndDate" type="date" value={formData.probationEndDate} onChange={handleInputChange} />
                    {formData.probationEndDate && (
                        <div className="mt-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded text-xs text-emerald-800 font-bold">
                            هـ: {formatHijri(formData.probationEndDate, 'short')}
                        </div>
                    )}
                </div>
            </div>

            {/* مودال إنشاء الهيكل التنظيمي */}
            <InlineOrgCreateModal
                type={orgCreateType}
                isOpen={!!orgCreateType}
                onClose={() => setOrgCreateType(null)}
                parentId={orgCreateType === 'section' ? formData.departmentId : orgCreateType === 'unit' ? formData.sectionId : null}
                departmentId={orgCreateType === 'unit' ? formData.departmentId : undefined}
                onCreated={(result) => {
                    if (orgCreateType === 'department') {
                        setFormData(prev => ({ ...prev, departmentId: result.id?.toString(), sectionId: '', unitId: '' }));
                    } else if (orgCreateType === 'section') {
                        setFormData(prev => ({ ...prev, sectionId: result.id?.toString(), unitId: '' }));
                    } else if (orgCreateType === 'unit') {
                        setFormData(prev => ({ ...prev, unitId: result.id?.toString() }));
                    }
                }}
            />
        </div>
    );
}
