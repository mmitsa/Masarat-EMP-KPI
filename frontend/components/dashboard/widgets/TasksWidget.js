import React, { useState, useEffect } from 'react';

import { fmtDate } from '../../../utils/hijriDate';

const emptyTasks = [];

export default function TasksWidget({ tasks: propTasks, darkMode = false }) {
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(!propTasks);
    const [localTasks, setLocalTasks] = useState(propTasks || emptyTasks);

    useEffect(() => {
        if (propTasks) return;

        const fetchTasks = async () => {
            try {
                const api = (await import('../../../lib/api')).default;

                // محاولة جلب مهام المشاريع الخاصة بالمستخدم
                const result = await api.projects?.getTasks?.({ assignedToMe: true, pageSize: 8 });
                if (result?.data?.length) {
                    const mapped = result.data.map(t => ({
                        id: t.id,
                        title: t.titleAr || t.title || t.nameAr || t.name || 'مهمة',
                        priority: t.priority === 'Critical' || t.priority === 'High' ? 'high'
                            : t.priority === 'Low' ? 'low' : 'medium',
                        dueDate: t.dueDate || t.endDate || new Date().toISOString(),
                        completed: t.status === 'Completed' || t.status === 'Done',
                    }));
                    setLocalTasks(mapped);
                    setLoading(false);
                    return;
                }

                // محاولة جلب من HR (طلبات معلقة)
                const hrResult = await api.hr?.leaves?.getPending?.();
                if (hrResult?.data?.length) {
                    const mapped = hrResult.data.slice(0, 5).map(l => ({
                        id: l.id,
                        title: `مراجعة طلب إجازة - ${l.employeeName || 'موظف'}`,
                        priority: 'medium',
                        dueDate: l.startDate || new Date().toISOString(),
                        completed: l.status === 'approved' || l.status === 'rejected',
                    }));
                    setLocalTasks(mapped);
                    setLoading(false);
                    return;
                }

                // لا توجد مهام حقيقية
                setLocalTasks([]);
            } catch (err) {
                console.warn('TasksWidget: الخدمة غير متاحة');
                setLocalTasks([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [propTasks]);

    const toggleTask = (id) => {
        setLocalTasks(prev =>
            prev.map(task =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const filteredTasks = localTasks.filter(task => {
        if (filter === 'pending') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const completedCount = localTasks.filter(t => t.completed).length;
    const progress = localTasks.length > 0 ? (completedCount / localTasks.length) * 100 : 0;

    const priorityColors = {
        high: 'border-r-red-500',
        medium: 'border-r-amber-500',
        low: 'border-r-green-500',
    };

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-7 w-14 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    ))}
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-14 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                ))}
            </div>
        );
    }

    if (localTasks.length === 0) {
        return (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm font-medium">لا توجد مهام حالياً</p>
                <p className="text-xs mt-1">سيتم عرض المهام عند إسنادها إليك</p>
            </div>
        );
    }

    return (
        <div>
            {/* Progress */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        الإنجاز
                    </span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {completedCount}/{localTasks.length}
                    </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                        className="h-full bg-gradient-to-l from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {[
                    { id: 'all', label: 'الكل' },
                    { id: 'pending', label: 'معلق' },
                    { id: 'completed', label: 'مكتمل' },
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f.id
                            ? 'bg-blue-600 text-white'
                            : darkMode
                                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {filteredTasks.map(task => (
                    <div
                        key={task.id}
                        className={`p-3 rounded-xl border-r-4 flex items-center gap-3 transition-all ${priorityColors[task.priority] || priorityColors.medium} ${darkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'
                            } ${task.completed ? 'opacity-60' : ''}`}
                    >
                        <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${task.completed
                                ? 'bg-green-500 border-green-500'
                                : darkMode
                                    ? 'border-gray-500 hover:border-green-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                                }`}
                        >
                            {task.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${task.completed ? 'line-through' : ''} ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
                                }`}>
                                {task.title}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {fmtDate(task.dueDate)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
