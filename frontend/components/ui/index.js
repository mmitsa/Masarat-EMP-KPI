// ============================================
// UI Components - المنصة الموحدة
// Government Design System Components
// تاريخ التحديث: 2026-02-03
// ============================================

// ========== Core Components ==========
export { default as Button, IconButton, ButtonGroup } from './Button';
export { default as Badge } from './Badge';
export { default as ContentCard } from './ContentCard';
export { default as StatCard, StatCardGrid, MiniStatCard } from './StatCard';
export { default as DataTable } from './DataTable';
export { default as Modal, ConfirmModal } from './Modal';
export { default as Input, Textarea } from './Input';
export { default as Select } from './Select';
export { default as SearchInput } from './SearchInput';
export { default as Tabs, TabPanel } from './Tabs';
export { default as EmptyState } from './EmptyState';
export { default as LoadingSpinner, PageLoading, InlineLoading, Skeleton } from './LoadingSpinner';
export { default as ValidationPanel } from './ValidationPanel';
export { default as FileAttachment } from './FileAttachment';

// ========== New Government Components ==========
export { default as PageHeader } from './PageHeader';
export { default as StatusBadge, StatusDot, STATUS_LIST, STATUS_COLORS } from './StatusBadge';

// ========== Theme Components ==========
export { default as ThemeToggle, ThemeIndicator, DarkModeToggle } from './ThemeToggle';
export {
    default as ThemeSwitcher,
    ThemeSwitcherDropdown,
    ThemeToggleButton,
    DarkModeToggleButton,
    ThemeSwitcherCompact,
    ThemeSwitcherCard
} from './ThemeSwitcher';
export {
    ThemedButton,
    ThemedCard,
    ThemedBadge,
    ThemedInput,
    ThemedAlert,
    ThemedProgress,
    ThemedDivider
} from './ThemedComponents';

// ========== Color Palette Components ==========
export {
    default as ColorPaletteDropdown,
    ColorPaletteCard,
    ColorButton
} from './ColorPalette';

// ========== API Status Components ==========
export {
    ServiceStatusIndicator,
    ApiStatusBar,
    AllServicesStatus,
    DataSourceBadge
} from './ApiStatusIndicator';

// ========== Connection Status Components ==========
export {
    default as ConnectionStatusBar,
    ConnectionIndicator,
    ConnectionStatusPanel,
    ServicesStatusGrid
} from './ConnectionStatus';
