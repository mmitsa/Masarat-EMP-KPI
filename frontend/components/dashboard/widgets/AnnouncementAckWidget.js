import React, { useMemo } from 'react';
import { useAnnouncementPopup, ANNOUNCEMENT_TYPES, ANNOUNCEMENT_PRIORITIES } from '../../../context/AnnouncementPopupContext';

import { fmtDate } from '../../../utils/hijriDate';

/**
 * ويدجت متابعة علم الوصول بالتعميمات
 * يعرض نسبة العلم لكل تعميم منشور مع مؤشر بصري
 */
export default function AnnouncementAckWidget({ darkMode = false }) {
    const { announcements } = useAnnouncementPopup();

    const published = useMemo(() => {
        return (announcements || [])
            .filter(a => a.status === 'published' || a.status === 'Published')
            .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
            .slice(0, 5);
    }, [announcements]);

    const overallStats = useMemo(() => {
        const pub = (announcements || []).filter(a => a.status === 'published' || a.status === 'Published');
        const totalAcks = pub.reduce((sum, a) => sum + (a.acknowledgmentCount || a.acknowledgments?.length || 0), 0);
        const totalTargets = pub.reduce((sum, a) => sum + (a.totalTargetCount || 0), 0);
        const rate = totalTargets > 0 ? Math.round((totalAcks / totalTargets) * 100) : 0;
        return { count: pub.length, totalAcks, totalTargets, rate };
    }, [announcements]);

    const getAckRate = (item) => {
        const acks = item.acknowledgmentCount || item.acknowledgments?.length || 0;
        const target = item.totalTargetCount || 0;
        return target > 0 ? Math.round((acks / target) * 100) : 0;
    };

    const getRateColor = (rate) => {
        if (rate >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20' };
        if (rate >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50' };
        return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50 dark:bg-red-900/20' };
    };

    const getTypeInfo = (type) => {
        const key = (type || 'general').toLowerCase();
        return ANNOUNCEMENT_TYPES[key] || ANNOUNCEMENT_TYPES.general;
    };

    const getPriorityInfo = (priority) => {
        const key = (priority || 'normal').toLowerCase();
        return ANNOUNCEMENT_PRIORITIES[key] || ANNOUNCEMENT_PRIORITIES.normal;
    };

    if (!announcements || announcements.length === 0) {
        return (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                <span className="text-3xl block mb-2">📢</span>
                <p className="text-sm">لا توجد تعميمات حالياً</p>
            </div>
        );
    }

    return (
        <div>
            {/* Overall Stats Bar */}
            <div className={`flex items-center gap-4 p-3 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            نسبة العلم الإجمالية
                        </span>
                        <span className={`text-sm font-bold ${getRateColor(overallStats.rate).text}`}>
                            {overallStats.rate}%
                        </span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getRateColor(overallStats.rate).bar}`}
                            style={{ width: `${Math.min(overallStats.rate, 100)}%` }}
                        />
                    </div>
                    <div className={`flex items-center justify-between mt-1 text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        <span>{overallStats.totalAcks} علم وصول</span>
                        <span>من {overallStats.totalTargets} مستهدف</span>
                    </div>
                </div>
                <div className="text-center px-3 border-r border-gray-300 dark:border-gray-600">
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {overallStats.count}
                    </div>
                    <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>منشور</div>
                </div>
            </div>

            {/* Per-Announcement List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {published.map((item) => {
                    const rate = getAckRate(item);
                    const colors = getRateColor(rate);
                    const typeInfo = getTypeInfo(item.type);
                    const acks = item.acknowledgmentCount || item.acknowledgments?.length || 0;
                    const target = item.totalTargetCount || 0;

                    return (
                        <div
                            key={item.id}
                            className={`p-3 rounded-xl border transition-colors ${darkMode
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-lg shrink-0">{typeInfo.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {item.titleAr || item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            darkMode ? `bg-${typeInfo.color}-900/30 text-${typeInfo.color}-400`
                                                : `bg-${typeInfo.color}-100 text-${typeInfo.color}-700`
                                        }`}>
                                            {typeInfo.label}
                                        </span>
                                        <span className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                            {item.publishedAt ? fmtDate(item.publishedAt) : ''}
                                        </span>
                                    </div>
                                    {/* Progress */}
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-[10px] ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                                علم الوصول: {acks}/{target}
                                            </span>
                                            <span className={`text-xs font-bold ${colors.text}`}>
                                                {rate}%
                                            </span>
                                        </div>
                                        <div className={`h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                                                style={{ width: `${Math.min(rate, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Link to admin */}
            <a
                href="/admin/announcements"
                className={`flex items-center justify-center gap-2 mt-3 py-2 rounded-lg text-xs font-medium transition-colors ${darkMode
                    ? 'text-blue-400 hover:bg-blue-900/30'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50'
                }`}
            >
                <span>إدارة التعميمات</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
    );
}
