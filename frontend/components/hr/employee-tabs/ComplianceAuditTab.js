import React, { useMemo, useState } from 'react';
import { calculateFormCompliance } from '../../../lib/hr/employeeValidation';
import { useOrganizationStructure } from '../../../context/OrganizationStructureContext';
import ComplianceGauge from '../employee-form/ComplianceGauge';

export default function ComplianceAuditTab({ employees, onEditEmployee }) {
    const { departments: orgDepartments } = useOrganizationStructure();
    const [expandedDept, setExpandedDept] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all'); // all | low | medium | high

    // حساب التطابق لكل موظف
    const employeeCompliance = useMemo(() => {
        return (employees || []).map(emp => {
            const empData = {
                nationalId: emp.nationalId || '',
                firstNameAr: emp.firstNameAr || emp.arName?.split(' ')?.[0] || '',
                fatherNameAr: emp.fatherNameAr || emp.arName?.split(' ')?.[1] || '',
                familyNameAr: emp.familyNameAr || emp.arName?.split(' ')?.slice(-1)?.[0] || '',
                gender: emp.gender || '',
                birthDate: emp.birthDate || '',
                nationality: emp.nationality || '',
                maritalStatus: emp.maritalStatus || '',
                phone: emp.mobile || emp.phone || '',
                employeeNumber: emp.employeeNumber || '',
                hireDate: emp.hireDate || '',
                contractType: emp.contractType || '',
                position: emp.position || emp.rank || '',
                departmentId: emp.departmentId?.toString() || '',
                basicSalary: emp.basicSalary?.toString() || emp.salary?.toString() || '',
                bankName: emp.bankName || '',
                iban: emp.iban || '',
                educationLevel: emp.educationLevel || '',
            };
            const compliance = calculateFormCompliance(empData);
            return {
                ...emp,
                name: emp.arName || emp.name || `${emp.firstNameAr || ''} ${emp.familyNameAr || ''}`.trim(),
                department_name: emp.department_name || emp.departmentName || getDeptName(emp.departmentId),
                compliance,
            };
        });
    }, [employees, orgDepartments]);

    function getDeptName(deptId) {
        if (!deptId) return 'بدون إدارة';
        const dept = (orgDepartments || []).find(d => d.id?.toString() === deptId?.toString());
        return dept?.name || 'غير محدد';
    }

    // إحصائيات عامة
    const orgStats = useMemo(() => {
        const total = employeeCompliance.length;
        const fullyCompliant = employeeCompliance.filter(e => e.compliance.percentage >= 90).length;
        const needsWork = employeeCompliance.filter(e => e.compliance.percentage < 50).length;
        const avgCompliance = total > 0
            ? Math.round(employeeCompliance.reduce((sum, e) => sum + e.compliance.percentage, 0) / total)
            : 0;
        return { total, fullyCompliant, needsWork, avgCompliance };
    }, [employeeCompliance]);

    // تجميع حسب الإدارة
    const departmentCompliance = useMemo(() => {
        const deptMap = {};
        for (const emp of employeeCompliance) {
            const deptId = emp.departmentId?.toString() || 'unassigned';
            const deptName = emp.department_name || 'بدون إدارة';
            if (!deptMap[deptId]) {
                deptMap[deptId] = { id: deptId, name: deptName, employees: [] };
            }
            deptMap[deptId].employees.push(emp);
        }
        for (const dept of Object.values(deptMap)) {
            dept.avgCompliance = Math.round(
                dept.employees.reduce((sum, e) => sum + e.compliance.percentage, 0) / dept.employees.length
            );
            dept.employeeCount = dept.employees.length;
        }
        return Object.values(deptMap).sort((a, b) => a.avgCompliance - b.avgCompliance);
    }, [employeeCompliance]);

    // فلترة الموظفين
    const filteredEmployees = useMemo(() => {
        let list = [...employeeCompliance];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(e =>
                e.name?.toLowerCase().includes(term) ||
                e.nationalId?.includes(term) ||
                e.employeeNumber?.toLowerCase().includes(term)
            );
        }

        if (filterLevel === 'low') list = list.filter(e => e.compliance.percentage < 50);
        else if (filterLevel === 'medium') list = list.filter(e => e.compliance.percentage >= 50 && e.compliance.percentage < 90);
        else if (filterLevel === 'high') list = list.filter(e => e.compliance.percentage >= 90);

        return list.sort((a, b) => a.compliance.percentage - b.compliance.percentage);
    }, [employeeCompliance, searchTerm, filterLevel]);

    const getBarColor = (pct) => {
        if (pct >= 90) return 'bg-emerald-500';
        if (pct >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getTextColor = (pct) => {
        if (pct >= 90) return 'text-emerald-700';
        if (pct >= 50) return 'text-amber-700';
        return 'text-red-700 dark:text-red-300';
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* نظرة عامة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{orgStats.avgCompliance}%</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">متوسط التطابق</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{orgStats.fullyCompliant}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">متطابق بالكامل (90%+)</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{orgStats.total}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">إجمالي الموظفين</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{orgStats.needsWork}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">يحتاج تحسين (أقل 50%)</p>
                </div>
            </div>

            {/* التطابق حسب الإدارة */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">التطابق حسب الإدارة</h4>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {departmentCompliance.map(dept => (
                        <div key={dept.id}>
                            <button
                                onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition"
                            >
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedDept === dept.id ? 'rotate-90' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="font-medium text-gray-800 dark:text-gray-100 flex-shrink-0">{dept.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({dept.employeeCount} موظف)</span>
                                <div className="flex-1 mx-4">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${getBarColor(dept.avgCompliance)}`}
                                            style={{ width: `${dept.avgCompliance}%` }} />
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${getTextColor(dept.avgCompliance)}`}>{dept.avgCompliance}%</span>
                            </button>
                            {expandedDept === dept.id && (
                                <div className="bg-gray-50 dark:bg-gray-800 px-10 py-3 space-y-2">
                                    {dept.employees
                                        .sort((a, b) => a.compliance.percentage - b.compliance.percentage)
                                        .map(emp => (
                                        <div key={emp.id || emp.nationalId} className="flex items-center gap-3 text-sm">
                                            <span className="text-gray-700 dark:text-gray-200 w-40 truncate">{emp.name}</span>
                                            <div className="flex-1">
                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${getBarColor(emp.compliance.percentage)}`}
                                                        style={{ width: `${emp.compliance.percentage}%` }} />
                                                </div>
                                            </div>
                                            <span className={`font-bold text-xs w-10 text-left ${getTextColor(emp.compliance.percentage)}`}>
                                                {emp.compliance.percentage}%
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditEmployee?.(emp); }}
                                                className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                                            >
                                                تعديل
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* جدول الموظفين التفصيلي */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-4 flex-wrap">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">تفاصيل الموظفين</h4>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الهوية..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 w-48"
                        />
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400"
                        >
                            <option value="all">جميع المستويات</option>
                            <option value="low">أقل من 50%</option>
                            <option value="medium">50% - 89%</option>
                            <option value="high">90% فأعلى</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">الموظف</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">الإدارة</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">التطابق</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">الحقول الناقصة</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredEmployees.slice(0, 50).map(emp => (
                                <tr key={emp.id || emp.nationalId} className="hover:bg-gray-50 transition cursor-pointer"
                                    onClick={() => onEditEmployee?.(emp)}>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{emp.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{emp.employeeNumber || emp.nationalId}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{emp.department_name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <ComplianceGauge percentage={emp.compliance.percentage} size={40} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {emp.compliance.missingFields.slice(0, 3).map((f, i) => (
                                                <span key={i} className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                                                    {f.label}
                                                </span>
                                            ))}
                                            {emp.compliance.missingFields.length > 3 && (
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1">+{emp.compliance.missingFields.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditEmployee?.(emp); }}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline text-xs font-medium"
                                        >
                                            تعديل
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEmployees.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">لا توجد نتائج</div>
                    )}
                    {filteredEmployees.length > 50 && (
                        <div className="text-center py-3 text-xs text-gray-400">
                            يُعرض أول 50 موظف من {filteredEmployees.length}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
