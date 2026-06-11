// ============================================
// Dashboard Components - المنصة الموحدة
// Government Dashboard Components
// تاريخ التحديث: 2026-02-03
// ============================================

// ========== Core Dashboard Components ==========
export { default as WelcomeSection } from './WelcomeSection';
export { default as QuickActionsBar } from './QuickActionsBar';
export { default as SystemStatusCard } from './SystemStatusCard';
export { default as ValidationSummaryWidget } from './ValidationSummaryWidget';

// ========== Widget System ==========
export { WidgetSelector, AddWidgetButton, WidgetContainer } from './WidgetSystem';

// ========== Dashboard Widgets ==========
export { default as DigitalClock } from './widgets/DigitalClock';
export { default as NewsTicker, NewsCard } from './widgets/NewsTicker';
export { default as AnnouncementsBoard } from './widgets/AnnouncementsBoard';
export { default as TasksWidget } from './widgets/TasksWidget';
export { default as CalendarWidget } from './widgets/CalendarWidget';
export { default as QuickStatsWidget } from './widgets/QuickStatsWidget';
export { default as WeatherWidget } from './widgets/WeatherWidget';

// ========== Projects Widgets ==========
export {
    default as ProjectsWidget,
    MyTasksProjectWidget,
    ProjectProgressWidget,
    ProjectDeadlinesWidget,
    ProjectQuickActionsWidget,
    ProjectStatsChartWidget,
    ProjectsSummaryLargeWidget
} from './widgets/ProjectsWidget';

// ========== Role-Based Dashboard ==========
export {
    getDashboardConfig,
    getAccessibleSystems,
    AttentionRequiredSection,
    QuickActionsGrid,
    EnhancedWelcomeHeader,
    EnhancedSystemCard
} from './RoleBasedDashboard';
