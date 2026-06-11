import React from 'react';
import { SYSTEM_DEFINITIONS } from '../../lib/rbac';

// Module pricing (monthly fees in SAR)
const MODULE_PRICING = {
    hr: { price: 500, description: 'إدارة الموظفين والحضور والرواتب' },
    warehouse: { price: 300, description: 'إدارة المخزون والعهد والصرف' },
    archiving: { price: 200, description: 'أرشفة الوثائق والمعاملات' },
    epm: { price: 250, description: 'تقييم الأداء والأهداف' },
    movement: { price: 400, description: 'إدارة المركبات والرحلات' },
    sadad: { price: 350, description: 'الفواتير والمدفوعات' },
    analytics: { price: 250, description: 'التقارير والتحليلات المتقدمة' },
    finance: { price: 600, description: 'الأستاذ العام والموازنة' },
    itsm: { price: 200, description: 'الدعم الفني والتذاكر' }
};

export default function TenantModuleToggle({
    moduleKey,
    isActive,
    onToggle,
    disabled = false,
    showPrice = true
}) {
    const module = SYSTEM_DEFINITIONS[moduleKey];
    const pricing = MODULE_PRICING[moduleKey];

    if (!module) return null;

    return (
        <div
            className={`
                flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                ${isActive
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-gray-800/50 border-gray-700/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500/50'}
            `}
        >
            <div className="flex items-center gap-4">
                {/* Module Icon */}
                <div
                    className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform
                        ${isActive ? 'bg-green-500/20 scale-105' : 'bg-gray-700/50'}
                    `}
                    style={{
                        boxShadow: isActive ? `0 0 20px ${module.color}30` : 'none'
                    }}
                >
                    {module.icon}
                </div>

                {/* Module Info */}
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold">{module.nameAr}</h4>
                        {isActive && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                مفعّل
                            </span>
                        )}
                    </div>
                    <p className="text-gray-400 text-sm">{pricing?.description || module.description}</p>
                    {showPrice && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            {pricing?.price > 0 ? `${pricing.price} ر.س/شهر` : 'مجاني'}
                        </p>
                    )}
                </div>
            </div>

            {/* Toggle Switch */}
            <button
                onClick={() => !disabled && onToggle(moduleKey)}
                disabled={disabled}
                className={`
                    relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50
                    ${isActive ? 'bg-green-500' : 'bg-gray-600'}
                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span
                    className={`
                        absolute top-1 w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow-md transition-all duration-300
                        ${isActive ? 'right-1' : 'left-1'}
                    `}
                />
            </button>
        </div>
    );
}

// Component to show all modules with toggles
export function TenantModulesManager({
    activeModules = [],
    onModuleToggle,
    disabled = false
}) {
    const allModules = Object.keys(SYSTEM_DEFINITIONS);

    // Calculate total monthly cost
    const totalCost = activeModules.reduce((acc, mod) => {
        return acc + (MODULE_PRICING[mod]?.price || 0);
    }, 0);

    return (
        <div className="space-y-4">
            {/* Modules List */}
            <div className="space-y-3">
                {allModules.map((moduleKey) => (
                    <TenantModuleToggle
                        key={moduleKey}
                        moduleKey={moduleKey}
                        isActive={activeModules.includes(moduleKey)}
                        onToggle={onModuleToggle}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Total Cost Summary */}
            <div className="bg-gradient-to-l from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">الإجمالي الشهري</p>
                        <p className="text-white text-xs">{activeModules.length} وحدات مفعّلة</p>
                    </div>
                    <div className="text-left">
                        <p className="text-3xl font-bold text-white">
                            {totalCost.toLocaleString('ar-SA')}
                        </p>
                        <p className="text-gray-400 text-sm">ريال سعودي/شهر</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export pricing for use in other components
export { MODULE_PRICING };
