/**
 * تقويم جدول الإجازات
 * Leave Schedule Calendar Component
 */

import React, { useState, useMemo } from 'react';
import {
    ChevronRightIcon,
    ChevronLeftIcon,
    CalendarDaysIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge, Button, Select } from '../../../ui';
import { LEAVE_TYPES, getLeaveTypeName } from '../../../../constants/leave-types';

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function LeaveScheduleCalendar({
    leaves = [],
    departments = [],
    onLeaveClick = () => {},
    loading = false,
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedLeaveType, setSelectedLeaveType] = useState('');

    // Get current month/year
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Filter leaves
    const filteredLeaves = useMemo(() => {
        return leaves.filter(leave => {
            if (selectedDepartment && leave.employee?.departmentId?.toString() !== selectedDepartment) {
                return false;
            }
            if (selectedLeaveType && leave.leave_type !== selectedLeaveType) {
                return false;
            }
            return true;
        });
    }, [leaves, selectedDepartment, selectedLeaveType]);

    // Generate calendar days for current month
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: new Date(year, month, day),
                isCurrentMonth: true,
            });
        }

        // Next month days to complete grid
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [year, month]);

    // Get leaves for a specific date
    const getLeavesForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return filteredLeaves.filter(leave => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            return date >= start && date <= end;
        });
    };

    // Navigation
    const goToPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if date is today
    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Check if date is weekend (Friday/Saturday in Saudi)
    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 5 || day === 6; // Friday or Saturday
    };

    // Get leave type color
    const getLeaveColor = (leaveType) => {
        const type = LEAVE_TYPES[leaveType];
        if (!type) return 'bg-gray-500';
        const colors = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            amber: 'bg-amber-500',
            purple: 'bg-purple-500',
            pink: 'bg-pink-500',
            indigo: 'bg-indigo-500',
            red: 'bg-red-500',
            cyan: 'bg-cyan-500',
            teal: 'bg-teal-500',
            orange: 'bg-orange-500',
            rose: 'bg-rose-500',
            emerald: 'bg-emerald-500',
            fuchsia: 'bg-fuchsia-500',
            gray: 'bg-gray-500',
        };
        return colors[type.color] || 'bg-gray-500';
    };

    // Department options
    const departmentOptions = [
        { value: '', label: 'جميع الأقسام' },
        ...departments.map(d => ({
            value: d.id?.toString(),
            label: d.name,
        })),
    ];

    // Leave type options
    const leaveTypeOptions = [
        { value: '', label: 'جميع الأنواع' },
        ...Object.entries(LEAVE_TYPES).map(([code, type]) => ({
            value: code,
            label: type.name,
        })),
    ];

    if (loading) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري تحميل التقويم...</p>
                </div>
            </ContentCard>
        );
    }

    return (
        <ContentCard
            title="تقويم الإجازات"
            icon={<CalendarDaysIcon className="w-5 h-5" />}
        >
            {/* Header with navigation and filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                {/* Month navigation */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToNextMonth}
                            icon={<ChevronRightIcon className="w-5 h-5" />}
                        />
                        <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[150px] text-center">
                            {MONTHS_AR[month]} {year}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToPrevMonth}
                            icon={<ChevronLeftIcon className="w-5 h-5" />}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                    >
                        اليوم
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        options={departmentOptions}
                        className="w-40"
                    />
                    <Select
                        value={selectedLeaveType}
                        onChange={(e) => setSelectedLeaveType(e.target.value)}
                        options={leaveTypeOptions}
                        className="w-40"
                    />
                </div>
            </div>

            {/* Calendar grid */}
            <div className="border rounded-xl overflow-hidden">
                {/* Days header */}
                <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
                    {DAYS_AR.map((day, idx) => (
                        <div
                            key={day}
                            className={`p-3 text-center text-sm font-semibold border-b ${
                                idx === 5 || idx === 6 ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((dayInfo, idx) => {
                        const dayLeaves = getLeavesForDate(dayInfo.date);
                        const isCurrentDay = isToday(dayInfo.date);
                        const weekend = isWeekend(dayInfo.date);

                        return (
                            <div
                                key={idx}
                                className={`min-h-[100px] p-2 border-b border-l ${
                                    !dayInfo.isCurrentMonth ? 'bg-gray-50' : 'bg-white dark:bg-gray-900'
                                } ${weekend && dayInfo.isCurrentMonth ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                            >
                                {/* Day number */}
                                <div className={`text-sm mb-1 ${
                                    isCurrentDay
                                        ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center'
                                        : !dayInfo.isCurrentMonth
                                        ? 'text-gray-400'
                                        : weekend
                                        ? 'text-red-500 font-medium'
                                        : 'text-gray-900 dark:text-white'
                                }`}>
                                    {dayInfo.date.getDate()}
                                </div>

                                {/* Leaves for this day */}
                                <div className="space-y-1">
                                    {dayLeaves.slice(0, 3).map((leave, leaveIdx) => (
                                        <div
                                            key={leave.id || leaveIdx}
                                            onClick={() => onLeaveClick(leave)}
                                            className={`${getLeaveColor(leave.leave_type)} text-white text-xs px-2 py-0.5 rounded cursor-pointer truncate hover:opacity-90 transition-opacity`}
                                            title={`${leave.employee?.fullName || leave.employee?.nameAr} - ${getLeaveTypeName(leave.leave_type)}`}
                                        >
                                            {leave.employee?.fullName || leave.employee?.nameAr}
                                        </div>
                                    ))}
                                    {dayLeaves.length > 3 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                                            +{dayLeaves.length - 3} آخرين
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-300">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>دليل الألوان:</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(LEAVE_TYPES).slice(0, 8).map(([code, type]) => (
                        <div key={code} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getLeaveColor(code)}`} />
                            <span className="text-xs text-gray-600 dark:text-gray-300">{type.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                        إجمالي الإجازات هذا الشهر
                    </span>
                    <Badge variant="primary" size="lg">
                        {filteredLeaves.filter(l => {
                            const start = new Date(l.start_date);
                            return start.getMonth() === month && start.getFullYear() === year;
                        }).length} إجازة
                    </Badge>
                </div>
            </div>
        </ContentCard>
    );
}
