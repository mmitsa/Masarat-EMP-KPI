import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/NotificationContext';
import { PERMISSION_TYPES, SYSTEM_MODULES, DEFAULT_PERMISSIONS, JOB_TITLES } from '../../lib/permissions';
import { ContentCard, Button, SearchInput, Badge } from '../ui';
import PermissionGuard from '../PermissionGuard';
import Tabs from '../ui/Tabs';
import api from '../../lib/api';
import useEmployeeSearch from '../../hooks/useEmployeeSearch';

/**
 * ModulePermissionsTab - تبويب صلاحيات العمليات
 * يعرض مصفوفة الصلاحيات للشاشات × المستفيدين (موظفين/مناصب)
 */
export default function ModulePermissionsTab({ moduleId, screens: screensProp, className = '' }) {
    const { isDarkMode } = useTheme();
    const toast = useToast();

    // بحث الموظفين عبر API مع fallback محلي
    const { employees: searchResults, loading: searchLoading, search: searchEmployeesAPI, clearResults } = useEmployeeSearch();

    const [search, setSearch] = useState('');
    const [assignMode, setAssignMode] = useState('position');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // المستفيدون المختارون
    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`masarat-ops-beneficiaries-${moduleId}`);
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* تجاهل */ }
            }
        }
        return [];
    });

    const [permissions, setPermissions] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`masarat-permissions-${moduleId}`);
            if (saved) return JSON.parse(saved);
        }
        return {};
    });

    // تحميل صلاحيات العمليات من API (مع fallback إلى localStorage)
    useEffect(() => {
        async function loadFromAPI() {
            try {
                const data = await api.permissionsManagement.getOperationPermissions(moduleId);
                if (data && data.beneficiaries && data.beneficiaries.length > 0) {
                    // تحويل صيغة API إلى صيغة حالة المكون
                    const loadedBeneficiaries = data.beneficiaries.map(b => ({
                        id: b.beneficiaryId,
                        nameAr: b.beneficiaryName,
                        type: b.beneficiaryType,
                    }));
                    setSelectedBeneficiaries(loadedBeneficiaries);
                    // بناء حالة الصلاحيات من بيانات API
                    const perms = {};
                    data.beneficiaries.forEach(b => {
                        Object.entries(b.operations || {}).forEach(([screenId, ops]) => {
                            Object.entries(ops).forEach(([opType, isGranted]) => {
                                const key = `${b.beneficiaryId}:${screenId}:${opType}`;
                                perms[key] = isGranted;
                            });
                        });
                    });
                    setPermissions(perms);
                    // تخزين مؤقت في localStorage
                    localStorage.setItem(`masarat-ops-beneficiaries-${moduleId}`, JSON.stringify(loadedBeneficiaries));
                    localStorage.setItem(`masarat-permissions-${moduleId}`, JSON.stringify(perms));
                    return;
                }
            } catch (err) {
                console.warn('Failed to load operation permissions from API, using localStorage:', err.message);
            }
            // Fallback: كود localStorage الموجود مسبقاً (تم تحميله بالفعل في useState)
        }
        loadFromAPI();
    }, [moduleId]);

    // شاشات الموديول
    const moduleScreens = useMemo(() => {
        if (screensProp && screensProp.length > 0) return screensProp;
        const module = SYSTEM_MODULES?.[moduleId];
        if (!module?.screens) return [];
        return module.screens;
    }, [moduleId, screensProp]);

    // أنواع العمليات
    const permTypes = useMemo(() => Object.values(PERMISSION_TYPES), []);

    // المناصب الوظيفية
    const allPositions = useMemo(() => {
        return Object.values(JOB_TITLES).map(j => ({
            id: j.id, nameAr: j.nameAr, category: j.category, type: 'position',
        }));
    }, []);

    // الأعمدة: مدير النظام + المستفيدون
    const columns = useMemo(() => {
        const cols = [{ id: 'super_admin', nameAr: 'مدير النظام', type: 'system' }];
        selectedBeneficiaries.forEach(b => cols.push(b));
        return cols;
    }, [selectedBeneficiaries]);

    // فلترة - استخدام نتائج البحث من API بدلاً من MOCK_EMPLOYEES
    const filteredEmployees = useMemo(() => {
        return searchResults;
    }, [searchResults]);

    const filteredPositions = useMemo(() => {
        if (!employeeSearch) return allPositions;
        return allPositions.filter(p => p.nameAr.includes(employeeSearch));
    }, [allPositions, employeeSearch]);

    const filteredScreens = useMemo(() => {
        if (!search) return moduleScreens;
        return moduleScreens.filter(s => s.nameAr?.includes(search) || s.id?.includes(search));
    }, [moduleScreens, search]);

    // إضافة/إزالة مستفيد
    const addBeneficiary = useCallback((item, type) => {
        const newItem = type === 'employee'
            ? { id: `emp_${item.id}`, nameAr: item.name, department: item.department, type: 'employee', empId: item.id }
            : { id: `pos_${item.id}`, nameAr: item.nameAr, type: 'position', posId: item.id };
        setSelectedBeneficiaries(prev => {
            if (prev.some(b => b.id === newItem.id)) return prev;
            const updated = [...prev, newItem];
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-ops-beneficiaries-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
        setEmployeeSearch('');
        setShowDropdown(false);
    }, [moduleId]);

    const removeBeneficiary = useCallback((beneficiaryId) => {
        setSelectedBeneficiaries(prev => {
            const updated = prev.filter(b => b.id !== beneficiaryId);
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-ops-beneficiaries-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
    }, [moduleId]);

    const togglePermission = (colId, screenId, permTypeId) => {
        const key = `${colId}:${screenId}:${permTypeId}`;
        setPermissions(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-permissions-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const hasPermission = (colId, screenId, permTypeId) => {
        if (colId === 'super_admin') return true;
        const key = `${colId}:${screenId}:${permTypeId}`;
        return !!permissions[key];
    };

    const handleSave = async () => {
        // محاولة الحفظ عبر API أولاً
        try {
            const apiData = {
                beneficiaries: selectedBeneficiaries.map(b => ({
                    beneficiaryType: b.type,
                    beneficiaryId: b.id,
                    beneficiaryName: b.nameAr,
                    operations: Object.entries(permissions)
                        .filter(([key]) => key.startsWith(`${b.id}:`))
                        .map(([key, isGranted]) => {
                            const parts = key.split(':');
                            return {
                                screenId: parts[1],
                                permissionType: parts[2],
                                isGranted,
                            };
                        }),
                })),
            };
            await api.permissionsManagement.saveOperationPermissions(moduleId, apiData);
        } catch (err) {
            console.warn('Failed to save to API, saved to localStorage only:', err.message);
        }
        // دائماً نحفظ في localStorage كنسخة مؤقتة
        if (typeof window !== 'undefined') {
            localStorage.setItem(`masarat-permissions-${moduleId}`, JSON.stringify(permissions));
            localStorage.setItem(`masarat-ops-beneficiaries-${moduleId}`, JSON.stringify(selectedBeneficiaries));
        }
        toast.success('تم حفظ الصلاحيات بنجاح');
    };

    if (moduleScreens.length === 0) {
        return (
            <PermissionGuard requires="it_permissions:manage">
                <ContentCard title={`صلاحيات ${getModuleName(moduleId)}`} className={className}>
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">لم يتم تعريف شاشات لهذا الموديول في نظام الصلاحيات بعد</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">يمكنك إدارة الصلاحيات من صفحة الإعدادات</p>
                    </div>
                </ContentCard>
            </PermissionGuard>
        );
    }

    return (
        <PermissionGuard requires="it_permissions:manage">
            <div className={className}>
                {/* ===== قسم إضافة المستفيدين ===== */}
                <ContentCard
                    title="اختيار المستفيدين"
                    subtitle="اختر الموظفين أو المناصب لتحديد صلاحيات العمليات"
                    className="mb-4"
                    allowOverflow
                >
                    <Tabs
                        tabs={[
                            { id: 'position', label: 'بالمنصب الوظيفي' },
                            { id: 'employee', label: 'بالاسم' },
                        ]}
                        activeTab={assignMode}
                        onChange={setAssignMode}
                        variant="pills"
                    />
                    <div className="mt-3 relative">
                        <SearchInput
                            value={employeeSearch}
                            onChange={(val) => {
                                setEmployeeSearch(val);
                                setShowDropdown(true);
                                if (assignMode === 'employee') {
                                    searchEmployeesAPI(val);
                                }
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder={assignMode === 'employee' ? 'ابحث باسم الموظف...' : 'ابحث بالمنصب الوظيفي...'}
                            className="w-full"
                        />
                        {showDropdown && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {assignMode === 'employee' ? (
                                    searchLoading ? (
                                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">جاري البحث...</div>
                                    ) : filteredEmployees.length > 0 ? filteredEmployees.map(emp => {
                                        const isAdded = selectedBeneficiaries.some(b => b.id === `emp_${emp.id}`);
                                        const posTitle = Object.values(JOB_TITLES).find(j => j.id === emp.position);
                                        return (
                                            <button key={emp.id} disabled={isAdded} onClick={() => addBeneficiary(emp, 'employee')}
                                                className={`w-full text-right px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{emp.department} - {posTitle?.nameAr || emp.position}</div>
                                                </div>
                                                {isAdded && <Badge variant="secondary" className="text-[9px]">مضاف</Badge>}
                                            </button>
                                        );
                                    }) : employeeSearch.length >= 2 ? <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">لا توجد نتائج</div> : <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">اكتب حرفين على الأقل للبحث</div>
                                ) : (
                                    filteredPositions.length > 0 ? filteredPositions.map(pos => {
                                        const isAdded = selectedBeneficiaries.some(b => b.id === `pos_${pos.id}`);
                                        return (
                                            <button key={pos.id} disabled={isAdded} onClick={() => addBeneficiary(pos, 'position')}
                                                className={`w-full text-right px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{pos.nameAr}</div>
                                                {isAdded && <Badge variant="secondary" className="text-[9px]">مضاف</Badge>}
                                            </button>
                                        );
                                    }) : <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">لا توجد نتائج</div>
                                )}
                            </div>
                        )}
                    </div>
                    {selectedBeneficiaries.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedBeneficiaries.map(b => (
                                <span key={b.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/20">
                                    <span className="text-xs opacity-70">{b.type === 'employee' ? '👤' : '💼'}</span>
                                    {b.nameAr}
                                    <button onClick={() => removeBeneficiary(b.id)} className="mr-1 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors text-[10px]" title="إزالة">✕</button>
                                </span>
                            ))}
                        </div>
                    )}
                </ContentCard>

                {/* ===== مصفوفة صلاحيات العمليات ===== */}
                <ContentCard
                    title={`صلاحيات العمليات - ${getModuleName(moduleId)}`}
                    subtitle="تحديد العمليات المسموحة لكل مستفيد على كل شاشة"
                >
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <SearchInput value={search} onChange={setSearch} placeholder="بحث في الشاشات..." className="w-64" />
                        <Button variant="primary" onClick={handleSave}>حفظ الصلاحيات</Button>
                    </div>

                    {columns.length <= 1 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">أضف موظفين أو مناصب من القسم أعلاه لتحديد صلاحياتهم</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 sticky right-0 bg-white dark:bg-gray-800 z-10 min-w-[120px]">
                                                المستفيد / الشاشة
                                            </th>
                                            {filteredScreens.map(screen => (
                                                <th key={screen.id} className="text-center py-3 px-1 font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                                                    <span className="text-xs">{screen.nameAr || screen.id}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {columns.map(col => (
                                            <React.Fragment key={col.id}>
                                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                                    <td colSpan={filteredScreens.length + 1} className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                                        <span className="text-xs opacity-50 ml-1">{col.type === 'employee' ? '👤' : col.type === 'position' ? '💼' : '⚙️'}</span>
                                                        {col.nameAr}
                                                        {col.id === 'super_admin' && <Badge variant="primary" className="mr-2">كامل</Badge>}
                                                    </td>
                                                </tr>
                                                {permTypes.map(perm => (
                                                    <tr key={`${col.id}-${perm.id}`} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                                        <td className="py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400 pr-6 sticky right-0 bg-white dark:bg-gray-800">
                                                            {perm.nameAr}
                                                        </td>
                                                        {filteredScreens.map(screen => (
                                                            <td key={`${col.id}-${screen.id}-${perm.id}`} className="text-center py-1.5 px-1">
                                                                <button
                                                                    onClick={() => togglePermission(col.id, screen.id, perm.id)}
                                                                    disabled={col.id === 'super_admin'}
                                                                    className={`w-6 h-6 rounded-md text-xs font-bold transition-colors duration-150
                                                                        ${hasPermission(col.id, screen.id, perm.id)
                                                                            ? 'text-white shadow-sm dark:shadow-gray-900/20'
                                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                        }
                                                                        ${col.id === 'super_admin' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                                                                    `}
                                                                    style={hasPermission(col.id, screen.id, perm.id) ? { backgroundColor: perm.color || '#165C2D' } : undefined}
                                                                >
                                                                    {hasPermission(col.id, screen.id, perm.id) ? '✓' : ''}
                                                                </button>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                                {permTypes.map(perm => (
                                    <div key={perm.id} className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: perm.color || '#165C2D' }} />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{perm.nameAr}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </ContentCard>
            </div>
        </PermissionGuard>
    );
}

function getModuleName(moduleId) {
    const names = {
        hr: 'الموارد البشرية',
        warehouse: 'المستودعات',
        movement: 'إدارة الحركة',
        archiving: 'الأرشفة',
        finance: 'الإدارة المالية',
        sadad: 'سداد',
        epm: 'قياس الأداء',
        grc: 'الحوكمة والمخاطر',
        analytics: 'التحليلات',
        projects: 'المشاريع',
        itsm: 'الدعم الفني',
    };
    return names[moduleId] || moduleId;
}
