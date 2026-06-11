import React from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { getFullNameAr, getFullNameEn } from '../../../lib/hr/employeeFormDefaults';
import { formatHijri } from '../../../utils/hijriDate';

export default function StepPersonalData({ formData, handleInputChange, stepErrors, lookups, formatForSelect }) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">البيانات الشخصية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <FormInput label="رقم الهوية *" name="nationalId" value={formData.nationalId} onChange={handleInputChange} placeholder="1xxxxxxxxx" error={stepErrors?.nationalId} />
            </div>

            {/* الاسم الرباعي بالعربية */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-2">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-3">الاسم الرباعي بالعربية *</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <FormInput label="الاسم الأول *" name="firstNameAr" value={formData.firstNameAr} onChange={handleInputChange} placeholder="محمد" error={stepErrors?.firstNameAr} />
                    <FormInput label="اسم الأب *" name="fatherNameAr" value={formData.fatherNameAr} onChange={handleInputChange} placeholder="عبدالله" error={stepErrors?.fatherNameAr} />
                    <FormInput label="اسم الجد" name="grandfatherNameAr" value={formData.grandfatherNameAr} onChange={handleInputChange} placeholder="سعود" />
                    <FormInput label="اسم العائلة *" name="familyNameAr" value={formData.familyNameAr} onChange={handleInputChange} placeholder="الشهري" error={stepErrors?.familyNameAr} />
                </div>
                {(formData.firstNameAr || formData.familyNameAr) && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        الاسم الكامل: <span className="font-bold">{getFullNameAr(formData) || '—'}</span>
                    </p>
                )}
            </div>

            {/* الاسم الرباعي بالإنجليزية */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">الاسم الرباعي بالإنجليزية</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <FormInput label="First Name" name="firstNameEn" value={formData.firstNameEn} onChange={handleInputChange} placeholder="Mohammed" />
                    <FormInput label="Father Name" name="fatherNameEn" value={formData.fatherNameEn} onChange={handleInputChange} placeholder="Abdullah" />
                    <FormInput label="Grandfather" name="grandfatherNameEn" value={formData.grandfatherNameEn} onChange={handleInputChange} placeholder="Saud" />
                    <FormInput label="Family Name" name="familyNameEn" value={formData.familyNameEn} onChange={handleInputChange} placeholder="Al-Shahri" />
                </div>
                {(formData.firstNameEn || formData.familyNameEn) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Full Name: <span className="font-bold">{getFullNameEn(formData) || '—'}</span>
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect label="الجنس *" name="gender" value={formData.gender} onChange={handleInputChange}
                    options={formatForSelect(lookups.genders || [], 'code', 'descAr')} error={stepErrors?.gender} />
                <FormSelect label="الجنسية" name="nationality" value={formData.nationality} onChange={handleInputChange}
                    options={formatForSelect(lookups.nationalities || [], 'code', 'descAr')} />
            </div>

            {/* تاريخ الميلاد — ميلادي + هجري */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    تاريخ الميلاد
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput label="التاريخ الميلادي" name="birthDate" type="date" value={formData.birthDate} onChange={handleInputChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">التاريخ الهجري</label>
                        <div className={`w-full px-3 py-2 border rounded-lg text-sm min-h-[42px] flex items-center ${formData.birthDate ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                            {formData.birthDate ? formatHijri(formData.birthDate, 'short') : '— أدخل التاريخ الميلادي —'}
                        </div>
                    </div>
                    <FormSelect label="مكان الميلاد" name="birthPlace" value={formData.birthPlace} onChange={handleInputChange}
                        options={[{ value: '', label: 'اختر المكان' }, ...formatForSelect(lookups.cities || [], 'code', 'descAr')]} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect label="الديانة" name="religion" value={formData.religion} onChange={handleInputChange}
                    options={formatForSelect(lookups.religions || [], 'code', 'descAr')} />
                <FormSelect label="الحالة الاجتماعية" name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}
                    options={formatForSelect(lookups.maritalStatus || [], 'code', 'descAr')} />
                <FormInput label="عدد الأبناء" name="childrenCount" type="number" value={formData.childrenCount} onChange={handleInputChange} />
            </div>

            <h4 className="text-md font-bold text-gray-700 dark:text-gray-200 mt-6 mb-4">بيانات الاتصال</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="البريد الإلكتروني *" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="example@company.sa" />
                <FormInput label="الهاتف" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="01xxxxxxxx" />
                <FormInput label="الجوال *" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="05xxxxxxxx" error={stepErrors?.mobile} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="العنوان" name="address" value={formData.address} onChange={handleInputChange} className="md:col-span-2" />
                <FormSelect label="المدينة" name="city" value={formData.city} onChange={handleInputChange}
                    options={[{ value: '', label: 'اختر المدينة' }, ...formatForSelect(lookups.cities || [], 'code', 'descAr')]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="الرمز البريدي" name="postalCode" value={formData.postalCode} onChange={handleInputChange} />
                <FormInput label="جهة اتصال الطوارئ" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} />
                <FormInput label="هاتف الطوارئ" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} />
            </div>
        </div>
    );
}
