/**
 * بطاقة صلاحيات المنصب الإداري
 * تعرض المنصب والصلاحيات النشطة والنطاق
 */

import React from 'react';
import { POSITION_PERMISSION_MAP, POSITION_LABELS, getPositionScope } from '../../lib/hr/positionPermissions';

const scopeColors = {
    organization: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    department: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    section: 'bg-purple-100 text-purple-800 dark:text-purple-200',
    unit: 'bg-orange-100 text-orange-800 dark:text-orange-200',
    team: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    self: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100',
};

export default function PositionPermissionsCard({ positionCode, scopeName, employeeName, compact = false }) {
    const config = POSITION_PERMISSION_MAP[positionCode];
    if (!config) return null;

    const scope = getPositionScope(positionCode);
    const colorClass = scopeColors[scope.type] || scopeColors.self;

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                    {config.label}
                </span>
                {scopeName && (
                    <span className="text-gray-500 dark:text-gray-400">
                        ({scope.label}: {scopeName})
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-gray-900/20">
            {/* رأس البطاقة */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{config.label}</h4>
                        {employeeName && <p className="text-xs text-gray-500 dark:text-gray-400">{employeeName}</p>}
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                    {scope.label}{scopeName ? `: ${scopeName}` : ''}
                </span>
            </div>

            {/* مستوى الموافقة */}
            {config.approvalLevel && config.approvalLevel !== 'None' && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">مستوى الموافقة:</span>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 rounded text-xs font-medium">
                        {config.approvalLevel === 'Final' ? 'نهائي' :
                         config.approvalLevel === 'Level3' ? 'المستوى 3' :
                         config.approvalLevel === 'Level2' ? 'المستوى 2' :
                         config.approvalLevel === 'Level1' ? 'المستوى 1' : config.approvalLevel}
                    </span>
                </div>
            )}

            {/* الصلاحيات */}
            <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">الصلاحيات النشطة:</p>
                <div className="flex flex-wrap gap-1">
                    {config.permissions.slice(0, 6).map((perm, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs">
                            {perm.replace(/\./g, ' › ').replace('*', 'الكل')}
                        </span>
                    ))}
                    {config.permissions.length > 6 && (
                        <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded text-xs">
                            +{config.permissions.length - 6} أخرى
                        </span>
                    )}
                </div>
            </div>

            {/* الصفحات المتاحة */}
            {config.pages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">الصفحات المتاحة:</p>
                    <div className="flex flex-wrap gap-1">
                        {config.pages.map((page, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                                {page.replace('/hr/', '')}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
