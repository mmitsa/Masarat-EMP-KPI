/**
 * متتبع إجازات التدريب
 * Training Leave Tracker Component
 */

import React, { useState, useMemo } from 'react';
import {
    AcademicCapIcon,
    BookOpenIcon,
    DocumentCheckIcon,
    BuildingLibraryIcon,
    EyeIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge, Button, DataTable, EmptyState, Modal } from '../../../ui';
import { formatDateArabic } from '../../../../utils/hr-helpers';

// Training leave status constants
const TRAINING_STATUS = {
    upcoming: { name: 'قادمة', color: 'info', bgColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' },
    active: { name: 'قائمة', color: 'warning', bgColor: 'bg-amber-100 text-amber-800 dark:text-amber-200' },
    completed: { name: 'مكتملة', color: 'success', bgColor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' },
    cancelled: { name: 'ملغاة', color: 'danger', bgColor: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' },
};

// Training types
const TRAINING_TYPES = {
    internal: { name: 'تدريب داخلي', color: 'blue' },
    external: { name: 'تدريب خارجي', color: 'purple' },
    online: { name: 'تدريب عن بعد', color: 'green' },
    certification: { name: 'شهادة مهنية', color: 'amber' },
    conference: { name: 'مؤتمر/ندوة', color: 'pink' },
    workshop: { name: 'ورشة عمل', color: 'cyan' },
};

export default function TrainingLeaveTracker({
    trainingLeaves = [],
    loading = false,
    onViewDetails = () => {},
}) {
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const thisYear = now.getFullYear();

        const thisYearTrainings = trainingLeaves.filter(l => {
            const start = new Date(l.start_date);
            return start.getFullYear() === thisYear;
        });

        const totalDays = trainingLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
        const thisYearDays = thisYearTrainings.reduce((sum, l) => sum + (l.days || 0), 0);

        // Upcoming trainings
        const upcoming = trainingLeaves.filter(l => {
            const start = new Date(l.start_date);
            return start > now;
        });

        // Active trainings
        const active = trainingLeaves.filter(l => {
            const start = new Date(l.start_date);
            const end = new Date(l.end_date);
            return start <= now && end >= now;
        });

        // By training type
        const byType = {};
        trainingLeaves.forEach(l => {
            const type = l.trainingType || 'internal';
            if (!byType[type]) byType[type] = { count: 0, days: 0 };
            byType[type].count++;
            byType[type].days += l.days || 0;
        });

        // Certificate tracking
        const withCertificate = trainingLeaves.filter(l => l.hasCertificate).length;
        const pendingCertificate = trainingLeaves.filter(l =>
            l.status === 'completed' && !l.hasCertificate
        ).length;

        return {
            total: trainingLeaves.length,
            totalDays,
            thisYear: thisYearTrainings.length,
            thisYearDays,
            upcoming: upcoming.length,
            active: active.length,
            byType,
            withCertificate,
            pendingCertificate,
            uniqueEmployees: new Set(trainingLeaves.map(l => l.employee?.id || l.employeeId)).size,
        };
    }, [trainingLeaves]);

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
            key: 'courseName',
            label: 'الدورة التدريبية',
            render: (value, row) => (
                <div>
                    <div className="font-medium text-blue-600 dark:text-blue-400">{value}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {TRAINING_TYPES[row.trainingType]?.name || 'تدريب'}
                    </div>
                </div>
            ),
        },
        {
            key: 'institution',
            label: 'الجهة المنفذة',
            render: (value) => value || '-',
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
            render: (value) => <span className="font-medium">{value} يوم</span>,
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (value) => {
                const status = TRAINING_STATUS[value] || TRAINING_STATUS.completed;
                return (
                    <Badge variant={status.color} size="sm">
                        {status.name}
                    </Badge>
                );
            },
        },
        {
            key: 'hasCertificate',
            label: 'الشهادة',
            render: (value, row) => (
                value ? (
                    <Badge variant="success" size="sm">
                        <DocumentCheckIcon className="w-3 h-3 ml-1" />
                        مستلمة
                    </Badge>
                ) : row.status === 'completed' ? (
                    <Badge variant="warning" size="sm">
                        قيد الانتظار
                    </Badge>
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

    const handleViewDetails = (training) => {
        setSelectedTraining(training);
        setShowModal(true);
        onViewDetails(training);
    };

    if (loading) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري تحميل إجازات التدريب...</p>
                </div>
            </ContentCard>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="إجمالي الدورات"
                    value={stats.total}
                    suffix="دورة"
                    color="purple"
                    icon={<AcademicCapIcon className="w-6 h-6" />}
                />
                <StatCard
                    label="إجمالي الأيام"
                    value={stats.totalDays}
                    suffix="يوم"
                    color="blue"
                    icon={<BookOpenIcon className="w-6 h-6" />}
                />
                <StatCard
                    label="الشهادات المستلمة"
                    value={stats.withCertificate}
                    suffix="شهادة"
                    color="green"
                    icon={<DocumentCheckIcon className="w-6 h-6" />}
                />
                <StatCard
                    label="الموظفين المتدربين"
                    value={stats.uniqueEmployees}
                    suffix="موظف"
                    color="amber"
                />
            </div>

            {/* Training Type Distribution */}
            <ContentCard
                title="توزيع التدريب حسب النوع"
                icon={<BuildingLibraryIcon className="w-5 h-5" />}
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(TRAINING_TYPES).map(([key, type]) => {
                        const data = stats.byType[key] || { count: 0, days: 0 };
                        const colors = {
                            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
                            green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                            amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                            pink: 'bg-pink-50 border-pink-200',
                            cyan: 'bg-cyan-50 border-cyan-200',
                        };

                        return (
                            <div
                                key={key}
                                className={`p-4 rounded-xl border-2 ${colors[type.color]} text-center`}
                            >
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.count}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{type.name}</div>
                                <div className="text-xs text-gray-400 mt-1">{data.days} يوم</div>
                            </div>
                        );
                    })}
                </div>
            </ContentCard>

            {/* Upcoming Trainings */}
            {trainingLeaves.filter(l => new Date(l.start_date) > new Date()).length > 0 && (
                <ContentCard
                    title="الدورات التدريبية القادمة"
                    icon={<AcademicCapIcon className="w-5 h-5 text-purple-500" />}
                    subtitle={`${stats.upcoming} دورة قادمة`}
                >
                    <div className="space-y-3">
                        {trainingLeaves
                            .filter(l => new Date(l.start_date) > new Date())
                            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                            .slice(0, 5)
                            .map((training, idx) => (
                                <div
                                    key={training.id || idx}
                                    className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                            <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {training.courseName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {training.employee?.fullName || training.employee?.nameAr}
                                                {' • '}
                                                {training.institution}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-purple-600">
                                            {training.days} يوم
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            يبدأ {formatDateArabic(training.start_date)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </ContentCard>
            )}

            {/* Pending Certificates Alert */}
            {stats.pendingCertificate > 0 && (
                <ContentCard className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center gap-3">
                        <DocumentCheckIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
                        <div>
                            <span className="font-bold text-amber-800 dark:text-amber-200">
                                {stats.pendingCertificate} شهادة بانتظار الاستلام
                            </span>
                            <span className="text-sm text-amber-600 mr-2">
                                من دورات مكتملة
                            </span>
                        </div>
                    </div>
                </ContentCard>
            )}

            {/* Full Table */}
            <ContentCard
                title="سجل إجازات التدريب"
                icon={<BookOpenIcon className="w-5 h-5" />}
            >
                {trainingLeaves.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={trainingLeaves}
                        emptyMessage="لا توجد إجازات تدريب"
                    />
                ) : (
                    <EmptyState
                        icon={<AcademicCapIcon className="w-16 h-16" />}
                        title="لا توجد إجازات تدريب"
                        description="لم يتم تسجيل أي إجازات تدريب في الفترة المحددة"
                    />
                )}
            </ContentCard>

            {/* Details Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="تفاصيل الدورة التدريبية"
                size="lg"
            >
                {selectedTraining && (
                    <div className="space-y-4">
                        {/* Training Header */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-2">
                                {selectedTraining.courseName}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-purple-600">
                                <span>{TRAINING_TYPES[selectedTraining.trainingType]?.name}</span>
                                <span>•</span>
                                <span>{selectedTraining.institution}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem
                                label="الموظف"
                                value={selectedTraining.employee?.fullName || selectedTraining.employee?.nameAr}
                            />
                            <InfoItem
                                label="الرقم الوظيفي"
                                value={selectedTraining.employee?.employeeNumber}
                            />
                            <InfoItem
                                label="القسم"
                                value={selectedTraining.employee?.department}
                            />
                            <InfoItem
                                label="عدد الأيام"
                                value={`${selectedTraining.days} يوم`}
                            />
                            <InfoItem
                                label="من تاريخ"
                                value={formatDateArabic(selectedTraining.start_date)}
                            />
                            <InfoItem
                                label="إلى تاريخ"
                                value={formatDateArabic(selectedTraining.end_date)}
                            />
                            <InfoItem
                                label="المدرب"
                                value={selectedTraining.trainer}
                            />
                            <InfoItem
                                label="الموقع"
                                value={selectedTraining.location}
                            />
                        </div>

                        {/* Certificate Status */}
                        <div className={`p-4 rounded-xl ${
                            selectedTraining.hasCertificate
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DocumentCheckIcon className={`w-5 h-5 ${
                                        selectedTraining.hasCertificate ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                                    }`} />
                                    <span className="font-medium">
                                        {selectedTraining.hasCertificate ? 'الشهادة مستلمة' : 'الشهادة غير مستلمة'}
                                    </span>
                                </div>
                                {selectedTraining.certificateUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                    >
                                        عرض
                                    </Button>
                                )}
                            </div>
                        </div>

                        {selectedTraining.objectives && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">أهداف التدريب</div>
                                <div className="text-gray-900 dark:text-white">{selectedTraining.objectives}</div>
                            </div>
                        )}

                        {selectedTraining.notes && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ملاحظات</div>
                                <div className="text-gray-900 dark:text-white">{selectedTraining.notes}</div>
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
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-600',
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
