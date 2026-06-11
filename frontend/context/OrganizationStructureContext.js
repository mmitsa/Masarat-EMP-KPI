import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getOrganizationSettings, updateOrganizationSettings, buildRootNode, DEFAULT_ORG_SETTINGS } from '../lib/hr/organizationSettings';

/**
 * سياق هيكلة الجهة - الإدارات والأقسام والوحدات والأعضاء
 * يوفر بيانات الهيكل التنظيمي لجميع المكونات في التطبيق
 * + إعدادات الجهة وصاحب الصلاحية
 *
 * يستخدم BFF API routes مباشرة (/api/hr/departments, /api/hr/sections, /api/hr/units)
 * بدلاً من Gateway لأن HR Backend غير مشغّل
 */

// ============================================
// BFF API Helper - استدعاء مباشر بدون Gateway
// ============================================

async function bffGet(path) {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
}

async function bffPost(path, data) {
    const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const err = new Error(errJson.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

async function bffPut(path, data) {
    const res = await fetch(path, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const err = new Error(errJson.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

async function bffDelete(path) {
    const res = await fetch(path, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const err = new Error(errJson.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

async function bffPatch(path) {
    const res = await fetch(path, {
        method: 'PATCH',
        credentials: 'include',
    });
    if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const err = new Error(errJson.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

// ============================================
// Context
// ============================================

const OrganizationStructureContext = createContext(null);

const STORAGE_KEY = 'masarat-org-structure';

function loadFromStorage() {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function saveToStorage(data) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Error saving org structure:', e);
    }
}

let idCounter = Date.now();
function generateId(prefix = 'item') {
    return `${prefix}-${++idCounter}`;
}

/**
 * استخراج مصفوفة بأمان من استجابة API
 * الاستجابة قد تكون: مصفوفة، {data:[...]}, {items:[...]}, {$values:[...]}, أو كائن فارغ {}
 */
function ensureArray(response) {
    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
        // {success, data: [...]} shape from BFF routes
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.items)) return response.items;
        if (Array.isArray(response.$values)) return response.$values;
        // {success, data: {data: [...], total}} nested shape
        if (response.data && Array.isArray(response.data.data)) return response.data.data;
    }
    return [];
}

export function OrganizationStructureProvider({ children }) {
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [units, setUnits] = useState([]);
    const [members, setMembers] = useState([]);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [orgSettings, setOrgSettings] = useState({ ...DEFAULT_ORG_SETTINGS });

    // ═══════════════════════════════════════════════════════════
    // تحميل البيانات من BFF مباشرة (بدون Gateway)
    // نستخدم Promise.allSettled حتى لو فشل طلب واحد تنجح البقية
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        let retryTimer;
        async function loadData(attempt = 1) {
            try {
                const results = await Promise.allSettled([
                    bffGet('/api/hr/departments'),
                    bffGet('/api/hr/sections'),
                    bffGet('/api/hr/units'),
                    bffGet('/api/hr/employees?pageSize=500&isActive=true'),
                ]);

                const anyFailed = results.some(r => r.status === 'rejected');

                // الإدارات
                if (results[0].status === 'fulfilled') {
                    setDepartments(ensureArray(results[0].value));
                } else {
                    console.warn('[OrgContext] فشل تحميل الإدارات:', results[0].reason?.message);
                    setDepartments([]);
                }

                // الأقسام الفرعية
                if (results[1].status === 'fulfilled') {
                    setSections(ensureArray(results[1].value));
                } else {
                    console.warn('[OrgContext] فشل تحميل الأقسام:', results[1].reason?.message);
                    setSections([]);
                }

                // الوحدات
                if (results[2].status === 'fulfilled') {
                    setUnits(ensureArray(results[2].value));
                } else {
                    console.warn('[OrgContext] فشل تحميل الوحدات:', results[2].reason?.message);
                    setUnits([]);
                }

                // الموظفون — نحملهم كاملين لربطهم بالإدارات/الأقسام/الوحدات
                if (results[3].status === 'fulfilled') {
                    const empResult = results[3].value;
                    const empList = ensureArray(empResult);
                    setMembers(empList);
                    const total = empResult?.pagination?.totalRecords ?? empList.length;
                    setEmployeeCount(total);
                } else {
                    console.warn('[OrgContext] فشل تحميل الموظفين:', results[3].reason?.message);
                    setMembers([]);
                }
                // إعادة المحاولة إذا فشل أي طلب (مثلاً الجلسة لم تجهز بعد)
                if (anyFailed && attempt < 3) {
                    retryTimer = setTimeout(() => loadData(attempt + 1), 2000 * attempt);
                }
            } catch (e) {
                console.error('[OrgContext] خطأ عام في تحميل البيانات:', e);
                setDepartments([]);
                setSections([]);
                setUnits([]);
                setMembers([]);
                // إعادة محاولة تلقائية
                if (attempt < 3) {
                    retryTimer = setTimeout(() => loadData(attempt + 1), 2000 * attempt);
                }
            }
            setLoading(false);
        }
        loadData();
        // تحميل إعدادات الجهة
        getOrganizationSettings().then(settings => {
            if (settings) setOrgSettings(settings);
        });
        return () => { if (retryTimer) clearTimeout(retryTimer); };
    }, []);

    // إعادة تحميل من API
    const refreshFromApi = useCallback(async () => {
        try {
            const results = await Promise.allSettled([
                bffGet('/api/hr/departments'),
                bffGet('/api/hr/sections'),
                bffGet('/api/hr/units'),
                bffGet('/api/hr/employees?pageSize=500&isActive=true'),
            ]);

            if (results[0].status === 'fulfilled') setDepartments(ensureArray(results[0].value));
            if (results[1].status === 'fulfilled') setSections(ensureArray(results[1].value));
            if (results[2].status === 'fulfilled') setUnits(ensureArray(results[2].value));
            if (results[3].status === 'fulfilled') {
                const empResult = results[3].value;
                const empList = ensureArray(empResult);
                setMembers(empList);
                const total = empResult?.pagination?.totalRecords ?? empList.length;
                setEmployeeCount(total);
            }
        } catch {
            // silently fail
        }
    }, []);

    // حفظ تلقائي عند أي تغيير
    useEffect(() => {
        if (!loading) {
            saveToStorage({ departments, sections, units, members });
        }
    }, [departments, sections, units, members, loading]);

    // ========== عمليات الإدارات (BFF مباشر) ==========
    const addDepartment = useCallback(async (dept) => {
        try {
            const result = await bffPost('/api/hr/departments', {
                name: dept.name || dept.nameAr,
                code: dept.code,
                description: dept.description,
                parentId: dept.parentId,
                managerId: dept.managerId,
            });
            await refreshFromApi();
            return result;
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    const updateDepartment = useCallback(async (id, updates) => {
        try {
            await bffPut(`/api/hr/departments/${id}`, updates);
            await refreshFromApi();
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    const deleteDepartment = useCallback(async (id) => {
        try {
            await bffDelete(`/api/hr/departments/${id}`);
            await refreshFromApi();
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    // ========== عمليات الأقسام الفرعية (BFF مباشر) ==========
    const addSection = useCallback(async (section) => {
        try {
            const result = await bffPost('/api/hr/sections', {
                nameAr: section.name || section.nameAr,
                nameEn: section.nameEn,
                code: section.code,
                departmentId: section.departmentId,
                managerId: section.managerId,
            });
            await refreshFromApi();
            return result;
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    const updateSection = useCallback(async (id, updates) => {
        try {
            await bffPut(`/api/hr/sections/${id}`, updates);
            await refreshFromApi();
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    const deleteSection = useCallback(async (id) => {
        try {
            await bffDelete(`/api/hr/sections/${id}`);
            await refreshFromApi();
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    // ========== عمليات الوحدات (BFF مباشر) ==========
    const addUnit = useCallback(async (unit) => {
        try {
            const result = await bffPost('/api/hr/units', {
                nameAr: unit.name || unit.nameAr,
                nameEn: unit.nameEn,
                code: unit.code,
                departmentId: unit.departmentId,
                sectionId: unit.sectionId,
                managerId: unit.managerId,
            });
            await refreshFromApi();
            return result;
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    const updateUnit = useCallback(async (id, updates) => {
        try {
            await bffPut(`/api/hr/units/${id}`, updates);
            await refreshFromApi();
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    const deleteUnit = useCallback(async (id) => {
        try {
            await bffDelete(`/api/hr/units/${id}`);
            await refreshFromApi();
        } catch (e) { throw e; }
    }, [refreshFromApi]);

    // ========== عمليات الأعضاء (محلية) ==========
    const assignMember = useCallback((member) => {
        const newMember = { ...member, id: generateId('mem') };
        setMembers(prev => [...prev, newMember]);
        return newMember;
    }, []);

    const updateMember = useCallback((id, updates) => {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, []);

    const removeMember = useCallback((id) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    // ========== استعلامات ==========

    // أقسام إدارة معينة (مع تحويل النوع لتجنب مقارنة string مع number)
    const getSectionsByDepartment = useCallback((departmentId) => {
        const deptId = parseInt(departmentId);
        if (isNaN(deptId)) return [];
        return sections.filter(s => parseInt(s.departmentId) === deptId && s.isActive !== false);
    }, [sections]);

    // وحدات قسم معين
    const getUnitsBySection = useCallback((sectionId) => {
        const secId = parseInt(sectionId);
        if (isNaN(secId)) return [];
        return units.filter(u => parseInt(u.sectionId) === secId && u.isActive !== false);
    }, [units]);

    // وحدات إدارة معينة
    const getUnitsByDepartment = useCallback((departmentId) => {
        const deptId = parseInt(departmentId);
        if (isNaN(deptId)) return [];
        return units.filter(u => parseInt(u.departmentId) === deptId && u.isActive !== false);
    }, [units]);

    // أعضاء حسب الفلتر
    const getMembers = useCallback(({ departmentId, sectionId, unitId } = {}) => {
        return members.filter(m => {
            if (departmentId && m.departmentId !== departmentId) return false;
            if (sectionId && m.sectionId !== sectionId) return false;
            if (unitId && m.unitId !== unitId) return false;
            return true;
        });
    }, [members]);

    // بناء الشجرة التنظيمية للهيكل
    const buildOrgTree = useCallback(() => {
        const deptNodes = departments
            .filter(d => d.isActive !== false)
            .map(dept => ({
                ...dept,
                type: 'department',
                children: sections
                    .filter(s => parseInt(s.departmentId) === parseInt(dept.id) && s.isActive !== false)
                    .map(sec => ({
                        ...sec,
                        type: 'section',
                        children: units
                            .filter(u => parseInt(u.sectionId) === parseInt(sec.id) && u.isActive !== false)
                            .map(unit => ({
                                ...unit,
                                type: 'unit',
                                members: members.filter(m => parseInt(m.unitId) === parseInt(unit.id)),
                            })),
                        members: members.filter(m => parseInt(m.sectionId) === parseInt(sec.id) && !m.unitId),
                    })),
                members: members.filter(m => parseInt(m.departmentId) === parseInt(dept.id) && !m.sectionId),
            }));

        // إضافة عقدة الجهة كجذر إذا كانت الإعدادات موجودة
        const rootNode = buildRootNode(orgSettings);
        if (rootNode) {
            return [{
                ...rootNode,
                children: deptNodes,
            }];
        }

        return deptNodes;
    }, [departments, sections, units, members, orgSettings]);

    // بناء شجرة محدودة بنطاق معين (لمدير إدارة/قسم/وحدة)
    const buildScopedOrgTree = useCallback((scope) => {
        if (!scope) return buildOrgTree();

        let filteredDepts = departments.filter(d => d.isActive);
        if (scope.type === 'department') {
            filteredDepts = filteredDepts.filter(d => d.id === scope.id);
        } else if (scope.type === 'section' && scope.departmentId) {
            filteredDepts = filteredDepts.filter(d => d.id === scope.departmentId);
        } else if (scope.type === 'unit' && scope.departmentId) {
            filteredDepts = filteredDepts.filter(d => d.id === scope.departmentId);
        }

        const deptNodes = filteredDepts.map(dept => {
            let deptSections = sections.filter(s => s.departmentId === dept.id && s.isActive);
            if (scope.type === 'section') {
                deptSections = deptSections.filter(s => s.id === scope.id);
            }

            return {
                ...dept,
                type: 'department',
                manager: dept.managerId ? { id: dept.managerId, name: dept.managerName } : null,
                employeeCount: members.filter(m => m.departmentId === dept.id).length,
                children: deptSections.map(sec => {
                    let secUnits = units.filter(u => u.sectionId === sec.id && u.isActive);
                    if (scope.type === 'unit') {
                        secUnits = secUnits.filter(u => u.id === scope.id);
                    }
                    return {
                        ...sec,
                        type: 'section',
                        manager: sec.managerId ? { id: sec.managerId, name: sec.managerName } : null,
                        employeeCount: members.filter(m => m.sectionId === sec.id).length,
                        children: secUnits.map(unit => ({
                            ...unit,
                            type: 'unit',
                            manager: unit.managerId ? { id: unit.managerId, name: unit.managerName } : null,
                            employeeCount: members.filter(m => m.unitId === unit.id).length,
                            members: members.filter(m => m.unitId === unit.id),
                        })),
                        members: members.filter(m => m.sectionId === sec.id && !m.unitId),
                    };
                }),
                members: members.filter(m => m.departmentId === dept.id && !m.sectionId),
            };
        });

        return deptNodes;
    }, [departments, sections, units, members, buildOrgTree]);

    // تحديث إعدادات الجهة
    const updateOrgSettings = useCallback(async (updates) => {
        const updated = await updateOrganizationSettings(updates);
        setOrgSettings(updated);
        return updated;
    }, []);

    // تعيين صاحب الصلاحية
    const setAuthorityHolderFn = useCallback(async (employee) => {
        const updated = await updateOrganizationSettings({
            authorityHolderId: employee?.id || null,
            authorityHolderName: employee?.name || '',
            authorityHolderPosition: employee?.position || 'رئيس الجهة',
        });
        setOrgSettings(updated);
        return updated;
    }, []);

    // نطاق المدير - يرجع فقط الإدارة وما تحتها
    const getManagerScope = useCallback((managerId) => {
        if (!managerId) return { departments: [], sections: [], units: [], members: [] };

        const managedDepts = departments.filter(d => d.managerId === managerId);
        const managedDeptIds = managedDepts.map(d => d.id);

        const managedSections = sections.filter(s =>
            managedDeptIds.includes(s.departmentId) || s.managerId === managerId
        );
        const managedSectionIds = managedSections.map(s => s.id);

        const managedUnits = units.filter(u =>
            managedDeptIds.includes(u.departmentId) ||
            managedSectionIds.includes(u.sectionId) ||
            u.managerId === managerId
        );

        const managedMembers = members.filter(m =>
            managedDeptIds.includes(m.departmentId)
        );

        return {
            departments: managedDepts,
            sections: managedSections,
            units: managedUnits,
            members: managedMembers,
        };
    }, [departments, sections, units, members]);

    // ========== دوال الترابط العلائقي ==========

    // التسلسل الهيكلي الكامل لموظف معين: إدارة ← قسم ← وحدة
    const getFullHierarchy = useCallback((employeeIdOrData) => {
        let deptId, secId, unitIdVal;

        if (typeof employeeIdOrData === 'object' && employeeIdOrData !== null) {
            deptId = employeeIdOrData.departmentId;
            secId = employeeIdOrData.sectionId;
            unitIdVal = employeeIdOrData.unitId;
        } else {
            const member = members.find(m => m.employeeId === employeeIdOrData || m.id === employeeIdOrData);
            if (!member) return { department: null, section: null, unit: null, breadcrumb: '' };
            deptId = member.departmentId;
            secId = member.sectionId;
            unitIdVal = member.unitId;
        }

        const department = departments.find(d => d.id === deptId) || null;
        const section = secId ? (sections.find(s => s.id === secId) || null) : null;
        const unit = unitIdVal ? (units.find(u => u.id === unitIdVal) || null) : null;

        const parts = [
            department?.name,
            section?.name,
            unit?.name,
        ].filter(Boolean);

        return {
            department,
            section,
            unit,
            breadcrumb: parts.join(' ← '),
            path: parts,
        };
    }, [departments, sections, units, members]);

    // الموظفون في وحدة معينة
    const getEmployeesByUnit = useCallback((unitId) => {
        return members.filter(m => m.unitId === unitId);
    }, [members]);

    // الموظفون في قسم معين (شامل جميع الوحدات التابعة)
    const getEmployeesBySection = useCallback((sectionId) => {
        return members.filter(m => m.sectionId === sectionId);
    }, [members]);

    // الموظفون في إدارة معينة (شامل جميع الأقسام والوحدات)
    const getEmployeesByDepartment = useCallback((departmentId) => {
        return members.filter(m => m.departmentId === departmentId);
    }, [members]);

    // البحث عن الكيان الأب لعنصر تنظيمي
    const getParentEntity = useCallback((entityId, entityType) => {
        if (entityType === 'unit') {
            const unit = units.find(u => u.id === entityId);
            if (!unit) return null;
            const section = sections.find(s => s.id === unit.sectionId);
            return section ? { ...section, type: 'section' } : null;
        }
        if (entityType === 'section') {
            const section = sections.find(s => s.id === entityId);
            if (!section) return null;
            const dept = departments.find(d => d.id === section.departmentId);
            return dept ? { ...dept, type: 'department' } : null;
        }
        return null;
    }, [departments, sections, units]);

    // إحصائيات (isActive !== false لأن SQL Server bit ترجع true/false أو 1/0)
    const stats = useMemo(() => ({
        totalDepartments: (Array.isArray(departments) ? departments : []).filter(d => d.isActive !== false && d.isActive !== 0).length,
        totalSections: (Array.isArray(sections) ? sections : []).filter(s => s.isActive !== false && s.isActive !== 0).length,
        totalUnits: (Array.isArray(units) ? units : []).filter(u => u.isActive !== false && u.isActive !== 0).length,
        totalMembers: employeeCount,
    }), [departments, sections, units, employeeCount]);

    const value = useMemo(() => ({
        // البيانات
        departments,
        sections,
        units,
        members,
        employeeCount,
        loading,
        stats,
        orgSettings,

        // عمليات الإدارات
        addDepartment,
        updateDepartment,
        deleteDepartment,

        // عمليات الأقسام
        addSection,
        updateSection,
        deleteSection,

        // عمليات الوحدات
        addUnit,
        updateUnit,
        deleteUnit,

        // عمليات الأعضاء
        assignMember,
        updateMember,
        removeMember,

        // استعلامات
        getSectionsByDepartment,
        getUnitsBySection,
        getUnitsByDepartment,
        getMembers,
        buildOrgTree,
        buildScopedOrgTree,
        getManagerScope,
        refreshFromApi,

        // ترابط علائقي
        getFullHierarchy,
        getEmployeesByUnit,
        getEmployeesBySection,
        getEmployeesByDepartment,
        getParentEntity,

        // إعدادات الجهة وصاحب الصلاحية
        updateOrgSettings,
        setAuthorityHolder: setAuthorityHolderFn,
    }), [
        departments, sections, units, members, employeeCount, loading, stats, orgSettings,
        addDepartment, updateDepartment, deleteDepartment,
        addSection, updateSection, deleteSection,
        addUnit, updateUnit, deleteUnit,
        assignMember, updateMember, removeMember,
        getSectionsByDepartment, getUnitsBySection, getUnitsByDepartment,
        getMembers, buildOrgTree, buildScopedOrgTree, getManagerScope, refreshFromApi,
        getFullHierarchy, getEmployeesByUnit, getEmployeesBySection,
        getEmployeesByDepartment, getParentEntity,
        updateOrgSettings, setAuthorityHolderFn,
    ]);

    return (
        <OrganizationStructureContext.Provider value={value}>
            {children}
        </OrganizationStructureContext.Provider>
    );
}

export function useOrganizationStructure() {
    const context = useContext(OrganizationStructureContext);
    if (!context) {
        throw new Error('useOrganizationStructure must be used within OrganizationStructureProvider');
    }
    return context;
}

export default OrganizationStructureContext;
