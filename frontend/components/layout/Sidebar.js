/**
 * Sidebar Component - الشريط الجانبي المحسّن
 * تصميم أنيق بخلفية بيضاء وألوان حكومية
 *
 * @version 3.0.0
 * @date 2026-02-03
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useNavigationStore } from '../../hooks/useNavigationLoading';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { NAVIGATION } from '../../lib/routes';
import { useTheme } from '../../context/ThemeContext';
import { useColors } from '../../context/ColorContext';
import {
    getHRSidebarItems,
    getNavigationForRoles,
} from '../../lib/rbac';

// Navigation structure with sub-items
const navigationConfig = [
    {
        id: 'dashboard',
        label: 'لوحة التحكم',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        path: NAVIGATION.DASHBOARD,
        permission: null,
    },
    {
        id: 'my-portal',
        label: 'بوابتي',
        icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        path: NAVIGATION.MY_PORTAL,
        permission: null,
    },
    {
        id: 'my-department',
        label: 'إدارتي',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        path: '/hr/my-department',
        permission: null,
    },
    {
        id: 'executive-dashboard',
        label: 'لوحة صاحب الصلاحية',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        path: NAVIGATION.EXECUTIVE_DASHBOARD,
        permission: 'admin:executive',
    },
    {
        id: 'hr',
        label: 'الموارد البشرية',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        path: NAVIGATION.HR_HOME,
        permission: 'hr:read',
        isDynamic: true, // هذا العنصر له عناصر فرعية ديناميكية
        subItems: [
            { id: 'hr-dashboard', label: 'لوحة المعلومات', path: '/hr', permission: 'hr:read' },
            { id: 'hr-authority-dashboard', label: 'لوحة صاحب الصلاحية', path: '/hr/authority-dashboard', permission: 'hr:read' },
            { id: 'hr-my-department', label: 'إدارتي', path: '/hr/my-department', permission: 'hr:read', icon: '🏢' },
            { id: 'hr-organization', label: 'الهيكل الإداري', path: '/hr/organization', permission: 'hr:read' },
            { id: 'hr-employees', label: 'إدارة الموظفين', path: '/hr/employee-management', permission: 'hr:read' },
            { id: 'hr-departments', label: 'هيكلة الجهة', path: '/hr/departments', permission: 'hr:read' },
            { id: 'hr-leaves', label: 'الإجازات والقرارات', path: '/hr/leaves', permission: 'hr:read' },
            { id: 'hr-assignments', label: 'الانتدابات وخارج الدوام', path: '/hr/assignments', permission: 'hr:read' },
            { id: 'hr-wallet', label: 'محفظة التعزيزات', path: '/hr/wallet', permission: 'hr:read' },
            { id: 'hr-attendance', label: 'الحضور والانصراف', path: '/hr/attendance', permission: 'hr:read' },
            { id: 'hr-attendance-monitor', label: 'مراقب الدوام', path: '/hr/attendance-monitor', permission: 'hr:read' },
            { id: 'hr-biometric', label: 'أجهزة البصمة', path: '/hr/biometric-settings', permission: 'hr:read' },
            { id: 'hr-work-locations', label: 'مواقع العمل', path: '/hr/work-locations', permission: 'hr:read' },
            { id: 'hr-salaries', label: 'الرواتب والمسير', path: '/hr/payroll', permission: 'hr:read' },
            { id: 'hr-salary-scales', label: 'سلم الرواتب والكوادر', path: '/hr/salary-scales', permission: 'hr:read' },
            { id: 'hr-deduction-decisions', label: 'قرارات الخصم', path: '/hr/deduction-decisions', permission: 'hr:read' },
            { id: 'hr-loans', label: 'السلف والقروض', path: '/hr/loans', permission: 'hr:read' },
            { id: 'hr-official-holidays', label: 'العطلات الرسمية', path: '/hr/official-holidays', permission: 'hr:read' },
            { id: 'hr-promotions', label: 'الترقيات', path: '/hr/promotions', permission: 'hr:read' },
            { id: 'hr-compliance', label: 'الالتزام', path: '/hr/compliance', permission: 'hr:read' },
            { id: 'hr-data-import', label: 'استيراد البيانات', path: '/hr/data-import', permission: 'hr:read' },
            { id: 'hr-reports', label: 'التقارير', path: '/hr/reports', permission: 'hr:read' },
            { id: 'hr-permissions', label: 'الصلاحيات', path: '/hr/permissions', permission: 'hr:read' },
        ]
    },
    {
        id: 'epm',
        label: 'قياس الأداء',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        path: NAVIGATION.EPM_HOME,
        permission: 'hr:read',
        subItems: [
            { id: 'epm-dashboard', label: 'لوحة المعلومات', path: '/epm', permission: 'hr:read' },
            { id: 'epm-evaluations', label: 'التقييمات', path: '/epm/evaluations', permission: 'hr:read' },
            { id: 'epm-kpis', label: 'مؤشرات الأداء', path: '/epm/kpis', permission: 'hr:read' },
            { id: 'epm-permissions', label: 'الصلاحيات', path: '/epm/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'warehouse',
        label: 'المستودعات',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        path: NAVIGATION.WAREHOUSE_HOME,
        permission: 'warehouse:read',
        subItems: [
            { id: 'warehouse-dashboard', label: 'لوحة المعلومات', path: '/warehouse', permission: 'warehouse:read' },
            { id: 'warehouse-division', label: 'تقسيم المستودعات', path: '/warehouse/division', permission: 'warehouse:manage' },
            { id: 'warehouse-items', label: 'الأصناف', path: '/warehouse/items', permission: 'warehouse:read' },
            { id: 'warehouse-item-card', label: 'كارت الصنف', path: '/warehouse/item-card', permission: 'warehouse:read' },
            { id: 'warehouse-exchange-request', label: 'طلبات الصرف', path: '/warehouse/exchange-request', permission: 'warehouse:read' },
            // ========== قسم الاستلام ==========
            { id: 'warehouse-temp-receive', label: 'الاستلام المؤقت للفحص', path: '/warehouse/temp-receive', permission: 'warehouse:write' },
            { id: 'warehouse-receipt-note', label: 'مذكرات الاستلام', path: '/warehouse/receipt-note', permission: 'warehouse:write' },
            { id: 'warehouse-receiving', label: 'محاضر الاستلام', path: '/warehouse/receiving', permission: 'warehouse:write' },
            // ========== باقي الأقسام ==========
            { id: 'warehouse-approvals', label: 'الاعتمادات', path: '/warehouse/approvals', permission: 'warehouse:read' },
            { id: 'warehouse-approval-settings', label: 'إعدادات التسلسل', path: '/warehouse/approval-settings', permission: 'warehouse:manage' },
            { id: 'warehouse-fixed-assets', label: 'الأصول الثابتة', path: '/warehouse/fixed-assets', permission: 'warehouse:read' },
            { id: 'warehouse-depreciation', label: 'الإهلاك', path: '/warehouse/depreciation', permission: 'warehouse:read' },
            { id: 'warehouse-suppliers', label: 'الموردين', path: '/warehouse/suppliers', permission: 'warehouse:read' },
            { id: 'warehouse-custody', label: 'العهد', path: '/warehouse/custody', permission: 'warehouse:read' },
            { id: 'warehouse-employee-custody', label: 'عهد الموظفين', path: '/warehouse/employee-custody', permission: 'warehouse:read' },
            { id: 'warehouse-stocktaking', label: 'الجرد', path: '/warehouse/stocktaking', permission: 'warehouse:write' },
            { id: 'warehouse-transfer-requests', label: 'طلبات النقل', path: '/warehouse/transfer-requests', permission: 'warehouse:write' },
            { id: 'warehouse-return-requests', label: 'طلبات المرتجعات', path: '/warehouse/return-requests', permission: 'warehouse:write' },
            { id: 'warehouse-reports', label: 'التقارير', path: '/warehouse/reports', permission: 'warehouse:read' },
            { id: 'warehouse-permissions', label: 'الصلاحيات', path: '/warehouse/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'movement',
        label: 'إدارة الحركة',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        path: NAVIGATION.MOVEMENT_HOME,
        permission: 'movement:read',
        subItems: [
            { id: 'movement-dashboard', label: 'لوحة المعلومات', path: '/movement', permission: 'movement:read' },
            { id: 'movement-vehicles', label: 'المركبات', path: '/movement/vehicles', permission: 'movement:read' },
            { id: 'movement-drivers', label: 'السائقين', path: '/movement/drivers', permission: 'movement:read' },
            { id: 'movement-trips', label: 'الرحلات', path: '/movement/trips', permission: 'movement:read' },
            { id: 'movement-maintenance', label: 'الصيانة', path: '/movement/maintenance', permission: 'movement:read' },
            { id: 'movement-fuel', label: 'الوقود', path: '/movement/fuel', permission: 'movement:read' },
            { id: 'movement-permissions', label: 'الصلاحيات', path: '/movement/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'archiving',
        label: 'الأرشفة',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        path: '/archiving',
        permission: 'archiving:read',
        subItems: [
            { id: 'archiving-dashboard', label: 'لوحة المعلومات', path: '/archiving', permission: 'archiving:read' },
            { id: 'archiving-documents', label: 'المستندات', path: '/archiving/documents', permission: 'archiving:read' },
            { id: 'archiving-transactions-new', label: 'معاملة جديدة', path: '/archiving/transactions/new', permission: 'archiving:write' },
            { id: 'archiving-cabinets', label: 'الخزائن', path: '/archiving/cabinets', permission: 'archiving:read' },
            { id: 'archiving-classifications', label: 'التصنيفات', path: '/archiving/classifications', permission: 'archiving:read' },
            { id: 'archiving-workflows', label: 'سير العمل', path: '/archiving/workflows', permission: 'archiving:read' },
            { id: 'archiving-access-requests', label: 'طلبات الوصول', path: '/archiving/access-requests', permission: 'archiving:write' },
            { id: 'archiving-access-approvals', label: 'اعتماد الطلبات', path: '/archiving/access-approvals', permission: 'archiving:admin' },
            { id: 'archiving-security-audit', label: 'تدقيق الأمان', path: '/archiving/security-audit', permission: 'archiving:admin' },
            { id: 'archiving-permissions', label: 'الصلاحيات', path: '/archiving/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'finance',
        label: 'الإدارة المالية',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        path: NAVIGATION.FINANCE_HOME,
        permission: 'finance:read',
        subItems: [
            { id: 'finance-dashboard', label: 'لوحة المعلومات', path: '/finance', permission: 'finance:read' },
            { id: 'finance-vendors', label: 'الموردين', path: '/finance/vendors', permission: 'finance:read' },
            { id: 'finance-ap', label: 'الحسابات الدائنة', path: '/finance/ap', permission: 'finance:read' },
            { id: 'finance-ap-approvals', label: 'موافقات الفواتير', path: '/finance/ap/approvals', permission: 'finance:write' },
            { id: 'finance-ap-matching', label: 'المطابقة الثلاثية', path: '/finance/ap/matching', permission: 'finance:read' },
            { id: 'finance-procurement', label: 'المشتريات', path: '/finance/procurement', permission: 'finance:read' },
            { id: 'finance-po', label: 'أوامر الشراء', path: '/finance/procurement/purchase-orders', permission: 'finance:read' },
            { id: 'finance-pr', label: 'طلبات الشراء', path: '/finance/procurement/requests', permission: 'finance:write' },
            { id: 'finance-gl', label: 'دفتر الأستاذ', path: '/finance/gl', permission: 'finance:read' },
            { id: 'finance-budget', label: 'الميزانية', path: '/finance/budget', permission: 'finance:read' },
            { id: 'finance-wallet', label: 'محفظة التعزيزات', path: '/finance/wallet', permission: 'finance:read' },
            { id: 'finance-treasury', label: 'الخزينة', path: '/finance/treasury', permission: 'finance:read' },
            { id: 'finance-reports', label: 'التقارير', path: '/finance/reports', permission: 'finance:read' },
            { id: 'finance-permissions', label: 'الصلاحيات', path: '/finance/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'projects',
        label: 'المشاريع',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        path: '/projects',
        permission: 'projects:read',
        subItems: [
            { id: 'projects-dashboard', label: 'لوحة المعلومات', path: '/projects', permission: 'projects:read' },
            { id: 'projects-list', label: 'قائمة المشاريع', path: '/projects/list', permission: 'projects:read' },
            { id: 'projects-create', label: 'مشروع جديد', path: '/projects/create', permission: 'projects:write' },
            { id: 'projects-overdue', label: 'المهام المتأخرة', path: '/projects/overdue-tasks', permission: 'projects:read' },
            { id: 'projects-permissions', label: 'الصلاحيات', path: '/projects/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'sadad',
        label: 'سداد',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
        path: NAVIGATION.SADAD_HOME,
        permission: 'sadad:read',
        subItems: [
            { id: 'sadad-dashboard', label: 'لوحة المعلومات', path: '/sadad', permission: 'sadad:read' },
            { id: 'sadad-permissions', label: 'الصلاحيات', path: '/sadad/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'itsm',
        label: 'الدعم الفني',
        icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
        path: '/itsm',
        permission: 'itsm:read',
        subItems: [
            { id: 'itsm-dashboard', label: 'لوحة المعلومات', path: '/itsm', permission: 'itsm:read' },
            { id: 'itsm-tickets', label: 'التذاكر', path: '/itsm/tickets', permission: 'itsm:read' },
            { id: 'itsm-assets', label: 'الأصول التقنية', path: '/itsm/assets', permission: 'itsm:read' },
            { id: 'itsm-specialists', label: 'المتخصصين', path: '/itsm/specialists', permission: 'itsm:admin' },
            { id: 'itsm-categories', label: 'التصنيفات', path: '/itsm/categories', permission: 'itsm:admin' },
            { id: 'itsm-reports', label: 'التقارير', path: '/itsm/reports', permission: 'itsm:read' },
            { id: 'itsm-permissions', label: 'الصلاحيات', path: '/itsm/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'grc',
        label: 'الحوكمة والمخاطر',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        path: '/grc',
        permission: 'grc:read',
        subItems: [
            { id: 'grc-dashboard', label: 'لوحة المعلومات', path: '/grc', permission: 'grc:read' },
            { id: 'grc-risks', label: 'إدارة المخاطر', path: '/grc/risks', permission: 'grc:read' },
            { id: 'grc-incidents', label: 'الحوادث', path: '/grc/incidents', permission: 'grc:read' },
            { id: 'grc-permissions', label: 'الصلاحيات', path: '/grc/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'declarations',
        label: 'الإقرارات',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        path: '/declarations',
        permission: 'declarations:admin',
        subItems: [
            { id: 'declarations-dashboard', label: 'لوحة الامتثال', path: '/declarations', permission: 'declarations:admin' },
            { id: 'declarations-reports', label: 'تقارير الامتثال', path: '/declarations/reports', permission: 'declarations:admin' },
        ]
    },
    {
        id: 'analytics',
        label: 'التحليلات',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        path: '/analytics',
        permission: 'analytics:read',
        subItems: [
            { id: 'analytics-dashboard', label: 'لوحة المعلومات', path: '/analytics', permission: 'analytics:read' },
            { id: 'analytics-hr', label: 'الموارد البشرية', path: '/analytics/hr-analytics', permission: 'analytics:read' },
            { id: 'analytics-warehouse', label: 'المستودعات', path: '/analytics/warehouse-analytics', permission: 'analytics:read' },
            { id: 'analytics-financial', label: 'المالية', path: '/analytics/financial-analytics', permission: 'analytics:read' },
            { id: 'analytics-fleet', label: 'الأسطول', path: '/analytics/fleet-analytics', permission: 'analytics:read' },
            { id: 'analytics-kpis', label: 'مؤشرات الأداء', path: '/analytics/kpis', permission: 'analytics:read' },
            { id: 'analytics-audit', label: 'التدقيق الأمني', path: '/analytics/audit', permission: 'analytics:read' },
            { id: 'analytics-compliance', label: 'الامتثال', path: '/analytics/compliance', permission: 'analytics:read' },
            { id: 'analytics-reports', label: 'التقارير', path: '/analytics/reports', permission: 'analytics:read' },
            { id: 'analytics-permissions', label: 'الصلاحيات', path: '/analytics/permissions', permission: 'it_permissions:manage' },
        ]
    },
    {
        id: 'approvals',
        label: 'الموافقات',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        path: '/approvals',
        permission: null,
        subItems: [
            { id: 'approvals-pending', label: 'طلبات بانتظار الموافقة', path: '/approvals', permission: null },
            { id: 'approvals-workflows', label: 'متابعة طلباتي', path: '/workflows', permission: null },
            { id: 'approvals-disbursement', label: 'طلب صرف جديد', path: '/disbursement-new', permission: 'finance:write' },
            { id: 'approvals-delegations', label: 'التفويضات', path: '/delegations', permission: 'hr:admin' },
        ]
    },
    {
        id: 'agents',
        label: 'المساعد الذكي',
        icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5',
        path: '/agents',
        permission: 'agents:read',
        subItems: [
            { id: 'agents-dashboard', label: 'لوحة الوكلاء', path: '/agents', permission: 'agents:read' },
            { id: 'agents-tasks', label: 'المهام', path: '/agents/tasks', permission: 'agents:read' },
            { id: 'agents-workflows', label: 'سير العمل', path: '/agents/workflows', permission: 'agents:read' },
            { id: 'agents-logs', label: 'السجلات', path: '/agents/logs', permission: 'agents:read' },
        ]
    },
    {
        id: 'notifications',
        label: 'الإشعارات',
        icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        path: '/notifications',
        permission: null,
        subItems: [
            { id: 'notifications-all', label: 'جميع الإشعارات', path: '/notifications', permission: null },
            { id: 'notifications-settings', label: 'إعدادات الإشعارات', path: '/notifications/settings', permission: null },
        ]
    },
    {
        id: 'trash',
        label: 'سلة المهملات',
        icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
        path: '/trash',
        permission: null,
    },
    {
        id: 'settings',
        label: 'الإعدادات',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        path: '/admin',
        permission: 'settings:read',
        subItems: [
            { id: 'admin-dashboard', label: 'لوحة التحكم', path: '/admin', permission: 'settings:read' },
            { id: 'admin-announcements', label: 'التعميمات', path: '/admin/announcements', permission: 'settings:read' },
            { id: 'admin-news-ticker', label: 'الشريط الإخباري', path: '/admin/news-ticker', permission: 'settings:read' },
            { id: 'admin-users', label: 'المستخدمون', path: '/admin/users', permission: 'settings:read' },
            { id: 'platform-admin-portal', label: 'بوابة إدارة المنصة', path: '/platform-admin', permission: 'saas:admin' },
            { id: 'admin-organization', label: 'إعدادات الجهة', path: '/admin/organization', permission: 'settings:read' },
            { id: 'admin-feature-flags', label: 'ميزات النظام', path: '/admin/feature-flags', permission: 'settings:read' },
            { id: 'admin-otp-settings', label: 'رمز التحقق OTP', path: '/admin/otp-settings', permission: 'settings:read' },
            { id: 'admin-logs', label: 'السجلات', path: '/admin/logs', permission: 'settings:read' },
            { id: 'admin-nafath', label: 'نفاذ (التحقق الوطني)', path: '/nafath', permission: 'settings:read' },
        ],
    },
];

const isSuperAdmin = (roles) => {
    if (!roles || !Array.isArray(roles)) return false;
    return roles.includes('super_admin');
};

const standaloneEpmNavigation = [
    {
        id: 'epm-dashboard',
        label: 'لوحة الأداء',
        icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
        path: '/epm',
        permission: null,
    },
    {
        id: 'epm-evaluations',
        label: 'التقييمات',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z',
        path: '/epm/evaluations',
        permission: null,
    },
    {
        id: 'epm-goals',
        label: 'الأهداف',
        icon: 'M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z',
        path: '/epm/goals',
        permission: null,
    },
    {
        id: 'epm-kpis',
        label: 'مؤشرات الأداء',
        icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
        path: '/epm/kpis',
        permission: null,
    },
    {
        id: 'epm-question-bank',
        label: 'بنك الأسئلة',
        icon: 'M8.228 9c.549-1.165 1.73-2 3.272-2 1.933 0 3.5 1.12 3.5 2.5 0 1.035-.67 1.918-1.607 2.29-.842.335-1.393.884-1.393 1.71V14m0 4h.01M12 22a10 10 0 110-20 10 10 0 010 20z',
        path: '/epm/question-bank',
        permission: null,
    },
    {
        id: 'epm-tasks',
        label: 'المهام والمتابعة',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 12l2 2 4-4',
        path: '/epm/tasks',
        permission: null,
    },
    {
        id: 'epm-governance',
        label: 'الحوكمة والقرارات',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        path: '/epm/governance',
        permission: null,
    },
    {
        id: 'epm-permissions',
        label: 'الصلاحيات',
        icon: 'M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z M6 21v-2a6 6 0 1112 0v2 M17 11l2 2 4-4',
        path: '/epm/permissions',
        permission: null,
    },
];

// ========== Styled Components ==========

const NavItem = ({ item, isActive, isExpanded, collapsed, darkMode, isGovernmentTheme, onToggle, primaryColor, hoverColor, children }) => {
    const router = useRouter();
    const hasSubItems = item.subItems && item.subItems.length > 0;

    // استخدام الألوان المُمرّرة من الـ parent (من ColorContext)
    const activeColor = primaryColor || (isGovernmentTheme ? '#165C2D' : '#1d4ed8');
    const hoverBgColor = hoverColor || activeColor;

    const baseClasses = `
        w-full flex items-center gap-4 px-4 py-3.5 rounded-xl
        transition-all duration-200 group relative
        ${collapsed ? 'justify-center px-3' : ''}
    `;

    const activeClasses = darkMode
        ? `bg-opacity-20 text-white`
        : `text-white`;

    const inactiveClasses = darkMode
        ? `text-gray-400 hover:text-white`
        : `hover:text-white`;

    const isNavigable = Boolean(item?.path && item.path !== '#');

    // Handler for navigation
    const handleClick = (e) => {
        e.preventDefault();
        if (hasSubItems && !collapsed) {
            // Toggle sub-items only — don't navigate
            onToggle();
            return;
        }

        if (isNavigable) {
            router.push(item.path);
        }
    };

    // Handler for arrow/chevron click — toggle only
    const handleChevronClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    };

    const Component = 'button';
    const props = { onClick: handleClick, type: 'button' };

    return (
        <Component
            {...props}
            className={baseClasses}
            style={{
                backgroundColor: isActive
                    ? activeColor
                    : 'transparent',
                color: isActive
                    ? '#FFFFFF'
                    : darkMode ? '#9CA3AF' : activeColor,
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = hoverBgColor;
                    e.currentTarget.style.color = '#FFFFFF';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = darkMode ? '#9CA3AF' : activeColor;
                }
            }}
        >
            <div
                className={`
                    flex items-center justify-center rounded-lg flex-shrink-0
                    transition-all duration-200
                    ${collapsed ? 'w-10 h-10' : 'w-9 h-9'}
                `}
                style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                }}
            >
                <svg
                    className="w-5 h-5 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
            </div>

            {!collapsed && (
                <>
                    <span className="flex-1 font-semibold text-right text-[15px] leading-tight">
                        {item.label}
                    </span>

                    {hasSubItems && (
                        <span
                            onClick={handleChevronClick}
                            className="p-1 rounded-md hover:bg-white/10 cursor-pointer"
                        >
                            <svg
                                className="w-4 h-4"
                                style={{
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </span>
                    )}
                </>
            )}

            {/* Tooltip for collapsed mode */}
            {collapsed && (
                <div className="
                    absolute right-full mr-2 px-3 py-2 rounded-lg
                    bg-gray-900 text-white text-sm font-medium
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 whitespace-nowrap z-50
                    shadow-lg
                ">
                    {item.label}
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
            )}
        </Component>
    );
};

const SubNavItem = ({ item, isActive, darkMode, isGovernmentTheme, primaryColor: propPrimaryColor }) => {
    const router = useRouter();
    // استخدام اللون من props أو القيمة الافتراضية
    const primaryColor = propPrimaryColor || (isGovernmentTheme ? '#165C2D' : '#1d4ed8');
    // Guard against undefined path
    const safePath = item?.path;
    const isNavigable = Boolean(safePath && safePath !== '#');

    const handleClick = (e) => {
        e.preventDefault();
        if (isNavigable) {
            router.push(safePath);
        }
    };

    const SubComponent = 'button';
    const subProps = { onClick: handleClick, type: 'button' };

    return (
        <SubComponent
            {...subProps}
            className="
                flex items-center gap-3 px-4 py-3 rounded-lg
                text-[14px] transition-all duration-200 group
            "
            style={{
                backgroundColor: isActive ? `${primaryColor}15` : 'transparent',
                color: isActive ? primaryColor : darkMode ? '#9CA3AF' : '#6B7280',
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                    e.currentTarget.style.color = primaryColor;
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = darkMode ? '#9CA3AF' : '#6B7280';
                }
            }}
        >
            <svg
                className="w-4 h-4 flex-shrink-0 transition-all duration-200"
                style={{ 
                    color: isActive ? primaryColor : (darkMode ? '#6B7280' : '#9CA3AF'),
                    transform: isActive ? 'translateX(-2px)' : 'none'
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className={`flex-1 transition-all ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            {isActive && (
                <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                />
            )}
        </SubComponent>
    );
};

// ========== Animated Collapse Container ==========

const AnimatedSubItems = ({ isExpanded, children }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);
    const [isVisible, setIsVisible] = useState(isExpanded);

    useEffect(() => {
        if (isExpanded) {
            setIsVisible(true);
            // قياس الارتفاع الفعلي بعد الرندر
            requestAnimationFrame(() => {
                if (contentRef.current) {
                    setHeight(contentRef.current.scrollHeight);
                }
            });
        } else {
            // تصغير الارتفاع أولاً ثم إخفاء
            setHeight(0);
            const timer = setTimeout(() => setIsVisible(false), 250);
            return () => clearTimeout(timer);
        }
    }, [isExpanded]);

    // تحديث الارتفاع عند تغيير المحتوى
    useEffect(() => {
        if (isExpanded && contentRef.current) {
            const observer = new ResizeObserver(() => {
                if (contentRef.current && isExpanded) {
                    setHeight(contentRef.current.scrollHeight);
                }
            });
            observer.observe(contentRef.current);
            return () => observer.disconnect();
        }
    }, [isExpanded]);

    if (!isVisible && !isExpanded) return null;

    return (
        <div
            style={{
                height: isExpanded ? height : 0,
                overflow: 'hidden',
                transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isExpanded ? 1 : 0,
            }}
        >
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    );
};

// ========== Main Sidebar Component ==========

export default function Sidebar({
    collapsed = false,
    onToggle,
    darkMode: darkModeProp,
    onThemeToggle,
    user = null,
    onLogout
}) {
    const router = useRouter();
    const { data: session } = useSession();
    const { isDarkMode, isGovernmentTheme, toggleDarkMode } = useTheme();
    const { hoverColors } = useColors();

    const darkMode = isDarkMode ?? darkModeProp ?? false;
    const targetPath = useNavigationStore((s) => s.targetPath);
    const currentPath = targetPath || (router.pathname + (router.query.tab ? `?tab=${router.query.tab}` : ''));

    const navRef = useRef(null);

    const [expandedItems, setExpandedItems] = useState(() => {
        if (typeof window === 'undefined') return [];
        // استعادة الحالة المحفوظة من sessionStorage
        try {
            const saved = sessionStorage.getItem('sidebar-expanded');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        // fallback: استخراج من المسار الحالي
        const path = window.location.pathname;
        return standaloneEpmNavigation
            .filter(item => {
                if (!item.subItems?.length) return false;
                if (path === item.path || path.startsWith(item.path + '/')) return true;
                return item.subItems.some(sub => path === sub.path || path.startsWith(sub.path + '/'));
            })
            .map(item => item.id);
    });

    const userPermissions = session?.user?.permissions || [];
    const userRoles = session?.user?.roles || [];
    const isAdmin = isSuperAdmin(userRoles);

    const hasPermission = (permission) => {
        if (!permission) return true;
        if (isAdmin) return true;
        // مدير تقنية المعلومات - صلاحيات كاملة
        const isITDir = userRoles.includes('it_director');
        if (isITDir) return true;
        // التحقق من صلاحية الموديول عبر تكوين التنقل
        // إذا كان الموديول مضافاً في navConfig، يُمنح المستخدم صلاحية القراءة تلقائياً
        const permModule = permission.split(':')[0];
        if (navConfig && permModule) {
            if (navConfig.access === 'full') return true;
            if (navConfig.modules && navConfig.modules.includes(permModule)) return true;
        }
        return userPermissions.includes(permission) || userPermissions.includes(permModule + ':admin');
    };

    // الحصول على تكوين التنقل بناءً على أدوار المستخدم
    const navConfig = useMemo(() => {
        return getNavigationForRoles(userRoles);
    }, [userRoles]);

    // تحقق من صلاحية الوصول المحدود للموارد البشرية
    const hasDepartmentHRAccess = useMemo(() => {
        return navConfig.hrAccess === 'department';
    }, [navConfig]);

    // الحصول على عناصر HR المسموحة بناءً على الصلاحيات
    const hrSidebarItems = useMemo(() => {
        return getHRSidebarItems(userRoles);
    }, [userRoles]);

    const toggleExpanded = (itemId) => {
        if (collapsed) return;
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // حفظ حالة التبويبات المفتوحة في sessionStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('sidebar-expanded', JSON.stringify(expandedItems));
            } catch {}
        }
    }, [expandedItems]);

    // التمرير التلقائي للعنصر النشط في السايدبار
    useEffect(() => {
        if (!navRef.current || collapsed) return;
        const timer = setTimeout(() => {
            const activeEl = navRef.current?.querySelector('[data-nav-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [currentPath, collapsed]);

    // النظام مستقل: لا يتم تحميل أو عرض أي عناصر من المنصة الموحدة.
    const filteredNavigation = useMemo(() => {
        return standaloneEpmNavigation;
    }, []);

    useEffect(() => {
        const activeParents = filteredNavigation
            .filter(item => {
                if (!item.subItems?.length) return false;
                if (currentPath === item.path || currentPath.startsWith(item.path + '/')) return true;
                return item.subItems.some(sub => currentPath === sub.path || currentPath.startsWith(sub.path + '/'));
            })
            .map(item => item.id);

        if (activeParents.length > 0) {
            setExpandedItems(prev => {
                const newItems = activeParents.filter(id => !prev.includes(id));
                return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
        }
    }, [currentPath, filteredNavigation]);

    // الألوان - استخدام ألوان من ColorContext
    const primaryColor = hoverColors?.primary || (isGovernmentTheme ? '#165C2D' : '#1d4ed8');
    const hoverColor = hoverColors?.hover || primaryColor;
    const bgColor = darkMode ? '#0f1610' : '#FFFFFF';
    const borderColor = darkMode ? '#2d3d32' : 'rgba(22, 92, 45, 0.14)';

    return (
        <aside
            className={`
                epm-sidebar fixed top-0 right-0 h-screen z-40 flex flex-col
                ${collapsed ? 'w-20' : 'w-72'}
            `}
            style={{
                backgroundColor: bgColor,
                borderLeft: `1px solid ${borderColor}`,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                willChange: 'width',
            }}
        >
            {/* ========== Logo Section ========== */}
            <div
                className="h-16 flex items-center justify-between px-4"
                style={{ borderBottom: `1px solid ${borderColor}` }}
            >
                {!collapsed ? (
                    <Link href="/epm" className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                            style={{ backgroundColor: primaryColor }}
                        >
                            ق
                        </div>
                        <div>
                            <h1
                                className="font-bold text-lg"
                                style={{ color: primaryColor }}
                            >
                                قياس الأداء
                            </h1>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                منظومة حكومية مستقلة
                            </p>
                        </div>
                    </Link>
                ) : (
                    <Link href="/epm" className="mx-auto">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                            style={{ backgroundColor: primaryColor }}
                        >
                            ق
                        </div>
                    </Link>
                )}

                {!collapsed && (
                    <button
                        onClick={onToggle}
                        className={`
                            p-2 rounded-lg transition-all duration-200
                            ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}
                        `}
                        title="طيّ القائمة"
                        style={{ transition: 'transform 0.2s ease, background-color 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* ========== User Profile ========== */}
            {user && !collapsed && (
                <div className="p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-11 h-11 rounded-full object-cover"
                                    style={{ border: `2px solid ${primaryColor}30` }}
                                />
                            ) : (
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {user.name?.charAt(0) || 'م'}
                                </div>
                            )}
                            <span
                                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                                style={{
                                    backgroundColor: '#10B981',
                                    borderColor: bgColor
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="font-semibold text-sm truncate"
                                style={{ color: darkMode ? '#F9FAFB' : '#111827' }}
                            >
                                {user.name || 'مستخدم'}
                            </p>
                            <p
                                className="text-xs truncate"
                                style={{ color: darkMode ? '#6B7280' : '#9CA3AF' }}
                            >
                                {user.role || 'موظف'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== Collapsed User Avatar ========== */}
            {user && collapsed && (
                <div className="p-3 flex justify-center" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <div className="relative">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                                style={{ border: `2px solid ${primaryColor}30` }}
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {user.name?.charAt(0) || 'م'}
                            </div>
                        )}
                        <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                            style={{
                                backgroundColor: '#10B981',
                                borderColor: bgColor
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== Navigation ========== */}
            <nav ref={navRef} className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: ${darkMode ? '#1E293B' : '#F3F4F6'};
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: ${primaryColor};
                        border-radius: 10px;
                        opacity: 0.5;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: ${primaryColor};
                        opacity: 0.8;
                    }
                `}</style>
                {filteredNavigation.map((item) => {
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const filteredSubItems = hasSubItems
                        ? item.subItems.filter(subItem => hasPermission(subItem.permission))
                        : [];
                    const isActive = currentPath === item.path || (item.path !== '/epm' && currentPath.startsWith(item.path + '/'))
                        || filteredSubItems.some(sub => currentPath === sub.path || currentPath.startsWith(sub.path + '/'));
                    const isExpanded = expandedItems.includes(item.id);

                    return (
                        <div key={item.id}>
                            <NavItem
                                item={item}
                                isActive={isActive}
                                isExpanded={isExpanded}
                                collapsed={collapsed}
                                darkMode={darkMode}
                                isGovernmentTheme={isGovernmentTheme}
                                onToggle={() => toggleExpanded(item.id)}
                                primaryColor={primaryColor}
                                hoverColor={hoverColor}
                            />

                            {/* Sub Items with smooth animation */}
                            {hasSubItems && !collapsed && filteredSubItems.length > 0 && (
                                <AnimatedSubItems isExpanded={isExpanded}>
                                    <div
                                        className="mr-7 mt-1.5 mb-1 space-y-0.5 pr-4 py-1"
                                        style={{
                                            borderRight: `3px solid ${primaryColor}20`,
                                            background: `linear-gradient(to left, ${primaryColor}05, transparent)`
                                        }}
                                    >
                                        {filteredSubItems.map((subItem, idx) => {
                                            const isSubActive = currentPath === subItem.path || currentPath.startsWith(subItem.path + '/');
                                            return (
                                                <div
                                                    key={subItem.id}
                                                    data-nav-active={isSubActive ? "true" : undefined}
                                                    style={{
                                                        opacity: isExpanded ? 1 : 0,
                                                        transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                                                        transition: `opacity 0.2s ease ${idx * 0.03}s, transform 0.2s ease ${idx * 0.03}s`,
                                                    }}
                                                >
                                                    <SubNavItem
                                                        item={subItem}
                                                        isActive={isSubActive}
                                                        darkMode={darkMode}
                                                        isGovernmentTheme={isGovernmentTheme}
                                                        primaryColor={primaryColor}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AnimatedSubItems>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* ========== Bottom Section ========== */}
            <div className="p-3 space-y-1" style={{ borderTop: `1px solid ${borderColor}` }}>
                {/* Theme Toggle */}
                <button
                    onClick={toggleDarkMode || onThemeToggle}
                    className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200
                        ${collapsed ? 'justify-center px-3' : ''}
                    `}
                    style={{
                        color: darkMode ? '#9CA3AF' : '#6B7280',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = darkMode ? '#1F2937' : '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    {darkMode ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                    {!collapsed && (
                        <span className="font-medium text-sm">
                            {darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                        </span>
                    )}
                </button>

                {/* Expand Toggle (in collapsed mode) */}
                {collapsed && (
                    <button
                        onClick={onToggle}
                        title="توسيع القائمة"
                        className={`
                            w-full flex items-center justify-center p-3 rounded-xl
                            transition-all duration-200
                        `}
                        style={{
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            transition: 'background-color 0.2s ease, transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? '#1F2937' : '#F3F4F6';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200
                        ${collapsed ? 'justify-center px-3' : ''}
                    `}
                    style={{
                        color: '#EF4444',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEE2E2';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span className="font-medium text-sm">تسجيل الخروج</span>}
                </button>
            </div>
        </aside>
    );
}
