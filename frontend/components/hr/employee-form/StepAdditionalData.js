import React from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { getFullNameAr } from '../../../lib/hr/employeeFormDefaults';

export default function StepAdditionalData({ formData, handleInputChange, stepErrors, lookups, formatForSelect }) {
    const totalSalary = parseFloat(formData.basicSalary || 0) +
        parseFloat(formData.housingAllowance || 0) +
        parseFloat(formData.transportAllowance || 0) +
        parseFloat(formData.phoneAllowance || 0) +
        parseFloat(formData.otherAllowances || 0);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">بيانات إضافية</h3>

            <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-4">المؤهلات العلمية</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect label="المستوى التعليمي *" name="educationLevel" value={formData.educationLevel} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر المستوى' }, ...formatForSelect(lookups.educationLevels || [], 'code', 'descAr')]}
                    error={stepErrors?.educationLevel} />
                <FormSelect label="التخصص" name="educationSpecialty" value={formData.educationSpecialty} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر التخصص' }, ...formatForSelect(lookups.specializations || [], 'code', 'descAr')]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="الجامعة/المعهد" name="university" value={formData.university} onChange={handleInputChange} />
                <FormInput label="سنة التخرج" name="graduationYear" type="number" value={formData.graduationYear} onChange={handleInputChange} placeholder="2020" />
            </div>

            <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mt-6 mb-4">الحالة والملاحظات</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect label="حالة الموظف" name="status" value={formData.status} onChange={handleInputChange}
                    options={[
                        ...(formatForSelect(lookups.employeeStatuses || [], 'code', 'descAr')),
                        { value: 'Draft', label: 'مسودة' },
                    ]} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">ملاحظات</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="أي ملاحظات إضافية..."
                />
            </div>

            {/* الملخص */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mt-6">
                <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mb-4">ملخص البيانات</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">الاسم</p>
                        <p className="font-medium">{getFullNameAr(formData) || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">رقم الهوية</p>
                        <p className="font-medium">{formData.nationalId || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">المسمى الوظيفي</p>
                        <p className="font-medium">{formData.position || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">الراتب الإجمالي</p>
                        <p className="font-medium text-green-600 dark:text-green-400">
                            {totalSalary.toLocaleString('ar-SA')} ريال
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
