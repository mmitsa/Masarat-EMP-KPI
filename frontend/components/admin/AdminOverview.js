import React, { useState, useEffect } from 'react';
import { StatCard, Badge, ContentCard, PageLoading } from '../ui';
import api from '../../lib/api';

import { fmtDate } from '../../utils/hijriDate';

// Icons
const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const RolesIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const PermissionsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const WorkflowIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Default empty data structure
const emptyOverview = {
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalPermissions: 0,
    pendingApprovals: 0,
    systemHealth: {
        cpu: 0,
        memory: 0,
        storage: 0,
        uptime: '-'
    },
    recentUsers: [],
    recentActivities: [],
};

export default function AdminOverview({ onModuleSelect, loading = false }) {
    const [overview, setOverview] = useState(null);

    useEffect(() => {
        loadOverview();
    }, []);

    const loadOverview = async () => {
        try {
            // Fetch from API
            const result = await api.admin?.getDashboard?.();
            setOverview(result || emptyOverview);
        } catch (err) {
            console.warn('Error loading admin overview:', err);
            setOverview(emptyOverview);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60);

        if (diff < 60) return `منذ ${diff} دقيقة`;
        if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
        return fmtDate(date);
    };

    const getActivityTypeColor = (type) => {
        const colors = {
            success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
            info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        };
        return colors[type] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300';
    };

    const getStatusBadge = (status) => {
        if (status === 'active') return <Badge variant="success">نشط</Badge>;
        if (status === 'inactive') return <Badge variant="default">غير نشط</Badge>;
        if (status === 'suspended') return <Badge variant="danger">موقوف</Badge>;
        return <Badge variant="default">{status}</Badge>;
    };

    if (loading || !overview) return <PageLoading message="جاري تحميل النظرة العامة..." />;

    return (
        <div className="w-full space-y-6">
            {/* Main Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="اجمالي المستخدمين"
                    value={overview.totalUsers}
                    icon={<UsersIcon />}
                    color="blue"
                    trend={`${overview.activeUsers} نشط`}
                />
                <StatCard
                    title="الادوار"
                    value={overview.totalRoles}
                    icon={<RolesIcon />}
                    color="purple"
                />
                <StatCard
                    title="الصلاحيات"
                    value={overview.totalPermissions}
                    icon={<PermissionsIcon />}
                    color="green"
                />
                <StatCard
                    title="طلبات معلقة"
                    value={overview.pendingApprovals}
                    icon={<WorkflowIcon />}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <ContentCard>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">المستخدمين النشطين</h3>
                        <button
                            onClick={() => onModuleSelect('users')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            عرض الكل
                        </button>
                    </div>
                    <div className="space-y-3">
                        {overview.recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                                </div>
                                <div className="text-left">
                                    {getStatusBadge(user.status)}
                                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(user.lastLogin)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ContentCard>

                {/* Recent Activities */}
                <ContentCard>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">النشاط الاخير</h3>
                        <button
                            onClick={() => onModuleSelect('logs')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            عرض الكل
                        </button>
                    </div>
                    <div className="space-y-3">
                        {overview.recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityTypeColor(activity.type)}`}>
                                    <ClockIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        <span className="font-medium">{activity.action}</span>
                                        {' - '}
                                        <span className="text-gray-600 dark:text-gray-300">{activity.user}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.details}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ContentCard>
            </div>

            {/* System Health */}
            <ContentCard>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">حالة النظام</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="#3b82f6"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${overview.systemHealth.cpu * 2.51} 251`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{overview.systemHealth.cpu}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">استخدام المعالج</p>
                    </div>

                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${overview.systemHealth.memory * 2.51} 251`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{overview.systemHealth.memory}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">استخدام الذاكرة</p>
                    </div>

                    <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="#8b5cf6"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${overview.systemHealth.storage * 2.51} 251`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{overview.systemHealth.storage}%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">استخدام التخزين</p>
                    </div>

                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{overview.systemHealth.uptime}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">نسبة التشغيل</p>
                    </div>
                </div>
            </ContentCard>
        </div>
    );
}
