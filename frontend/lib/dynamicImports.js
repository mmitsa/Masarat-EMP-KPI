/**
 * Dynamic Imports Configuration
 * تكوين الاستيراد الديناميكي لتحسين الأداء
 *
 * يستخدم Next.js dynamic() لتحميل المكونات الثقيلة عند الحاجة فقط
 */

import dynamic from 'next/dynamic';

// ========== Loading Components ==========
const PageSkeleton = () => (
    <div className="animate-pulse p-6">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
            ))}
        </div>
        <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
    </div>
);

const TableSkeleton = ({ rows = 5 }) => (
    <div className="animate-pulse">
        <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-t-lg mb-1" />
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700" />
        ))}
    </div>
);

const ChartSkeleton = () => (
    <div className="animate-pulse h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
);

const CardSkeleton = () => (
    <div className="animate-pulse p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4" />
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
    </div>
);

// ========== Heavy Page Components ==========

/**
 * صفحة الرواتب - ملف كبير جداً (148K سطر)
 */
export const PayrollPage = dynamic(
    () => import('../pages/hr/payroll'),
    {
        loading: () => <PageSkeleton />,
        ssr: false,
    }
);

/**
 * صفحة الموظفين الموحدة - ملف كبير (120K سطر)
 */
export const EmployeesUnifiedPage = dynamic(
    () => import('../pages/hr/employees-unified'),
    {
        loading: () => <PageSkeleton />,
        ssr: false,
    }
);

/**
 * صفحة إدارة الأصناف - ملف كبير (121K سطر)
 */
export const ItemManagementPage = dynamic(
    () => import('../pages/warehouse/item-management'),
    {
        loading: () => <PageSkeleton />,
        ssr: false,
    }
);

/**
 * صفحة الهيكل التنظيمي - ملف كبير (96K سطر)
 */
export const OrganizationPage = dynamic(
    () => import('../pages/hr/organization'),
    {
        loading: () => <PageSkeleton />,
        ssr: false,
    }
);

// ========== Heavy UI Components ==========

/**
 * DataTable الثقيلة مع كل الميزات
 */
export const HeavyDataTable = dynamic(
    () => import('../components/ui/DataTable'),
    {
        loading: () => <TableSkeleton rows={10} />,
    }
);

/**
 * المخططات البيانية
 */
export const ChartComponent = dynamic(
    () => import('../components/charts/ChartComponent').catch(() => ({
        default: () => <ChartSkeleton />
    })),
    {
        loading: () => <ChartSkeleton />,
        ssr: false,
    }
);

// ========== Modal Components ==========

/**
 * موديول الموظفين
 */
export const EmployeeModal = dynamic(
    () => import('../components/hr/EmployeeModal').catch(() => ({
        default: () => null
    })),
    { ssr: false }
);

/**
 * موديول الأصناف
 */
export const ItemModal = dynamic(
    () => import('../components/warehouse/ItemModal').catch(() => ({
        default: () => null
    })),
    { ssr: false }
);

// ========== Dashboard Widgets ==========

/**
 * Calendar Widget
 */
export const CalendarWidget = dynamic(
    () => import('../components/dashboard/widgets/CalendarWidget'),
    {
        loading: () => <CardSkeleton />,
    }
);

/**
 * Weather Widget
 */
export const WeatherWidget = dynamic(
    () => import('../components/dashboard/widgets/WeatherWidget'),
    {
        loading: () => <CardSkeleton />,
    }
);

/**
 * Projects Widget
 */
export const ProjectsWidget = dynamic(
    () => import('../components/dashboard/widgets/ProjectsWidget'),
    {
        loading: () => <CardSkeleton />,
    }
);

// ========== AI Components ==========

/**
 * AI Chat Assistant
 */
export const AIChatAssistant = dynamic(
    () => import('../components/layout/AIChatAssistant'),
    { ssr: false }
);

// ========== Report Components ==========

/**
 * PDF Viewer
 */
export const PDFViewer = dynamic(
    () => import('../components/reports/PDFViewer').catch(() => ({
        default: () => <div>PDF Viewer not available</div>
    })),
    {
        loading: () => <div className="h-96 animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl" />,
        ssr: false,
    }
);

/**
 * Excel Export
 */
export const ExcelExport = dynamic(
    () => import('../components/reports/ExcelExport').catch(() => ({
        default: () => null
    })),
    { ssr: false }
);

// ========== Print Components ==========

/**
 * Print Preview
 */
export const PrintPreview = dynamic(
    () => import('../components/print/PrintPreview').catch(() => ({
        default: () => null
    })),
    { ssr: false }
);

// ========== Utility Functions ==========

/**
 * Preload a dynamic component
 * @param {Function} component - Dynamic component to preload
 */
export const preloadComponent = (component) => {
    if (component.preload) {
        component.preload();
    }
};

/**
 * Preload multiple components
 * @param {Function[]} components - Array of dynamic components
 */
export const preloadComponents = (components) => {
    components.forEach(preloadComponent);
};

// ========== Export Loading Components ==========
export { PageSkeleton, TableSkeleton, ChartSkeleton, CardSkeleton };

export default {
    PayrollPage,
    EmployeesUnifiedPage,
    ItemManagementPage,
    OrganizationPage,
    HeavyDataTable,
    ChartComponent,
    EmployeeModal,
    ItemModal,
    CalendarWidget,
    WeatherWidget,
    ProjectsWidget,
    AIChatAssistant,
    PDFViewer,
    ExcelExport,
    PrintPreview,
};
