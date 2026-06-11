import React, { memo, useId, useCallback, Children } from 'react';
import PropTypes from 'prop-types';

const variantStyles = {
    default: {
        container: 'border-b border-[var(--border-medium)]',
        tab: 'px-[var(--spacing-4)] py-[var(--spacing-3)] -mb-px border-b-2 transition-colors',
        active: 'border-[var(--color-primary-500)] text-[var(--color-primary-500)] font-semibold',
        inactive: 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-dark)]',
    },
    pills: {
        container: 'bg-[var(--bg-tertiary)] p-1 rounded-[var(--radius-xl)]',
        tab: 'px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-lg)] transition-all',
        active: 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm dark:shadow-gray-900/20 font-medium',
        inactive: 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
    },
    cards: {
        container: 'flex gap-2',
        tab: 'px-[var(--spacing-6)] py-[var(--spacing-3)] rounded-[var(--radius-xl)] transition-all border',
        active: 'bg-[var(--color-primary-500)] text-[var(--text-inverse)] border-[var(--color-primary-500)] font-medium',
        inactive: 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-light)] hover:border-[var(--color-primary-200)] hover:text-[var(--color-primary-500)]',
    },
};

/**
 * Tabs Component - التبويبات
 * يدعم عدة أنماط مع Accessibility كاملة
 */
const Tabs = memo(function Tabs({
    tabs = [],
    activeTab,
    onChange,
    variant = 'default',
    className = '',
    'aria-label': ariaLabel = 'التبويبات',
    // دعم الطريقة القديمة
    value,
    children,
}) {
    const tabsId = useId();
    const style = variantStyles[variant];

    // دعم كلا الطريقتين: tabs array أو children
    let safeTabs = [];
    const effectiveActiveTab = activeTab || value;

    if (Array.isArray(tabs) && tabs.length > 0) {
        safeTabs = tabs;
    } else if (children) {
        // استخراج التبويبات من children (TabPanel components)
        const childArray = React.Children.toArray(children);
        safeTabs = childArray
            .filter(child => child?.props?.value || child?.props?.id)
            .map(child => ({
                id: child.props.value || child.props.id,
                label: child.props.label || child.props.value || child.props.id,
                icon: child.props.icon,
                count: child.props.count,
            }));
    }

    const handleKeyDown = useCallback((e, tabId, index) => {
        const tabCount = safeTabs.length;
        let newIndex = index;

        switch (e.key) {
            case 'ArrowRight':
                // RTL: ArrowRight moves to previous
                newIndex = index === 0 ? tabCount - 1 : index - 1;
                break;
            case 'ArrowLeft':
                // RTL: ArrowLeft moves to next
                newIndex = index === tabCount - 1 ? 0 : index + 1;
                break;
            case 'Home':
                newIndex = 0;
                break;
            case 'End':
                newIndex = tabCount - 1;
                break;
            default:
                return;
        }

        e.preventDefault();
        onChange(safeTabs[newIndex].id);
        // Focus the new tab
        document.getElementById(`${tabsId}-tab-${safeTabs[newIndex].id}`)?.focus();
    }, [safeTabs, onChange, tabsId]);

    // لا تعرض شيئاً إذا لم توجد تبويبات
    if (safeTabs.length === 0) {
        return null;
    }

    return (
        <div className={`${style.container} ${className}`}>
            <div
                className="flex"
                role="tablist"
                aria-label={ariaLabel}
            >
                {safeTabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        id={`${tabsId}-tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={effectiveActiveTab === tab.id}
                        aria-controls={`${tabsId}-panel-${tab.id}`}
                        tabIndex={effectiveActiveTab === tab.id ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
                        className={`
                            ${style.tab}
                            ${effectiveActiveTab === tab.id ? style.active : style.inactive}
                            flex items-center gap-2
                        `}
                    >
                        {tab.icon && <span className="w-5 h-5" aria-hidden="true">{tab.icon}</span>}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span
                                className={[
                                    'text-xs px-2 py-0.5 rounded-full',
                                    effectiveActiveTab === tab.id
                                        ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)]'
                                        : 'bg-[var(--color-gray-200)] text-[var(--color-gray-700)]'
                                ].join(' ')}
                                aria-label={`${tab.count} عنصر`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {/* عرض محتوى التبويب النشط عند استخدام children */}
            {children && (
                <div className="mt-4">
                    {Children.map(children, child => {
                        if (!child) return null;
                        const childValue = child.props?.value || child.props?.id;
                        if (childValue === effectiveActiveTab) {
                            // Clone element with isActive prop to ensure TabPanel renders
                            return React.cloneElement(child, { isActive: true });
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
});

Tabs.displayName = 'Tabs';

Tabs.propTypes = {
    /** قائمة التبويبات (الطريقة الجديدة) */
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.node,
        count: PropTypes.number,
    })),
    /** التبويب النشط (الطريقة الجديدة) */
    activeTab: PropTypes.string,
    /** التبويب النشط (الطريقة القديمة - value) */
    value: PropTypes.string,
    /** محتوى التبويبات (الطريقة القديمة - children) */
    children: PropTypes.node,
    /** دالة تغيير التبويب */
    onChange: PropTypes.func.isRequired,
    /** نمط التبويبات */
    variant: PropTypes.oneOf(['default', 'pills', 'cards']),
    /** Classes إضافية */
    className: PropTypes.string,
    /** وصف للـ accessibility */
    'aria-label': PropTypes.string,
};

export default Tabs;

/**
 * TabPanel Component - لوحة محتوى التبويب
 */
export const TabPanel = memo(function TabPanel({
    children,
    isActive,
    id,
    value,
    label,
    activeTab,
    tabsId,
    icon,
    count,
}) {
    // Support multiple usage patterns
    const panelId = id || value;
    const shouldShow = isActive !== undefined ? isActive : (id === activeTab);

    if (!shouldShow) return null;

    return (
        <div
            id={tabsId ? `${tabsId}-panel-${id}` : undefined}
            role="tabpanel"
            aria-labelledby={tabsId ? `${tabsId}-tab-${id}` : undefined}
            tabIndex={0}
            className="mt-6 animate-fadeIn"
        >
            {children}
        </div>
    );
});

TabPanel.displayName = 'TabPanel';

TabPanel.propTypes = {
    /** محتوى اللوحة */
    children: PropTypes.node,
    /** هل اللوحة نشطة (طريقة 1) */
    isActive: PropTypes.bool,
    /** معرف التبويب (طريقة 2) */
    id: PropTypes.string,
    /** التبويب النشط (طريقة 2) */
    activeTab: PropTypes.string,
    /** معرف مجموعة التبويبات للربط */
    tabsId: PropTypes.string,
};
