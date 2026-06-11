import React, { memo } from 'react';

const ChartCard = memo(function ChartCard({
    title,
    subtitle,
    icon,
    height,
    actions,
    children,
    className = '',
    darkMode = false,
}) {
    return (
        <div
            className={`
                ${darkMode ? 'bg-neutral-900 border-neutral-700' : 'bg-white dark:bg-gray-900 border-neutral-200'}
                border rounded-xl shadow-sm dark:shadow-gray-900/20 overflow-hidden
                ${className}
            `}
        >
            {/* Header */}
            {(title || actions) && (
                <div className={`
                    px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between
                    border-b ${darkMode ? 'border-neutral-700' : 'border-neutral-100'}
                `}>
                    <div className="flex items-center gap-2 min-w-0">
                        {icon && <span className="text-lg sm:text-xl flex-shrink-0">{icon}</span>}
                        <div className="min-w-0">
                            {title && (
                                <h3 className={`text-sm sm:text-base font-bold truncate ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className={`text-xs truncate ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
                </div>
            )}

            {/* Chart Content */}
            <div className="p-4 sm:p-5" style={height ? { minHeight: height } : undefined}>
                {children}
            </div>
        </div>
    );
});

ChartCard.displayName = 'ChartCard';

export default ChartCard;
