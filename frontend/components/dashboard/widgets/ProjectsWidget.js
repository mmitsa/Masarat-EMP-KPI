import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import { NAVIGATION } from '../../../lib/routes';

import { fmtDate } from '../../../utils/hijriDate';

// ==================== ويدجت إدارة المشاريع ====================

export default function ProjectsWidget({ darkMode = false, compact = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        activeProjects: 0,
        completedProjects: 0,
        myTasks: 0,
        overdueTasks: 0,
        recentProjects: [],
        upcomingDeadlines: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const dashboardData = await api.projects?.getDashboard?.();
            if (dashboardData) {
                setData({
                    activeProjects: dashboardData.statistics?.activeProjects || 0,
                    completedProjects: dashboardData.statistics?.completedProjects || 0,
                    myTasks: dashboardData.statistics?.totalTasks || 0,
                    overdueTasks: dashboardData.statistics?.overdueTasks || 0,
                    recentProjects: dashboardData.recentProjects || [],
                    upcomingDeadlines: dashboardData.upcomingDeadlines || [],
                });
            }
        } catch (error) {
            console.warn('Error loading projects widget:', error);
            // بيانات افتراضية للعرض
            setData({
                activeProjects: 12,
                completedProjects: 45,
                myTasks: 8,
                overdueTasks: 2,
                recentProjects: [
                    { id: 1, nameAr: 'تطوير البوابة الإلكترونية', progress: 65, status: 'InProgress' },
                    { id: 2, nameAr: 'نظام إدارة المخازن', progress: 40, status: 'InProgress' },
                    { id: 3, nameAr: 'تحديث البنية التحتية', progress: 85, status: 'InProgress' },
                ],
                upcomingDeadlines: [
                    { id: 1, title: 'تسليم المرحلة الأولى', dueDate: '2025-02-15', projectName: 'البوابة الإلكترونية' },
                    { id: 2, title: 'اختبار النظام', dueDate: '2025-02-20', projectName: 'نظام المخازن' },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Planning: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200',
            InProgress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            OnHold: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700',
            Completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            Cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        };
        return colors[status] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200';
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className={`h-16 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-16 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="space-y-3">
                {/* الإحصائيات المختصرة */}
                <div className="grid grid-cols-2 gap-2">
                    <StatBox
                        label="مشاريع نشطة"
                        value={data.activeProjects}
                        icon="📋"
                        darkMode={darkMode}
                    />
                    <StatBox
                        label="مهامي"
                        value={data.myTasks}
                        icon="✅"
                        darkMode={darkMode}
                        highlight={data.overdueTasks > 0}
                    />
                </div>

                {/* رابط سريع */}
                <Link
                    href={NAVIGATION.PROJECTS?.DASHBOARD || '/projects'}
                    className={`block p-3 rounded-lg text-center font-medium transition-colors ${
                        darkMode
                            ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100'
                    }`}
                >
                    عرض جميع المشاريع ←
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* الإحصائيات */}
            <div className="grid grid-cols-4 gap-3">
                <StatBox label="نشطة" value={data.activeProjects} icon="📋" darkMode={darkMode} />
                <StatBox label="مكتملة" value={data.completedProjects} icon="✅" darkMode={darkMode} />
                <StatBox label="مهامي" value={data.myTasks} icon="📝" darkMode={darkMode} />
                <StatBox
                    label="متأخرة"
                    value={data.overdueTasks}
                    icon="⚠️"
                    darkMode={darkMode}
                    danger={data.overdueTasks > 0}
                />
            </div>

            {/* المشاريع الأخيرة */}
            <div>
                <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    المشاريع النشطة
                </h4>
                <div className="space-y-2">
                    {data.recentProjects.slice(0, 3).map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className={`block p-3 rounded-lg transition-colors ${
                                darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {project.nameAr}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                                    {project.progress}%
                                </span>
                            </div>
                            <div className={`h-1.5 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                <div
                                    className={`h-full rounded-full transition-all ${getProgressColor(project.progress)}`}
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* المواعيد القريبة */}
            {data.upcomingDeadlines.length > 0 && (
                <div>
                    <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        مواعيد تسليم قريبة
                    </h4>
                    <div className="space-y-2">
                        {data.upcomingDeadlines.slice(0, 2).map((deadline) => (
                            <div
                                key={deadline.id}
                                className={`p-2 rounded-lg border-r-4 ${
                                    darkMode
                                        ? 'bg-gray-700/30 border-orange-500'
                                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-400'
                                }`}
                            >
                                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {deadline.title}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {deadline.projectName}
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                        {fmtDate(deadline.dueDate)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* روابط سريعة */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                    href={NAVIGATION.PROJECTS?.MY_TASKS || '/projects/tasks/my'}
                    className={`p-2 rounded-lg text-center text-sm font-medium transition-colors ${
                        darkMode
                            ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                    }`}
                >
                    مهامي
                </Link>
                <Link
                    href={NAVIGATION.PROJECTS?.CREATE || '/projects/create'}
                    className={`p-2 rounded-lg text-center text-sm font-medium transition-colors ${
                        darkMode
                            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                    }`}
                >
                    + مشروع جديد
                </Link>
            </div>
        </div>
    );
}

// مكون الإحصائيات الصغيرة
function StatBox({ label, value, icon, darkMode, danger = false, highlight = false }) {
    return (
        <div className={`p-2 rounded-lg text-center ${
            danger
                ? darkMode ? 'bg-red-900/30' : 'bg-red-50'
                : highlight
                    ? darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                    : darkMode ? 'bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-800'
        }`}>
            <div className="text-lg mb-1">{icon}</div>
            <div className={`text-xl font-bold ${
                danger
                    ? 'text-red-500'
                    : highlight
                        ? darkMode ? 'text-yellow-400' : 'text-yellow-600'
                        : darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
                {value}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {label}
            </div>
        </div>
    );
}

// ويدجت المهام القادمة
export function MyTasksProjectWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const response = await api.projects?.getMyTasks?.();
            if (response?.items) {
                setTasks(response.items.slice(0, 5));
            } else if (response?.data?.length) {
                setTasks(response.data.slice(0, 5));
            } else if (Array.isArray(response) && response.length) {
                setTasks(response.slice(0, 5));
            }
        } catch (error) {
            console.warn('Error loading tasks:', error);
            // بيانات افتراضية
            setTasks([
                { id: 1, code: 'TSK-001', title: 'تصميم واجهة المستخدم', priority: 'High', dueDate: '2025-02-15', status: 'InProgress' },
                { id: 2, code: 'TSK-002', title: 'تطوير API الخلفية', priority: 'Critical', dueDate: '2025-02-20', status: 'Todo' },
                { id: 3, code: 'TSK-003', title: 'اختبار وحدات النظام', priority: 'Medium', dueDate: '2025-02-25', status: 'InProgress' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            Critical: darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400',
            High: darkMode ? 'text-orange-400' : 'text-orange-600',
            Medium: darkMode ? 'text-blue-400' : 'text-blue-600',
            Low: darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400',
        };
        return colors[priority] || colors.Medium;
    };

    const getStatusIcon = (status) => {
        const icons = {
            Todo: '⏳',
            InProgress: '🔄',
            InReview: '👀',
            Done: '✅',
        };
        return icons[status] || '📋';
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-14 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tasks.length === 0 ? (
                <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-sm">لا توجد مهام معلقة</p>
                </div>
            ) : (
                <>
                    {tasks.map((task) => (
                        <Link
                            key={task.id}
                            href={`/projects/tasks/${task.id}`}
                            className={`block p-3 rounded-lg transition-colors ${
                                darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getStatusIcon(task.status)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {task.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-mono ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                            {task.code}
                                        </span>
                                        <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                            • {task.priority}
                                        </span>
                                    </div>
                                </div>
                                {task.dueDate && (
                                    <span className={`text-xs ${
                                        new Date(task.dueDate) < new Date()
                                            ? 'text-red-500 font-semibold'
                                            : darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {fmtDate(task.dueDate)}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                    <Link
                        href={NAVIGATION.PROJECTS?.MY_TASKS || '/projects/tasks/my'}
                        className={`block text-center py-2 text-sm font-medium ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700'
                        }`}
                    >
                        عرض جميع المهام ←
                    </Link>
                </>
            )}
        </div>
    );
}

// ويدجت تقدم المشاريع
export function ProjectProgressWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await api.projects?.getProjects?.({ status: 'InProgress', pageSize: 4 });
            if (response?.items) {
                setProjects(response.items.slice(0, 4));
            } else if (response?.data?.length) {
                setProjects(response.data.slice(0, 4));
            }
        } catch (error) {
            console.warn('Error loading projects:', error);
            // بيانات افتراضية
            setProjects([
                { id: 1, nameAr: 'تطوير البوابة الإلكترونية', progress: 65 },
                { id: 2, nameAr: 'نظام إدارة المخازن', progress: 40 },
                { id: 3, nameAr: 'تحديث البنية التحتية', progress: 85 },
                { id: 4, nameAr: 'تطبيق الجوال', progress: 25 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-12 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {projects.map((project) => (
                <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={`block p-3 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {project.nameAr}
                        </span>
                        <span className={`text-sm font-bold ${
                            project.progress >= 80 ? 'text-green-500' :
                            project.progress >= 50 ? 'text-blue-500' :
                            project.progress >= 25 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                            {project.progress}%
                        </span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
                            style={{ width: `${project.progress}%` }}
                        />
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ==================== ويدجت مواعيد التسليم ====================
export function ProjectDeadlinesWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [deadlines, setDeadlines] = useState([]);

    useEffect(() => {
        loadDeadlines();
    }, []);

    const loadDeadlines = async () => {
        try {
            const response = await api.projects?.getUpcomingTasks?.( 14 );
            if (response?.items) {
                setDeadlines(response.items);
            } else if (response?.data?.length) {
                setDeadlines(response.data);
            }
        } catch (error) {
            console.warn('Error loading deadlines:', error);
            // بيانات افتراضية
            setDeadlines([
                { id: 1, title: 'تسليم المرحلة الأولى', dueDate: '2025-02-10', projectName: 'البوابة الإلكترونية', projectId: 1, priority: 'High' },
                { id: 2, title: 'اختبار النظام', dueDate: '2025-02-15', projectName: 'نظام المخازن', projectId: 2, priority: 'Critical' },
                { id: 3, title: 'مراجعة التصميم', dueDate: '2025-02-18', projectName: 'تطبيق الجوال', projectId: 3, priority: 'Medium' },
                { id: 4, title: 'التوثيق الفني', dueDate: '2025-02-22', projectName: 'البنية التحتية', projectId: 4, priority: 'Low' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUrgencyColor = (daysRemaining) => {
        if (daysRemaining < 0) return { bg: 'bg-red-500', text: 'text-white', label: 'متأخر' };
        if (daysRemaining === 0) return { bg: 'bg-red-500', text: 'text-white', label: 'اليوم' };
        if (daysRemaining <= 3) return { bg: 'bg-orange-500', text: 'text-white', label: `${daysRemaining} أيام` };
        if (daysRemaining <= 7) return { bg: 'bg-yellow-500', text: 'text-gray-900 dark:text-white', label: `${daysRemaining} أيام` };
        return { bg: 'bg-green-500', text: 'text-white', label: `${daysRemaining} يوم` };
    };

    const getPriorityIcon = (priority) => {
        const icons = {
            Critical: '🔴',
            High: '🟠',
            Medium: '🔵',
            Low: '⚪',
        };
        return icons[priority] || '⚪';
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-16 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                ))}
            </div>
        );
    }

    if (deadlines.length === 0) {
        return (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="text-4xl block mb-3">📅</span>
                <p className="text-sm">لا توجد مواعيد تسليم قريبة</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {deadlines.slice(0, 4).map((deadline) => {
                const daysRemaining = getDaysRemaining(deadline.dueDate);
                const urgency = getUrgencyColor(daysRemaining);

                return (
                    <Link
                        key={deadline.id}
                        href={`/projects/${deadline.projectId}`}
                        className={`block p-3 rounded-xl transition-all hover:scale-[1.02] ${
                            darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${urgency.bg} ${urgency.text}`}>
                                {urgency.label}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{getPriorityIcon(deadline.priority)}</span>
                                    <span className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {deadline.title}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {deadline.projectName}
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                        {fmtDate(deadline.dueDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}

            <Link
                href={NAVIGATION.PROJECTS?.DASHBOARD || '/projects'}
                className={`block text-center py-2 text-sm font-medium ${
                    darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                }`}
            >
                عرض جميع المواعيد ←
            </Link>
        </div>
    );
}

// ==================== ويدجت الإجراءات السريعة للمشاريع ====================
export function ProjectQuickActionsWidget({ darkMode = false }) {
    const actions = [
        { id: 1, label: 'مشروع جديد', icon: '➕', href: NAVIGATION.PROJECTS?.CREATE || '/projects/create', color: 'green' },
        { id: 2, label: 'مهامي', icon: '✅', href: NAVIGATION.PROJECTS?.MY_TASKS || '/projects/tasks/my', color: 'blue' },
        { id: 3, label: 'لوحة كانبان', icon: '📊', href: '/projects/1/kanban', color: 'purple' },
        { id: 4, label: 'التقارير', icon: '📈', href: NAVIGATION.PROJECTS?.REPORTS || '/projects/reports', color: 'amber' },
    ];

    const getColorClasses = (color) => {
        const colors = {
            green: darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100',
            blue: darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100',
            purple: darkMode ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            amber: darkMode ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
                <Link
                    key={action.id}
                    href={action.href}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-105 ${getColorClasses(action.color)}`}
                >
                    <span className="text-2xl mb-2">{action.icon}</span>
                    <span className="text-sm font-medium text-center">{action.label}</span>
                </Link>
            ))}
        </div>
    );
}

// ==================== ويدجت إحصائيات المشاريع مع رسم بياني ====================
export function ProjectStatsChartWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        onHold: 0,
        cancelled: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.projects?.getDashboard?.();
            if (response?.statistics) {
                setStats({
                    total: response.statistics.totalProjects || 0,
                    active: response.statistics.activeProjects || 0,
                    completed: response.statistics.completedProjects || 0,
                    onHold: response.statistics.onHoldProjects || 0,
                    cancelled: response.statistics.cancelledProjects || 0,
                });
            }
        } catch (error) {
            console.warn('Error loading stats:', error);
            // بيانات افتراضية
            setStats({
                total: 45,
                active: 12,
                completed: 28,
                onHold: 3,
                cancelled: 2,
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className={`h-32 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
        );
    }

    const chartData = [
        { label: 'نشطة', value: stats.active, color: '#3B82F6', percentage: (stats.active / stats.total) * 100 },
        { label: 'مكتملة', value: stats.completed, color: '#10B981', percentage: (stats.completed / stats.total) * 100 },
        { label: 'متوقفة', value: stats.onHold, color: '#F59E0B', percentage: (stats.onHold / stats.total) * 100 },
        { label: 'ملغاة', value: stats.cancelled, color: '#EF4444', percentage: (stats.cancelled / stats.total) * 100 },
    ];

    // حساب زوايا الرسم البياني الدائري
    let cumulativePercentage = 0;
    const segments = chartData.map(item => {
        const start = cumulativePercentage;
        cumulativePercentage += item.percentage;
        return {
            ...item,
            start,
            end: cumulativePercentage,
        };
    });

    return (
        <div className="flex items-center gap-4">
            {/* الرسم البياني الدائري */}
            <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {segments.map((segment, index) => {
                        const circumference = 100;
                        const strokeDasharray = `${segment.percentage} ${circumference - segment.percentage}`;
                        const strokeDashoffset = -segment.start;

                        return (
                            <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="none"
                                stroke={segment.color}
                                strokeWidth="3"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {stats.total}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            مشروع
                        </div>
                    </div>
                </div>
            </div>

            {/* مفتاح الرسم البياني */}
            <div className="flex-1 space-y-2">
                {chartData.filter(item => item.value > 0).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                {item.label}
                            </span>
                        </div>
                        <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== ويدجت ملخص المشاريع الكبير ====================
export function ProjectsSummaryLargeWidget({ darkMode = false }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: { active: 0, completed: 0, totalTasks: 0, completedTasks: 0 },
        topProjects: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await api.projects?.getDashboard?.();
            if (response) {
                setData({
                    stats: {
                        active: response.statistics?.activeProjects || 0,
                        completed: response.statistics?.completedProjects || 0,
                        totalTasks: response.statistics?.totalTasks || 0,
                        completedTasks: response.statistics?.completedTasks || 0,
                    },
                    topProjects: response.recentProjects || [],
                });
            }
        } catch (error) {
            console.warn('Error loading data:', error);
            // بيانات افتراضية
            setData({
                stats: { active: 12, completed: 28, totalTasks: 156, completedTasks: 98 },
                topProjects: [
                    { id: 1, nameAr: 'تطوير البوابة الإلكترونية', progress: 75, tasksCount: 24, completedTasksCount: 18 },
                    { id: 2, nameAr: 'نظام إدارة المخازن', progress: 40, tasksCount: 18, completedTasksCount: 7 },
                    { id: 3, nameAr: 'تحديث البنية التحتية', progress: 90, tasksCount: 32, completedTasksCount: 29 },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const taskCompletionRate = data.stats.totalTasks > 0
        ? Math.round((data.stats.completedTasks / data.stats.totalTasks) * 100)
        : 0;

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-20 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                </div>
                <div className={`h-40 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* الإحصائيات الرئيسية */}
            <div className="grid grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    <div className="text-2xl mb-1">📋</div>
                    <div className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {data.stats.active}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>نشطة</div>
                </div>
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-green-900/30' : 'bg-green-50 dark:bg-green-900/20'}`}>
                    <div className="text-2xl mb-1">✅</div>
                    <div className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {data.stats.completed}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>مكتملة</div>
                </div>
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                    <div className="text-2xl mb-1">📝</div>
                    <div className={`text-xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {data.stats.totalTasks}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>مهمة</div>
                </div>
                <div className={`p-3 rounded-xl text-center ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                    <div className="text-2xl mb-1">📊</div>
                    <div className={`text-xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {taskCompletionRate}%
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>إنجاز</div>
                </div>
            </div>

            {/* أبرز المشاريع */}
            <div>
                <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    أبرز المشاريع النشطة
                </h4>
                <div className="space-y-3">
                    {data.topProjects.slice(0, 3).map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className={`block p-3 rounded-xl transition-all hover:scale-[1.01] ${
                                darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {project.nameAr}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {project.completedTasksCount || 0}/{project.tasksCount || 0} مهمة
                                    </span>
                                    <span className={`text-sm font-bold ${
                                        project.progress >= 80 ? 'text-green-500' :
                                        project.progress >= 50 ? 'text-blue-500' :
                                        project.progress >= 25 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                        {project.progress}%
                                    </span>
                                </div>
                            </div>
                            <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        project.progress >= 80 ? 'bg-green-500' :
                                        project.progress >= 50 ? 'bg-blue-500' :
                                        project.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* روابط سريعة */}
            <div className="grid grid-cols-3 gap-2 pt-2">
                <Link
                    href={NAVIGATION.PROJECTS?.DASHBOARD || '/projects'}
                    className={`p-2 rounded-lg text-center text-xs font-medium transition-colors ${
                        darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                    }`}
                >
                    جميع المشاريع
                </Link>
                <Link
                    href={NAVIGATION.PROJECTS?.MY_TASKS || '/projects/tasks/my'}
                    className={`p-2 rounded-lg text-center text-xs font-medium transition-colors ${
                        darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                    }`}
                >
                    مهامي
                </Link>
                <Link
                    href={NAVIGATION.PROJECTS?.CREATE || '/projects/create'}
                    className={`p-2 rounded-lg text-center text-xs font-medium transition-colors ${
                        darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                    }`}
                >
                    + مشروع جديد
                </Link>
            </div>
        </div>
    );
}
