import React, { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import { Modal, Badge, Button } from '../ui';
import { NAVIGATION } from '../../lib/routes';
import { navigateTo } from '../../lib/routeHelpers';
import api from '../../lib/api';
import { formatHijri, fmtDate } from '../../utils/hijriDate';
import {
    getEmployeeStatusName,
    getGenderName,
    getNationalityName,
    getMaritalStatusName,
} from './EltizamSelects';

/**
 * EmployeeProfileModal - نافذة عرض بيانات الموظف/الوافد الشاملة
 * مكون موحّد يُستخدم عبر جميع صفحات المنصة
 *
 * @param {boolean} isOpen - حالة فتح النافذة
 * @param {function} onClose - دالة الإغلاق
 * @param {object} employee - بيانات الموظف الأولية (يُستكمل من API)
 * @param {string} employeeId - معرف الموظف (بديل عن employee)
 * @param {boolean} isExpatriate - هل هو وافد
 * @param {object} expatriateData - بيانات الوافد الإضافية (جواز، إقامة..)
 */
const EmployeeProfileModal = memo(function EmployeeProfileModal({
    isOpen,
    onClose,
    employee: initialEmployee = null,
    employeeId = null,
    isExpatriate = false,
    expatriateData = null,
}) {
    const router = useRouter();
    const [employee, setEmployee] = useState(initialEmployee);
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState(null);

    // تحميل بيانات الموظف الكاملة من API
    const loadFullEmployeeData = useCallback(async (empId) => {
        if (!empId) return;
        setLoading(true);
        try {
            const [empRes, balanceRes, attendRes] = await Promise.allSettled([
                api.hr.getEmployee(empId),
                api.hr.leaves.getBalance(empId).catch(() => null),
                api.hr.getAttendanceReport(empId, getMonthStart(), getToday()).catch(() => null),
            ]);

            if (empRes.status === 'fulfilled' && empRes.value?.data) {
                const data = empRes.value.data?.employee || empRes.value.data;
                setEmployee(prev => ({ ...prev, ...data }));
            }
            if (balanceRes.status === 'fulfilled' && balanceRes.value?.data) {
                setLeaveBalance(balanceRes.value.data);
            }
            if (attendRes.status === 'fulfilled' && attendRes.value?.data) {
                setAttendanceStats(attendRes.value.data);
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات الموظف:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('personal');
            return;
        }

        if (initialEmployee) {
            setEmployee(initialEmployee);
            loadFullEmployeeData(initialEmployee.id || initialEmployee.employeeId);
        } else if (employeeId) {
            loadFullEmployeeData(employeeId);
        }
    }, [isOpen, initialEmployee, employeeId, loadFullEmployeeData]);

    const getStatusBadge = (status) => {
        const statusMap = {
            '01': { variant: 'success', label: 'على رأس العمل' },
            '02': { variant: 'warning', label: 'في إجازة' },
            '03': { variant: 'info', label: 'معار' },
            '04': { variant: 'info', label: 'منتدب' },
            '05': { variant: 'warning', label: 'مكلف' },
            '06': { variant: 'warning', label: 'موقوف عن العمل' },
            '07': { variant: 'danger', label: 'منتهية خدماته' },
            '08': { variant: 'secondary', label: 'متقاعد' },
            '09': { variant: 'danger', label: 'متوفى' },
            '10': { variant: 'danger', label: 'مستقيل' },
            'Active': { variant: 'success', label: 'نشط' },
            'OnLeave': { variant: 'warning', label: 'في إجازة' },
            'Suspended': { variant: 'danger', label: 'موقوف' },
            'Terminated': { variant: 'secondary', label: 'منتهي' },
        };
        const config = statusMap[status] || { variant: 'default', label: getEmployeeStatusName(status) || status || '-' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getName = () => employee?.fullName || employee?.name || employee?.employeeArName || '';

    // التابات الأساسية + تاب الوافدين إن كان وافداً
    const tabs = [
        { id: 'personal', label: 'البيانات الشخصية', icon: '👤' },
        { id: 'job', label: 'البيانات الوظيفية', icon: '💼' },
        { id: 'financial', label: 'البيانات المالية', icon: '💰' },
        { id: 'documents', label: 'المستندات', icon: '📄' },
        { id: 'attendance', label: 'الحضور والإجازات', icon: '📅' },
        ...(isExpatriate || expatriateData ? [{ id: 'expatriate', label: 'بيانات الإقامة', icon: '🌍' }] : []),
    ];

    const navigateToFullProfile = () => {
        const id = employee?.id || employee?.employeeId || employeeId;
        if (id) {
            onClose();
            navigateTo(router, NAVIGATION.HR.EMPLOYEE_UNIFIED_PROFILE(id));
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={employee ? `بيانات الموظف: ${getName()}` : 'بيانات الموظف'}
            size="xl"
        >
            {loading && !employee ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
                    </div>
                </div>
            ) : employee ? (
                <div className="space-y-4">
                    {/* رأس البطاقة */}
                    <EmployeeHeader
                        employee={employee}
                        expatriateData={expatriateData}
                        getStatusBadge={getStatusBadge}
                    />

                    {/* التابات */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-[var(--color-primary-500)] shadow-sm dark:shadow-gray-900/20'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <span className="ml-1">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* محتوى التابات */}
                    <div className="min-h-[300px]">
                        {activeTab === 'personal' && <PersonalTab employee={employee} />}
                        {activeTab === 'job' && <JobTab employee={employee} getStatusBadge={getStatusBadge} />}
                        {activeTab === 'financial' && <FinancialTab employee={employee} />}
                        {activeTab === 'documents' && <DocumentsTab employee={employee} />}
                        {activeTab === 'attendance' && <AttendanceTab employee={employee} leaveBalance={leaveBalance} attendanceStats={attendanceStats} />}
                        {activeTab === 'expatriate' && <ExpatriateTab expatriateData={expatriateData} employee={employee} />}
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex justify-between gap-3 pt-4 border-t border-[var(--border-light)] dark:border-gray-700">
                        <Button variant="outline" onClick={onClose}>
                            إغلاق
                        </Button>
                        <Button onClick={navigateToFullProfile}>
                            فتح الملف الكامل
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <p>لم يتم العثور على بيانات الموظف</p>
                </div>
            )}
        </Modal>
    );
});

// ══════════════════════════════════════════════════════════════
// رأس بطاقة الموظف
// ══════════════════════════════════════════════════════════════
function EmployeeHeader({ employee, expatriateData, getStatusBadge }) {
    const name = employee?.fullName || employee?.name || employee?.employeeArName || '؟';
    const nameEn = employee?.nameEn || employee?.employeeEnName || '';
    const position = employee?.position || employee?.jobTitle || 'غير محدد';
    const department = employee?.departmentName || employee?.department_name || '-';
    const empNumber = employee?.employeeNumber || employee?.id || employee?.employeeId;
    const avatar = employee?.avatar || employee?.photoUrl;

    return (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-l from-[var(--color-primary-50)] to-[var(--bg-accent)] dark:from-gray-700 dark:to-gray-800 rounded-xl">
            {avatar ? (
                <img
                    src={avatar}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                />
            ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-secondary-500)] flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                    {name.charAt(0)}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate">{name}</h3>
                {nameEn && <p className="text-sm text-gray-500 dark:text-gray-400" dir="ltr">{nameEn}</p>}
                <p className="text-gray-600 dark:text-gray-300">{position}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {getStatusBadge(employee?.status)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">#{empNumber}</span>
                    {expatriateData && (
                        <Badge variant="info">وافد</Badge>
                    )}
                </div>
            </div>
            <div className="text-left flex-shrink-0 hidden sm:block">
                <p className="text-sm text-gray-500 dark:text-gray-400">القسم</p>
                <p className="font-semibold text-gray-700 dark:text-gray-200">{department}</p>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// حقل بيانات واحد
// ══════════════════════════════════════════════════════════════
function InfoField({ label, value, dir, colSpan, className = '' }) {
    return (
        <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 ${colSpan ? `col-span-${colSpan}` : ''} ${className}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`font-medium dark:text-gray-100 ${!value || value === '-' ? 'text-gray-400' : ''}`} dir={dir}>
                {value || '-'}
            </p>
        </div>
    );
}

/** حقل تاريخ مزدوج: هجري (أساسي) + ميلادي (فرعي) */
function DateInfoField({ label, dateValue, className = '' }) {
    if (!dateValue) return <InfoField label={label} value={null} className={className} />;
    const hijri = formatHijri(dateValue, 'short');
    const greg = fmtDate(dateValue);
    return (
        <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 ${className}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="font-medium dark:text-gray-100">{hijri} <span className="text-[11px] text-gray-400">هـ</span></p>
            <p className="text-xs text-gray-400 mt-0.5">{greg} م</p>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// تاب البيانات الشخصية
// ══════════════════════════════════════════════════════════════
function PersonalTab({ employee }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
            <InfoField label="رقم الهوية" value={employee?.nationalId} />
            <InfoField label="الاسم الكامل" value={employee?.fullName || employee?.name || employee?.employeeArName} />
            <InfoField label="الاسم بالإنجليزية" value={employee?.nameEn || employee?.employeeEnName} dir="ltr" />
            <InfoField label="الجنس" value={employee?.genderName || getGenderName(employee?.gender) || (employee?.gender === 1 ? 'ذكر' : employee?.gender === 2 ? 'أنثى' : null)} />
            <InfoField label="الجنسية" value={employee?.nationalityName || getNationalityName(employee?.nationality) || employee?.nationalityNameAr} />
            <DateInfoField label="تاريخ الميلاد" dateValue={employee?.birthDate} />
            <InfoField label="الحالة الاجتماعية" value={employee?.maritalStatusName || getMaritalStatusName(employee?.maritalStatus)} />
            <InfoField label="البريد الإلكتروني" value={employee?.email} />
            <InfoField label="رقم الجوال" value={employee?.phone || employee?.phoneNumber} dir="ltr" />
            <InfoField
                label="العنوان"
                value={employee?.address}
                className="col-span-2 md:col-span-3"
            />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// تاب البيانات الوظيفية
// ══════════════════════════════════════════════════════════════
function JobTab({ employee, getStatusBadge }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
            <InfoField label="الرقم الوظيفي" value={employee?.employeeNumber || employee?.id} />
            <InfoField label="القسم" value={employee?.departmentName || employee?.department_name} />
            <InfoField label="المنصب الوظيفي" value={employee?.position || employee?.jobTitle} />
            <InfoField label="المرتبة / الدرجة" value={
                employee?.rank ? `م${employee.rank}${employee?.step ? ` / د${employee.step}` : ''}` : null
            } />
            <InfoField label="المستوى الوظيفي" value={employee?.jobLevel || employee?.grade} />
            <InfoField label="نوع العقد" value={employee?.contractTypeName} />
            <DateInfoField label="تاريخ التعيين" dateValue={employee?.hireDate} />
            <DateInfoField label="تاريخ انتهاء العقد" dateValue={employee?.contractEndDate} />
            <InfoField label="المدير المباشر" value={employee?.managerName} />
            <InfoField label="فرع العمل" value={employee?.branchName || employee?.workLocation} />
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">الحالة الوظيفية</p>
                <div>{getStatusBadge(employee?.status)}</div>
            </div>
            <InfoField label="سنوات الخبرة" value={employee?.yearsOfExperience} />
            <InfoField label="رقم التأمينات" value={employee?.socialInsuranceNumber} dir="ltr" />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// تاب البيانات المالية
// ══════════════════════════════════════════════════════════════
function FinancialTab({ employee }) {
    const salary = employee?.salary ? Number(employee.salary) : 0;

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* ملخص الراتب */}
            <div className="bg-gradient-to-l from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">إجمالي الراتب الشهري</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                            {salary ? salary.toLocaleString('ar-SA') : '0'} <span className="text-lg">ر.س</span>
                        </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoField label="الراتب الأساسي" value={employee?.basicSalary ? `${Number(employee.basicSalary).toLocaleString('ar-SA')} ر.س` : null} />
                <InfoField label="بدل السكن" value={employee?.housingAllowance ? `${Number(employee.housingAllowance).toLocaleString('ar-SA')} ر.س` : null} />
                <InfoField label="بدل النقل" value={employee?.transportAllowance ? `${Number(employee.transportAllowance).toLocaleString('ar-SA')} ر.س` : null} />
                <InfoField label="بدلات أخرى" value={employee?.otherAllowances ? `${Number(employee.otherAllowances).toLocaleString('ar-SA')} ر.س` : null} />
                <InfoField label="البنك" value={employee?.bankName} />
                <InfoField label="رقم الآيبان" value={employee?.iban} dir="ltr" />
                <InfoField label="نسبة التأمينات" value={employee?.socialInsurancePercentage ? `${employee.socialInsurancePercentage}%` : '9.75%'} />
                <InfoField label="صافي الراتب (تقديري)" value={
                    salary ? `${Math.round(salary * 0.9025).toLocaleString('ar-SA')} ر.س` : null
                } />
                <InfoField label="فئة الضريبة" value={employee?.taxCategory || 'معفى'} />
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// تاب المستندات
// ══════════════════════════════════════════════════════════════
function DocumentsTab({ employee }) {
    const documents = [
        { name: 'صورة الهوية', key: 'idCopy', icon: '🪪' },
        { name: 'صورة جواز السفر', key: 'passportCopy', icon: '📘' },
        { name: 'شهادة المؤهل', key: 'qualificationCert', icon: '🎓' },
        { name: 'شهادة الخبرة', key: 'experienceCert', icon: '📜' },
        { name: 'العقد الوظيفي', key: 'contract', icon: '📝' },
        { name: 'صورة شخصية', key: 'photo', icon: '📷' },
    ];

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* التوقيع الإلكتروني */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white">التوقيع الإلكتروني</h4>
                    <Badge variant={employee?.signatureEnabled ? 'success' : 'secondary'}>
                        {employee?.signatureEnabled ? 'مفعّل' : 'غير مفعّل'}
                    </Badge>
                </div>
                {employee?.signatureImageUrl ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <img src={employee.signatureImageUrl} alt="التوقيع" className="max-h-20 mx-auto" />
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">لم يتم رفع التوقيع بعد</p>
                )}
            </div>

            {/* البصمة البيومترية */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white">البصمة البيومترية</h4>
                    <Badge variant={employee?.hasBiometric ? 'success' : 'secondary'}>
                        {employee?.hasBiometric ? 'مسجّل' : 'غير مسجّل'}
                    </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">آخر مزامنة: </span>
                        <span className="font-medium dark:text-gray-200">{employee?.biometricLastSync || '-'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">تاريخ الانتهاء: </span>
                        <span className="font-medium dark:text-gray-200">{employee?.biometricExpiry || '-'}</span>
                    </div>
                </div>
            </div>

            {/* المستندات المرفقة */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">المستندات المرفقة</h4>
                <div className="grid grid-cols-2 gap-3">
                    {documents.map(doc => (
                        <div key={doc.key} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                            <span className="text-xl">{doc.icon}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{doc.name}</span>
                            {employee?.[doc.key] ? (
                                <Badge variant="success" size="sm">متوفر</Badge>
                            ) : (
                                <Badge variant="secondary" size="sm">غير متوفر</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// تاب الحضور والإجازات
// ══════════════════════════════════════════════════════════════
function AttendanceTab({ employee, leaveBalance, attendanceStats }) {
    const attendance = attendanceStats || {};
    const balance = leaveBalance || {};

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-4 gap-3">
                <StatBox value={attendance.presentDays || employee?.attendanceDays || 22} label="أيام الحضور" color="blue" />
                <StatBox value={attendance.absentDays || employee?.absenceDays || 0} label="أيام الغياب" color="red" />
                <StatBox value={attendance.lateDays || employee?.lateDays || 2} label="أيام التأخير" color="amber" />
                <StatBox value={balance.annual || employee?.leaveBalance || 21} label="رصيد الإجازات" color="emerald" />
            </div>

            {/* تفاصيل الإجازات */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">رصيد الإجازات</h4>
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{balance.annual || employee?.annualLeaveBalance || 21}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">سنوية</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{balance.sick || employee?.sickLeaveBalance || 30}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">مرضية</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{balance.emergency || employee?.emergencyLeaveBalance || 5}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">طارئة</p>
                    </div>
                </div>
            </div>

            {/* ساعات العمل */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">ساعات العمل</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <WorkInfoRow label="وقت الدوام" value={`${employee?.workStartTime || '08:00'} - ${employee?.workEndTime || '16:00'}`} />
                    <WorkInfoRow label="نوع الدوام" value={employee?.shiftType || 'دوام واحد'} />
                    <WorkInfoRow label="الساعات الأسبوعية" value={`${employee?.weeklyHours || 40} ساعة`} />
                    <WorkInfoRow label="العمل عن بعد" value={employee?.remoteWork ? 'مسموح' : 'غير مسموح'} />
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// تاب بيانات الوافد (الإقامة والجواز)
// ══════════════════════════════════════════════════════════════
function ExpatriateTab({ expatriateData, employee }) {
    const data = expatriateData || {};

    const getDaysColor = (days) => {
        if (days === null || days === undefined) return 'text-gray-500 dark:text-gray-400';
        if (days < 15) return 'text-red-600 dark:text-red-400';
        if (days < 30) return 'text-amber-600 dark:text-amber-400';
        return 'text-emerald-600 dark:text-emerald-400';
    };

    return (
        <div className="space-y-4 animate-fadeIn">
            {/* حالة الإقامة */}
            <div className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">حالة الإقامة</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                            {data.iqamaStatus === 'Valid' ? 'سارية' :
                             data.iqamaStatus === 'Expiring' ? 'تنتهي قريباً' :
                             data.iqamaStatus === 'Expired' ? 'منتهية' : data.iqamaStatus || '-'}
                        </p>
                    </div>
                    {data.daysToIqamaExpiry !== null && data.daysToIqamaExpiry !== undefined && (
                        <div className="text-center">
                            <p className={`text-3xl font-bold ${getDaysColor(data.daysToIqamaExpiry)}`}>
                                {data.daysToIqamaExpiry}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">يوم متبقي</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoField label="الجنسية" value={data.nationalityNameAr || employee?.nationalityName} />
                <InfoField label="رقم الإقامة" value={data.iqamaNumber} dir="ltr" />
                <DateInfoField label="تاريخ إصدار الإقامة" dateValue={data.iqamaIssueDate} />
                <DateInfoField label="تاريخ انتهاء الإقامة" dateValue={data.iqamaExpiryDate} />
                <InfoField label="رقم جواز السفر" value={data.passportNumber} dir="ltr" />
                <DateInfoField label="تاريخ انتهاء الجواز" dateValue={data.passportExpiryDate} />
                <InfoField label="مستوى المهارة" value={
                    data.skillLevel === 'HighSkilled' ? 'مهارة عالية' :
                    data.skillLevel === 'Skilled' ? 'ماهر' :
                    data.skillLevel === 'LowSkilled' ? 'منخفض المهارة' : data.skillLevel
                } />
                <InfoField label="نوع العقد" value={data.contractType === 'Permanent' ? 'دائم' : data.contractType === 'Contract' ? 'عقد' : data.contractType} />
                <InfoField label="الكفيل" value={data.sponsorType === 'Company' ? 'الشركة' : data.sponsorType} />
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// مكونات مساعدة صغيرة
// ══════════════════════════════════════════════════════════════
function StatBox({ value, label, color }) {
    const colorMap = {
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    };
    const textColor = {
        blue: 'text-blue-500 dark:text-blue-300',
        red: 'text-red-500 dark:text-red-300',
        amber: 'text-amber-500 dark:text-amber-300',
        emerald: 'text-emerald-500 dark:text-emerald-300',
    };

    return (
        <div className={`${colorMap[color]} rounded-xl p-3 text-center`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-xs ${textColor[color]}`}>{label}</p>
        </div>
    );
}

function WorkInfoRow({ label, value }) {
    return (
        <div className="flex justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-medium dark:text-gray-200">{value}</span>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// مساعدات
// ══════════════════════════════════════════════════════════════
function getMonthStart() {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

// ══════════════════════════════════════════════════════════════
// مكون اسم الموظف القابل للنقر (يُستخدم في الجداول)
// ══════════════════════════════════════════════════════════════
export function ClickableEmployeeName({
    employee,
    name: nameProp,
    nameField,
    subText,
    onClick,
    showAvatar = true,
    avatarColor = 'from-[var(--color-primary-500)] to-[var(--color-secondary-500)]',
}) {
    const name = nameField || nameProp || employee?.fullName || employee?.name || employee?.employeeArName || employee?.employeeName || employee?.driverName || '?';

    return (
        <div className="flex items-center gap-3">
            {showAvatar && (
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {name.charAt(0)}
                </div>
            )}
            <div className="min-w-0">
                <button
                    type="button"
                    className="font-medium text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] dark:text-[var(--color-primary-400,#60a5fa)] dark:hover:text-[var(--color-primary-300,#93c5fd)] hover:underline transition-colors text-right truncate block max-w-full"
                    onClick={onClick}
                    title={`عرض بيانات: ${name}`}
                >
                    {name}
                </button>
                {subText && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{subText}</div>
                )}
            </div>
        </div>
    );
}

export default EmployeeProfileModal;
