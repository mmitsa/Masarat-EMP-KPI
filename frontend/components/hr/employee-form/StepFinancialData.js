import React from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';

export default function StepFinancialData({ formData, handleInputChange, stepErrors, lookups, formatForSelect }) {
    const totalSalary = parseFloat(formData.basicSalary || 0) +
        parseFloat(formData.housingAllowance || 0) +
        parseFloat(formData.transportAllowance || 0) +
        parseFloat(formData.phoneAllowance || 0) +
        parseFloat(formData.otherAllowances || 0);

    // هل الراتب معبأ من سلم الرواتب؟
    const isFromScale = !!(formData.cadreId && formData.gradeScaleId && formData.currentStep);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">البيانات المالية</h3>

            {/* تنبيه الربط بسلم الرواتب */}
            {isFromScale && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm font-bold text-emerald-800">الراتب والبدلات معبأة تلقائياً من سلم الرواتب</p>
                        <p className="text-xs text-emerald-600 mt-1">
                            تم ربط الموظف بسلم الرواتب (الدرجة {formData.currentStep}).
                            يمكنك تعديل القيم يدوياً إن لزم الأمر.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="الراتب الأساسي *" name="basicSalary" type="number" value={formData.basicSalary} onChange={handleInputChange} placeholder="0.00" error={stepErrors?.basicSalary} />
                <FormInput label="بدل السكن" name="housingAllowance" type="number" value={formData.housingAllowance} onChange={handleInputChange} placeholder="0.00" />
                <FormInput label="بدل النقل" name="transportAllowance" type="number" value={formData.transportAllowance} onChange={handleInputChange} placeholder="0.00" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="بدل الهاتف" name="phoneAllowance" type="number" value={formData.phoneAllowance} onChange={handleInputChange} placeholder="0.00" />
                <FormInput label="بدلات أخرى" name="otherAllowances" type="number" value={formData.otherAllowances} onChange={handleInputChange} placeholder="0.00" />
                <div className={`rounded-lg p-4 ${isFromScale ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    <p className={`text-sm ${isFromScale ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'}`}>
                        إجمالي الراتب
                        {isFromScale && <span className="text-[10px] mr-1">(من السلم)</span>}
                    </p>
                    <p className={`text-xl font-bold ${isFromScale ? 'text-emerald-800' : 'text-blue-800 dark:text-blue-200'}`}>
                        {totalSalary.toLocaleString('ar-SA')} ريال
                    </p>
                </div>
            </div>

            <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mt-6 mb-4">البيانات البنكية</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect label="البنك *" name="bankName" value={formData.bankName} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر البنك' }, ...formatForSelect(lookups.banks || [], 'code', 'descAr')]}
                    error={stepErrors?.bankName} />
                <FormInput label="رقم الحساب" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} />
                <FormInput label="رقم الآيبان *" name="iban" value={formData.iban} onChange={handleInputChange} placeholder="SA..." error={stepErrors?.iban} />
            </div>

            <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mt-6 mb-4">التأمينات</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="رقم التأمينات الاجتماعية" name="socialInsuranceNumber" value={formData.socialInsuranceNumber} onChange={handleInputChange} />
                <FormInput label="تاريخ التسجيل بالتأمينات" name="socialInsuranceDate" type="date" value={formData.socialInsuranceDate} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="رقم التأمين الطبي" name="medicalInsuranceNumber" value={formData.medicalInsuranceNumber} onChange={handleInputChange} />
                <FormSelect label="فئة التأمين الطبي" name="medicalInsuranceClass" value={formData.medicalInsuranceClass} onChange={handleInputChange} options={[
                    { value: '', label: 'اختر الفئة' },
                    { value: 'VIP', label: 'VIP' },
                    { value: 'A', label: 'الفئة A' },
                    { value: 'B', label: 'الفئة B' },
                    { value: 'C', label: 'الفئة C' },
                ]} />
            </div>
        </div>
    );
}
