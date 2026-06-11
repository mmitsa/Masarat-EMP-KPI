import React, { useState, useMemo } from 'react';
import { SYSTEM_MODULES } from '../../lib/permissions';
import { MODULE_APPROVAL_WORKFLOWS } from '../../lib/moduleApprovalWorkflows';
import ModulePermissionsTab from './ModulePermissionsTab';
import ScreenPermissionsTab from './ScreenPermissionsTab';
import ApprovalWorkflowTab from './ApprovalWorkflowTab';
import Tabs from '../ui/Tabs';
import PermissionGuard from '../PermissionGuard';
import { ContentCard } from '../ui';

/**
 * تكوين التبويبات الداخلية لكل موديول
 * كل تبويب يفلتر الشاشات حسب بادئة الـ ID
 */
const MODULE_PERMISSION_TABS = {
    hr: [
        { id: 'all', label: 'الكل', prefixes: null },
        { id: 'employees', label: 'الموظفين', prefixes: ['hr_employees', 'hr_departments', 'hr_organization', 'hr_contracts', 'hr_documents', 'hr_clearance'] },
        { id: 'attendance', label: 'الحضور والانصراف', prefixes: ['hr_attendance'] },
        { id: 'leaves', label: 'الإجازات', prefixes: ['hr_leaves'] },
        { id: 'payroll', label: 'الرواتب والترقيات', prefixes: ['hr_payroll', 'hr_salaries', 'hr_promotions'] },
        { id: 'decisions', label: 'القرارات الإدارية', prefixes: ['hr_decisions', 'hr_delegations', 'hr_overtime', 'hr_transfers'] },
        { id: 'reports', label: 'التقارير والإعدادات', prefixes: ['hr_reports', 'hr_settings', 'hr_dashboard'] },
    ],
    warehouse: [
        { id: 'all', label: 'الكل', prefixes: null },
        { id: 'inventory', label: 'المخزون والأصناف', prefixes: ['warehouse_dashboard', 'warehouse_inventory', 'warehouse_items', 'warehouse_movements'] },
        { id: 'receiving', label: 'الاستلام', prefixes: ['warehouse_receiving', 'warehouse_temp_receive', 'warehouse_receipt_notes'] },
        { id: 'issuing', label: 'الصرف', prefixes: ['warehouse_issuing', 'warehouse_exchange'] },
        { id: 'stocktaking', label: 'الجرد والتحويلات', prefixes: ['warehouse_transfers', 'warehouse_stocktaking', 'warehouse_inventory_forms'] },
        { id: 'adjustments', label: 'التسويات والسنة المالية', prefixes: ['warehouse_adjustments', 'warehouse_fiscal_year', 'warehouse_stock_posting'] },
        { id: 'custody', label: 'العهد والإهلاك', prefixes: ['warehouse_custody', 'warehouse_depreciation'] },
        { id: 'reports', label: 'التقارير والإعدادات', prefixes: ['warehouse_reports', 'warehouse_settings'] },
    ],
    finance: [
        { id: 'all', label: 'الكل', prefixes: null },
        { id: 'gl', label: 'الأستاذ العام', prefixes: ['finance_gl'] },
        { id: 'budget', label: 'الموازنة', prefixes: ['finance_budget'] },
        { id: 'ap', label: 'الذمم الدائنة', prefixes: ['finance_ap'] },
        { id: 'procurement', label: 'المشتريات', prefixes: ['finance_procurement'] },
        { id: 'treasury', label: 'الخزينة', prefixes: ['finance_treasury'] },
        { id: 'assets', label: 'الأصول الثابتة', prefixes: ['finance_assets'] },
        { id: 'reports', label: 'التقارير والإعدادات', prefixes: ['finance_dashboard', 'finance_reports', 'finance_settings'] },
    ],
    grc: [
        { id: 'all', label: 'الكل', prefixes: null },
        { id: 'risks', label: 'المخاطر', prefixes: ['grc_risk'] },
        { id: 'incidents', label: 'الحوادث', prefixes: ['grc_incident'] },
        { id: 'compliance', label: 'الامتثال والسياسات', prefixes: ['grc_compliance', 'grc_policies', 'grc_audits'] },
    ],
    itsm: [
        { id: 'all', label: 'الكل', prefixes: null },
        { id: 'tickets', label: 'التذاكر', prefixes: ['itsm_tickets'] },
        { id: 'assets', label: 'الأصول التقنية', prefixes: ['itsm_assets'] },
        { id: 'config', label: 'الإعدادات', prefixes: ['itsm_specialists', 'itsm_categories', 'itsm_sla'] },
    ],
    projects: [
        { id: 'all', label: 'الكل', prefixes: null },
        { id: 'projects', label: 'المشاريع', prefixes: ['projects_dashboard', 'projects_list', 'projects_create', 'projects_edit', 'projects_members', 'projects_milestones'] },
        { id: 'tasks', label: 'المهام', prefixes: ['projects_tasks'] },
    ],
};

// أسماء الموديولات بالعربي
const MODULE_NAMES = {
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

/**
 * البحث عن الموديول في SYSTEM_MODULES بغض النظر عن حالة الأحرف
 */
function findModuleInSystemModules(moduleId) {
    const upperKey = moduleId?.toUpperCase();
    if (SYSTEM_MODULES[upperKey]) return SYSTEM_MODULES[upperKey];
    return Object.values(SYSTEM_MODULES).find(m => m.id === moduleId);
}

/**
 * فلترة الشاشات حسب البادئات
 */
function filterScreensByPrefixes(screens, prefixes) {
    if (!prefixes) return screens;
    return screens.filter(screen =>
        prefixes.some(prefix => screen.id.startsWith(prefix))
    );
}

/**
 * ModulePermissionsPage - صفحة صلاحيات الموديول مع 3 تبويبات رئيسية
 *
 * Tab 1: صلاحيات الشاشات - تحديد أي دور يدخل أي شاشة
 * Tab 2: صلاحيات العمليات - تحديد العمليات المسموحة لكل دور على كل شاشة
 * Tab 3: تسلسل الاعتمادات - بناء سلاسل الاعتمادات بالسحب والإفلات
 *
 * @param {string} moduleId - معرف الموديول (hr, warehouse, etc.)
 */
export default function ModulePermissionsPage({ moduleId }) {
    const [mainTab, setMainTab] = useState('screen_access');
    const [categoryTab, setCategoryTab] = useState('all');

    // شاشات الموديول من SYSTEM_MODULES
    const moduleData = useMemo(() => findModuleInSystemModules(moduleId), [moduleId]);
    const allScreens = moduleData?.screens || [];

    // هل يوجد تسلسلات اعتمادات لهذا الموديول
    const hasWorkflows = useMemo(
        () => (MODULE_APPROVAL_WORKFLOWS[moduleId]?.workflows?.length || 0) > 0,
        [moduleId]
    );

    // التبويبات الرئيسية (3 تابات)
    const mainTabs = useMemo(() => {
        const tabs = [
            { id: 'screen_access', label: 'صلاحيات الشاشات' },
            { id: 'operations', label: 'صلاحيات العمليات' },
        ];
        if (hasWorkflows) {
            tabs.push({ id: 'approvals', label: 'تسلسل الاعتمادات' });
        }
        return tabs;
    }, [hasWorkflows]);

    // تبويبات الفئات الفرعية (للموديولات الكبيرة)
    const categoryTabs = MODULE_PERMISSION_TABS[moduleId];
    const hasCategoryTabs = categoryTabs && categoryTabs.length > 1;

    // الشاشات المفلترة حسب الفئة
    const filteredScreens = useMemo(() => {
        if (!hasCategoryTabs || categoryTab === 'all') return allScreens;
        const tabConfig = categoryTabs.find(t => t.id === categoryTab);
        if (!tabConfig?.prefixes) return allScreens;
        return filterScreensByPrefixes(allScreens, tabConfig.prefixes);
    }, [categoryTab, allScreens, hasCategoryTabs, categoryTabs]);

    // مصفوفة تبويبات الفئات
    const categoryTabsArray = useMemo(() => {
        if (!hasCategoryTabs) return [];
        return categoryTabs.map(tab => {
            const count = tab.prefixes
                ? filterScreensByPrefixes(allScreens, tab.prefixes).length
                : allScreens.length;
            return { id: tab.id, label: tab.label, count };
        });
    }, [hasCategoryTabs, categoryTabs, allScreens]);

    // حالة عدم وجود شاشات
    if (allScreens.length === 0) {
        return (
            <ContentCard title={`صلاحيات ${MODULE_NAMES[moduleId] || moduleId}`}>
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-1">لم يتم تعريف شاشات لهذا الموديول بعد</p>
                    <p className="text-sm text-[var(--text-tertiary)]">يمكنك إدارة الصلاحيات من صفحة الإعدادات العامة</p>
                </div>
            </ContentCard>
        );
    }

    return (
        <PermissionGuard requires="it_permissions:manage">
            <div className="space-y-6">
                {/* عنوان ووصف */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-[var(--text-tertiary)]">
                            إدارة صلاحيات الوصول والعمليات لجميع شاشات {MODULE_NAMES[moduleId] || moduleId}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-tertiary)]">
                            {allScreens.length} شاشة
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                    </div>
                </div>

                {/* التبويبات الرئيسية: صلاحيات الشاشات | صلاحيات العمليات | تسلسل الاعتمادات */}
                <Tabs
                    tabs={mainTabs}
                    activeTab={mainTab}
                    onChange={(tab) => {
                        setMainTab(tab);
                        setCategoryTab('all');
                    }}
                    variant="cards"
                />

                {/* ===== Tab 1: صلاحيات الشاشات ===== */}
                {mainTab === 'screen_access' && (
                    <>
                        {hasCategoryTabs && (
                            <Tabs
                                tabs={categoryTabsArray}
                                activeTab={categoryTab}
                                onChange={setCategoryTab}
                                variant="pills"
                            />
                        )}
                        <ScreenPermissionsTab
                            moduleId={moduleId}
                            screens={filteredScreens}
                        />
                    </>
                )}

                {/* ===== Tab 2: صلاحيات العمليات (المصفوفة الموجودة) ===== */}
                {mainTab === 'operations' && (
                    <>
                        {hasCategoryTabs && (
                            <Tabs
                                tabs={categoryTabsArray}
                                activeTab={categoryTab}
                                onChange={setCategoryTab}
                                variant="pills"
                            />
                        )}
                        <ModulePermissionsTab
                            moduleId={moduleId}
                            screens={filteredScreens}
                        />
                    </>
                )}

                {/* ===== Tab 3: تسلسل الاعتمادات ===== */}
                {mainTab === 'approvals' && (
                    <ApprovalWorkflowTab moduleId={moduleId} />
                )}
            </div>
        </PermissionGuard>
    );
}
