import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '../../context/NotificationContext';
import { SYSTEM_MODULES, JOB_TITLES } from '../../lib/permissions';
import { ContentCard, Button, SearchInput, Badge } from '../ui';
import Tabs from '../ui/Tabs';
import api from '../../lib/api';
import useEmployeeSearch from '../../hooks/useEmployeeSearch';

/**
 * ScreenPermissionsTab - مصفوفة صلاحيات الوصول للشاشات
 * يدعم اختيار المستفيدين بالاسم أو المنصب الوظيفي
 */
export default function ScreenPermissionsTab({ moduleId, screens: screensProp, className = '' }) {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [assignMode, setAssignMode] = useState('position'); // 'position' أو 'employee'
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

    // بحث الموظفين عبر API بدلاً من MOCK_EMPLOYEES
    const { employees: searchResults, loading: searchLoading, search: searchEmployeesAPI, clearResults } = useEmployeeSearch();

    // المستفيدون المختارون (موظفين + مناصب)
    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);

    const [screenAccess, setScreenAccess] = useState({});

    // تحميل البيانات من API أولاً مع fallback لـ localStorage
    useEffect(() => {
        async function loadFromAPI() {
            try {
                const data = await api.permissionsManagement.getScreenPermissions(moduleId);
                if (data && data.beneficiaries && data.beneficiaries.length > 0) {
                    // تحويل صيغة API إلى صيغة المكوّن
                    const loadedBeneficiaries = data.beneficiaries.map(b => ({
                        id: b.beneficiaryId,
                        nameAr: b.beneficiaryName,
                        type: b.beneficiaryType,
                        ...(b.beneficiaryType === 'employee' ? { department: b.department || '' } : {}),
                    }));
                    setSelectedBeneficiaries(loadedBeneficiaries);
                    // بناء screenAccess من البيانات
                    const access = {};
                    data.beneficiaries.forEach(b => {
                        Object.entries(b.screens || {}).forEach(([screenId, hasAccess]) => {
                            access[`${b.beneficiaryId}:${screenId}`] = hasAccess;
                        });
                    });
                    setScreenAccess(access);
                    // تخزين مؤقت في localStorage
                    localStorage.setItem(`masarat-beneficiaries-${moduleId}`, JSON.stringify(loadedBeneficiaries));
                    localStorage.setItem(`masarat-screen-access-${moduleId}`, JSON.stringify(access));
                    return;
                }
            } catch (err) {
                console.warn('Failed to load screen permissions from API, using localStorage:', err.message);
            }
            // Fallback: localStorage
            if (typeof window !== 'undefined') {
                const savedBeneficiaries = localStorage.getItem(`masarat-beneficiaries-${moduleId}`);
                if (savedBeneficiaries) {
                    try { setSelectedBeneficiaries(JSON.parse(savedBeneficiaries)); } catch (e) { /* تجاهل */ }
                }
                const savedAccess = localStorage.getItem(`masarat-screen-access-${moduleId}`);
                if (savedAccess) {
                    try { setScreenAccess(JSON.parse(savedAccess)); } catch (e) { /* تجاهل */ }
                }
            }
        }
        loadFromAPI();
    }, [moduleId]);

    // شاشات الموديول
    const moduleScreens = useMemo(() => {
        if (screensProp && screensProp.length > 0) return screensProp;
        const upperKey = moduleId?.toUpperCase();
        const mod = SYSTEM_MODULES[upperKey] || Object.values(SYSTEM_MODULES).find(m => m.id === moduleId);
        return mod?.screens || [];
    }, [moduleId, screensProp]);

    // المناصب الوظيفية المتاحة
    const allPositions = useMemo(() => {
        return Object.values(JOB_TITLES).map(j => ({
            id: j.id,
            nameAr: j.nameAr,
            category: j.category,
            type: 'position',
        }));
    }, []);

    // الأعمدة: المستفيدون المختارون + مدير النظام
    const columns = useMemo(() => {
        const cols = [{ id: 'super_admin', nameAr: 'مدير النظام', type: 'system' }];
        selectedBeneficiaries.forEach(b => cols.push(b));
        return cols;
    }, [selectedBeneficiaries]);

    // بحث الموظفين عبر API عند تغيّر نص البحث
    useEffect(() => {
        if (assignMode === 'employee' && employeeSearch) {
            searchEmployeesAPI(employeeSearch);
        } else if (assignMode === 'employee' && !employeeSearch) {
            clearResults();
        }
    }, [employeeSearch, assignMode, searchEmployeesAPI, clearResults]);

    // نتائج بحث الموظفين من الـ hook
    const filteredEmployees = searchResults;

    // فلترة المناصب
    const filteredPositions = useMemo(() => {
        if (!employeeSearch) return allPositions;
        return allPositions.filter(p => p.nameAr.includes(employeeSearch));
    }, [allPositions, employeeSearch]);

    // الشاشات المفلترة
    const filteredScreens = useMemo(() => {
        if (!search) return moduleScreens;
        return moduleScreens.filter(s =>
            s.nameAr?.includes(search) || s.id?.includes(search)
        );
    }, [moduleScreens, search]);

    // إضافة مستفيد (موظف أو منصب)
    const addBeneficiary = useCallback((item, type) => {
        const newItem = type === 'employee'
            ? { id: `emp_${item.id}`, nameAr: item.name, department: item.department, type: 'employee', empId: item.id }
            : { id: `pos_${item.id}`, nameAr: item.nameAr, type: 'position', posId: item.id };

        setSelectedBeneficiaries(prev => {
            if (prev.some(b => b.id === newItem.id)) return prev;
            const updated = [...prev, newItem];
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-beneficiaries-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
    }, [moduleId]);

    // إزالة مستفيد
    const removeBeneficiary = useCallback((beneficiaryId) => {
        setSelectedBeneficiaries(prev => {
            const updated = prev.filter(b => b.id !== beneficiaryId);
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-beneficiaries-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
        // حذف الصلاحيات المرتبطة
        setScreenAccess(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
                if (key.startsWith(`${beneficiaryId}:`)) delete updated[key];
            });
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-screen-access-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
    }, [moduleId]);

    const hasAccess = (colId, screenId) => {
        if (colId === 'super_admin') return true;
        return !!screenAccess[`${colId}:${screenId}`];
    };

    const toggleAccess = (colId, screenId) => {
        if (colId === 'super_admin') return;
        const key = `${colId}:${screenId}`;
        setScreenAccess(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-screen-access-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const toggleAllForColumn = (colId) => {
        if (colId === 'super_admin') return;
        const allEnabled = filteredScreens.every(s => hasAccess(colId, s.id));
        setScreenAccess(prev => {
            const updated = { ...prev };
            filteredScreens.forEach(s => {
                updated[`${colId}:${s.id}`] = !allEnabled;
            });
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-screen-access-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const toggleAllForScreen = (screenId) => {
        const editableCols = columns.filter(c => c.id !== 'super_admin');
        const allEnabled = editableCols.every(c => hasAccess(c.id, screenId));
        setScreenAccess(prev => {
            const updated = { ...prev };
            editableCols.forEach(c => {
                updated[`${c.id}:${screenId}`] = !allEnabled;
            });
            if (typeof window !== 'undefined') {
                localStorage.setItem(`masarat-screen-access-${moduleId}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const handleSave = async () => {
        try {
            const apiData = {
                beneficiaries: selectedBeneficiaries.map(b => ({
                    beneficiaryType: b.type,
                    beneficiaryId: b.id,
                    beneficiaryName: b.nameAr,
                    screens: Object.entries(screenAccess)
                        .filter(([key]) => key.startsWith(`${b.id}:`))
                        .map(([key, hasAccessVal]) => ({
                            screenId: key.split(':').slice(1).join(':'),
                            hasAccess: hasAccessVal,
                        })),
                })),
            };
            await api.permissionsManagement.saveScreenPermissions(moduleId, apiData);
        } catch (err) {
            console.warn('Failed to save to API, saved to localStorage only:', err.message);
        }
        // دائماً نحفظ في localStorage كـ cache
        if (typeof window !== 'undefined') {
            localStorage.setItem(`masarat-screen-access-${moduleId}`, JSON.stringify(screenAccess));
            localStorage.setItem(`masarat-beneficiaries-${moduleId}`, JSON.stringify(selectedBeneficiaries));
        }
        toast.success('تم حفظ صلاحيات الشاشات بنجاح');
    };

    if (moduleScreens.length === 0) {
        return (
            <ContentCard title="صلاحيات الشاشات" className={className}>
                <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)]">لم يتم تعريف شاشات لهذا الموديول بعد</p>
                </div>
            </ContentCard>
        );
    }

    return (
        <div className={className}>
            {/* ===== قسم إضافة المستفيدين ===== */}
            <ContentCard
                title="إضافة مستفيد"
                subtitle="اختر الموظفين أو المناصب الوظيفية لتعيين صلاحياتهم"
                className="mb-4"
                allowOverflow
            >
                {/* تبويبات الاختيار */}
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
                            setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        placeholder={assignMode === 'employee' ? 'ابحث باسم الموظف أو الإدارة...' : 'ابحث بالمنصب الوظيفي...'}
                        className="w-full"
                    />

                    {/* قائمة النتائج */}
                    {showEmployeeDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {assignMode === 'employee' ? (
                                searchLoading ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-[var(--color-primary-500)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        جاري البحث...
                                    </div>
                                ) : filteredEmployees.length > 0 ? filteredEmployees.map(emp => {
                                    const isAdded = selectedBeneficiaries.some(b => b.id === `emp_${emp.id}`);
                                    const posTitle = Object.values(JOB_TITLES).find(j => j.id === emp.position);
                                    return (
                                        <button
                                            key={emp.id}
                                            disabled={isAdded}
                                            onClick={() => addBeneficiary(emp, 'employee')}
                                            className={`w-full text-right px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                                ${isAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {emp.department} - {posTitle?.nameAr || emp.position}
                                                </div>
                                            </div>
                                            {isAdded && <Badge variant="secondary" className="text-[9px]">مضاف</Badge>}
                                        </button>
                                    );
                                }) : employeeSearch && employeeSearch.length >= 2 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">لا توجد نتائج</div>
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">اكتب حرفين على الأقل للبحث</div>
                                )
                            ) : (
                                filteredPositions.length > 0 ? filteredPositions.map(pos => {
                                    const isAdded = selectedBeneficiaries.some(b => b.id === `pos_${pos.id}`);
                                    return (
                                        <button
                                            key={pos.id}
                                            disabled={isAdded}
                                            onClick={() => addBeneficiary(pos, 'position')}
                                            className={`w-full text-right px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                                                ${isAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{pos.nameAr}</div>
                                            {isAdded && <Badge variant="secondary" className="text-[9px]">مضاف</Badge>}
                                        </button>
                                    );
                                }) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">لا توجد نتائج</div>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* المستفيدون المختارون */}
                {selectedBeneficiaries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {selectedBeneficiaries.map(b => (
                            <span
                                key={b.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                                    bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)] border border-[var(--color-primary-500)]/20"
                            >
                                <span className="text-xs opacity-70">{b.type === 'employee' ? '👤' : '💼'}</span>
                                {b.nameAr}
                                {b.department && <span className="text-[10px] opacity-60">({b.department})</span>}
                                <button
                                    onClick={() => removeBeneficiary(b.id)}
                                    className="mr-1 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors text-[10px]"
                                    title="إزالة"
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </ContentCard>

            {/* ===== مصفوفة الصلاحيات ===== */}
            <ContentCard
                title="مصفوفة صلاحيات الشاشات"
                subtitle="تحديد صلاحية الوصول لكل مستفيد على الشاشات"
            >
                {/* أدوات التحكم */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="بحث في الشاشات..."
                        className="w-64"
                    />
                    <Button variant="primary" onClick={handleSave}>
                        حفظ الصلاحيات
                    </Button>
                </div>

                {columns.length <= 1 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">أضف موظفين أو مناصب وظيفية من القسم أعلاه لتعيين صلاحياتهم</p>
                    </div>
                ) : (
                    <>
                        {/* المصفوفة */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                        <th className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 sticky right-0 bg-white dark:bg-gray-800 z-10 min-w-[180px]">
                                            الشاشة
                                        </th>
                                        {columns.map(col => (
                                            <th key={col.id} className="text-center py-3 px-2 min-w-[100px]">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] opacity-50">
                                                        {col.type === 'employee' ? '👤' : col.type === 'position' ? '💼' : '⚙️'}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">
                                                        {col.nameAr}
                                                    </span>
                                                    {col.id !== 'super_admin' && (
                                                        <button
                                                            onClick={() => toggleAllForColumn(col.id)}
                                                            className="text-[10px] text-[var(--color-primary-500)] hover:underline"
                                                            title="تحديد/إلغاء الكل"
                                                        >
                                                            الكل
                                                        </button>
                                                    )}
                                                    {col.id === 'super_admin' && (
                                                        <Badge variant="primary" className="text-[9px]">كامل</Badge>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredScreens.map((screen, idx) => (
                                        <tr
                                            key={screen.id}
                                            className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 group ${
                                                idx % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-gray-800/30'
                                            }`}
                                        >
                                            <td className="py-2.5 px-3 sticky right-0 bg-white dark:bg-gray-800 z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {screen.nameAr || screen.id}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleAllForScreen(screen.id)}
                                                        className="text-[10px] text-[var(--color-primary-500)] hover:underline opacity-0 group-hover:opacity-100"
                                                        title="تحديد/إلغاء الكل"
                                                    >
                                                        ↔
                                                    </button>
                                                </div>
                                            </td>
                                            {columns.map(col => (
                                                <td key={`${col.id}-${screen.id}`} className="text-center py-2.5 px-2">
                                                    <button
                                                        onClick={() => toggleAccess(col.id, screen.id)}
                                                        disabled={col.id === 'super_admin'}
                                                        aria-label={`${screen.nameAr} - ${col.nameAr}: ${hasAccess(col.id, screen.id) ? 'مفعّل' : 'معطّل'}`}
                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all duration-150 inline-flex items-center justify-center
                                                            ${hasAccess(col.id, screen.id)
                                                                ? 'bg-[var(--color-success)] text-white shadow-sm dark:shadow-gray-900/20'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                            }
                                                            ${col.id === 'super_admin' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'}
                                                        `}
                                                    >
                                                        {hasAccess(col.id, screen.id) ? '✓' : ''}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* مفتاح */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-[var(--color-success)]" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">مسموح بالوصول</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">ممنوع الوصول</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">👤</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">موظف بالاسم</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">💼</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">منصب وظيفي</span>
                            </div>
                        </div>
                    </>
                )}
            </ContentCard>
        </div>
    );
}
