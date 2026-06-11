/**
 * ================================================================
 * Stock Level Indicator Component
 * ================================================================
 *
 * @component StockLevelIndicator
 * @description مؤشر مستوى المخزون (عادي، منخفض، حرج، زائد)
 * @version 1.0.0
 * @date 2026-02-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Badge } from '../ui';

/**
 * حساب حالة المخزون
 */
function getStockStatus(current, minimum, maximum) {
    if (current === 0) {
        return { status: 'out-of-stock', label: 'نفذ', color: 'red', icon: '❌' };
    }

    if (current <= minimum) {
        return { status: 'critical', label: 'حرج', color: 'red', icon: '⚠️' };
    }

    if (current <= minimum * 1.2) {
        return { status: 'low', label: 'منخفض', color: 'yellow', icon: '⚡' };
    }

    if (maximum && current >= maximum) {
        return { status: 'excess', label: 'زائد', color: 'blue', icon: '↑' };
    }

    return { status: 'normal', label: 'عادي', color: 'green', icon: '✓' };
}

/**
 * StockLevelIndicator Component
 */
export default function StockLevelIndicator({
    current,
    minimum,
    maximum,
    showValue = true,
    showLabel = true,
    showIcon = true,
    className = ''
}) {
    const { status, label, color, icon } = getStockStatus(current, minimum, maximum);

    // نسبة المخزون
    const percentage = maximum ? Math.round((current / maximum) * 100) : null;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Badge with status */}
            <Badge variant={color} className="flex items-center gap-1.5">
                {showIcon && <span>{icon}</span>}
                {showValue && <span className="font-mono font-bold">{current.toLocaleString('ar-SA')}</span>}
                {showLabel && <span className="text-xs">({label})</span>}
            </Badge>

            {/* Progress bar (optional) */}
            {maximum && percentage !== null && (
                <div className="flex-1 min-w-[60px] max-w-[100px]">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                status === 'critical' || status === 'out-of-stock' ? 'bg-red-500' :
                                status === 'low' ? 'bg-yellow-500' :
                                status === 'excess' ? 'bg-blue-500' :
                                'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block text-center">
                        {percentage}%
                    </span>
                </div>
            )}
        </div>
    );
}

StockLevelIndicator.propTypes = {
    current: PropTypes.number.isRequired,
    minimum: PropTypes.number.isRequired,
    maximum: PropTypes.number,
    showValue: PropTypes.bool,
    showLabel: PropTypes.bool,
    showIcon: PropTypes.bool,
    className: PropTypes.string,
};
