/**
 * متتبع الإجازات المرضية
 * Sick Leave Tracker Component
 */

import React, { useState, useMemo } from 'react';
import {
    HeartIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    ChartBarIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge, Button, DataTable, EmptyState, Modal } from '../../../ui';
import { formatDateArabic } from '../../../../utils/hr-helpers';

// Sick leave status constants
const SICK_LEAVE_STATUS = {
    active: { name: 'قائمة', color: 'warning', bgColor: 'bg-amber-100 text-amber-800 dark:text-amber-200' },
    completed: { name: 'منتهية', color: 'success', bgColor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' },
    extended: { name: 'ممتدة', color: 'danger', bgColor: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' },
};

export default function SickLeaveTracker({
    sickLeaves = [],
    loading = false,
    onViewDetails = () => {},
}) {
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const thisMonthLeaves = sickLeaves.filter(l => {
            const start = new Date(l.start_date);
            return start.getMonth() === thisMonth && start.getFullYear() === thisYear;
        });

        const totalDays = sickLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
        const thisMonthDays = thisMonthLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
        const activeLeaves = sickLeaves.filter(l => {
            const end = new Date(l.end_date);
            return end >= now;
        });

        // Pattern detection - employees with frequent sick leaves
        const employeeSickDays = {};
        sickLeaves.forEach(l => {
            const empId = l.employee?.id || l.employeeId;
            if (!employeeSickDays[empId]) {
                employeeSickDays[empId] = { count: 0, days: 0, employee: l.employee };
            }
            employeeSickDays[empId].count++;
            employeeSickDays[empId].days += l.days || 0;
        });

        const frequentAbsent = Object.values(employeeSickDays)
            .filter(e => e.count >= 3 || e.days >= 15)
            .sort((a, b) => b.days - a.days);

        return {
            total: sickLeaves.length,
            totalDays,
            thisMonth: thisMonthLeaves.length,
            thisMonthDays,
            active: activeLeaves.length,
            frequentAbsent,
            avgDuration: sickLeaves.length > 0
                ? (totalDays / sickLeaves.length).toFixed(1)
                : 0,
        };
    }, [sickLeaves]);

    // Table columns
    const columns = [
        {
            key: 'employee',
            label: 'الموظف',
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.employee?.fullName || row.employee?.nameAr}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{row.employee?.employeeNumber}</div>
                </div>
            ),
        },
        {
            key: 'department',
            label: 'القسم',
            render: (_, row) => row.employee?.department || '-',
        },
        {
            key: 'dates',
            label: 'الفترة',
            render: (_, row) => (
                <div className="text-sm">
                    <div>{formatDateArabic(row.start_date)}</div>
                    <div className="text-gray-500 dark:text-gray-400">إلى {formatDateArabic(row.end_date)}</div>
                </div>
            ),
        },
        {
            key: 'days',
            label: 'الأيام',
            render: (value) => (
                <span className={`font-bold ${value > 7 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {value} يوم
                </span>
            ),
        },
        {
            key: 'hospital',
            label: 'المستشفى',
            render: (value) => value || '-',
        },
        {
            key: 'doctor',
            label: 'الطبيب',
            render: (value) => value || '-',
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (value) => {
                const status = SICK_LEAVE_STATUS[value] || SICK_LEAVE_STATUS.completed;
                return (
                    <Badge variant={status.color} size="sm">
                        {status.name}
                    </Badge>
                );
            },
        },
        {
            key: 'hasAttachments',
            label: 'التقرير',
            render: (value, row) => (
                value || row.medicalReport ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(row)}
                        icon={<DocumentTextIcon className="w-4 h-4" />}
                    >
                        عرض
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(row)}
                    icon={<EyeIcon className="w-4 h-4" />}
                />
            ),
        },
    ];

    const handleViewDetails = (leave) => {
        setSelectedLeave(leave);
        setShowModal(true);
        onViewDetails(leave);
    };

    if (loading) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري تحميل الإجازات المرضية...</p>
                </div>
            </ContentCard>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="إجمالي الإجازات المرضية"
                    value={stats.total}
                    suffix="إجازة"
                    color="red"
                    icon={<HeartIcon className="w-6 h-6" />}
                />
                <StatCard
                    label="إجمالي الأيام"
                    value={stats.totalDays}
                    suffix="يوم"
                    color="amber"
                    icon={<ChartBarIcon className="w-6 h-6" />}
                />
                <StatCard
                    label="هذا الشهر"
                    value={stats.thisMonthDays}
                    suffix="يوم"
                    color="blue"
                />
                <StatCard
                    label="متوسط المدة"
                    value={stats.avgDuration}
                    suffix="يوم"
                    color="purple"
                />
            </div>

            {/* Pattern Alert */}
            {stats.frequentAbsent.length > 0 && (
                <ContentCard className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
                                تنبيه: موظفون بغياب مرضي متكرر
                            </h4>
                            <div className="space-y-2">
                                {stats.frequentAbsent.slice(0, 3).map((emp, idx) => (
                                    <div key={idx} className="flex items-center gap-4 text-sm text-amber-700">
                                        <span className="font-medium">
                                            {emp.employee?.fullName || emp.employee?.nameAr}
                                        </span>
                                        <span>•</span>
                                        <span>{emp.count} مرات</span>
                                        <span>•</span>
                                        <span>{emp.days} يوم إجمالي</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ContentCard>
            )}

            {/* Active Sick Leaves */}
            {sickLeaves.filter(l => new Date(l.end_date) >= new Date()).length > 0 && (
                <ContentCard
                    title="الإجازات المرضية الحالية"
                    icon={<HeartIcon className="w-5 h-5 text-red-500" />}
                    subtitle={`${stats.active} موظف في إجازة مرضية حالياً`}
                >
                    <div className="space-y-3">
                        {sickLeaves
                            .filter(l => new Date(l.end_date) >= new Date())
                            .map((leave, idx) => (
                                <div
                                    key={leave.id || idx}
                                    className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                            <HeartIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {leave.employee?.fullName || leave.employee?.nameAr}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {leave.employee?.department}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-red-600 dark:text-red-400">
                                            {leave.days} يوم
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            ينتهي {formatDateArabic(leave.end_date)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </ContentCard>
            )}

            {/* Full Table */}
            <ContentCard
                title="سجل الإجازات المرضية"
                icon={<DocumentTextIcon className="w-5 h-5" />}
            >
                {sickLeaves.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={sickLeaves}
                        emptyMessage="لا توجد إجازات مرضية"
                    />
                ) : (
                    <EmptyState
                        icon={<HeartIcon className="w-16 h-16" />}
                        title="لا توجد إجازات مرضية"
                        description="لم يتم تسجيل أي إجازات مرضية في الفترة المحددة"
                    />
                )}
            </ContentCard>

            {/* Details Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="تفاصيل الإجازة المرضية"
                size="lg"
            >
                {selectedLeave && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem
                                label="الموظف"
                                value={selectedLeave.employee?.fullName || selectedLeave.employee?.nameAr}
                            />
                            <InfoItem
                                label="الرقم الوظيفي"
                                value={selectedLeave.employee?.employeeNumber}
                            />
                            <InfoItem
                                label="القسم"
                                value={selectedLeave.employee?.department}
                            />
                            <InfoItem
                                label="عدد الأيام"
                                value={`${selectedLeave.days} يوم`}
                            />
                            <InfoItem
                                label="من تاريخ"
                                value={formatDateArabic(selectedLeave.start_date)}
                            />
                            <InfoItem
                                label="إلى تاريخ"
                                value={formatDateArabic(selectedLeave.end_date)}
                            />
                            <InfoItem
                                label="المستشفى"
                                value={selectedLeave.hospital}
                            />
                            <InfoItem
                                label="الطبيب"
                                value={selectedLeave.doctor}
                            />
                        </div>

                        {selectedLeave.diagnosis && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">التشخيص</div>
                                <div className="text-gray-900 dark:text-white">{selectedLeave.diagnosis}</div>
                            </div>
                        )}

                        {selectedLeave.notes && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <div className="text-sm text-amber-600 mb-1">ملاحظات</div>
                                <div className="text-gray-900 dark:text-white">{selectedLeave.notes}</div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

// Stat Card Component
const StatCard = ({ label, value, suffix, color, icon }) => {
    const colors = {
        red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    };

    return (
        <div className={`p-4 rounded-xl border-2 ${colors[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-80">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold">
                {value} <span className="text-sm font-normal opacity-80">{suffix}</span>
            </div>
        </div>
    );
};

// Info Item Component
const InfoItem = ({ label, value }) => (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="font-medium text-gray-900 dark:text-white">{value || '-'}</div>
    </div>
);
