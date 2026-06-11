import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge, Modal, EmptyState } from '../../ui';

// بيانات الحضور عبر الجوال (تُجلب من API)

// ============================================
// مكون لوحة الحضور عبر الجوال
// ============================================
export default function MobileAttendancePanel({ darkMode }) {
    // بيانات الحضور
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    // حالة الفلاتر
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        source: 'all',
        geofenceStatus: 'all',
        approvalStatus: 'all',
    });

    // حالة الصفحات
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // حالة نافذة الصورة الذاتية
    const [selfieModal, setSelfieModal] = useState({ open: false, record: null });

    // جلب البيانات من الـ API
    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/hr/attendance/daily-table?date=${filters.date}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.items || data)) {
                        const items = data.items || data;
                        const mapped = items.map(item => ({
                            id: item.id,
                            employeeName: item.employeeName || item.EmployeeName,
                            employeeId: item.employeeId || item.EmployeeId,
                            department: item.departmentName || item.department,
                            date: item.date || item.Date,
                            checkIn: item.checkInTime || item.CheckInTime,
                            checkOut: item.checkOutTime || item.CheckOutTime,
                            source: (item.source || item.Source || 'manual').toLowerCase(),
                            geofenceStatus: item.isInsideGeofence === true ? 'inside' : item.isInsideGeofence === false ? 'outside' : 'inside',
                            fieldWorkReason: item.fieldWorkReason || item.FieldWorkReason || null,
                            status: (item.fieldWorkApprovalStatus || item.reconciliationStatus || 'approved').toLowerCase(),
                            selfieUrl: item.checkInSelfieUrl || item.CheckInSelfieUrl || null,
                            latitude: item.checkInLatitude || null,
                            longitude: item.checkInLongitude || null,
                            selfieTimestamp: item.createdAt || null,
                        }));
                        setRecords(mapped);
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // fallback to mock data
            }
            setRecords([]);
            setLoading(false);
        };
        fetchRecords();
    }, [filters.date]);

    // تصفية البيانات
    const filteredData = useMemo(() => {
        return records.filter((record) => {
            if (filters.source !== 'all' && record.source !== filters.source) return false;
            if (filters.geofenceStatus !== 'all' && record.geofenceStatus !== filters.geofenceStatus) return false;
            if (filters.approvalStatus !== 'all' && record.status !== filters.approvalStatus) return false;
            return true;
        });
    }, [filters]);

    // بيانات الصفحة الحالية
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    // إحصائيات البطاقات
    const stats = useMemo(() => {
        const mobileRecords = records.filter((r) => r.source === 'mobile');
        const pendingApprovals = records.filter((r) => r.status === 'pending');
        const outsideGeofence = records.filter((r) => r.geofenceStatus === 'outside');
        const approvedCount = records.filter((r) => r.status === 'approved').length;
        const totalWithDecision = records.filter((r) => r.status !== 'pending').length;
        const approvalRate = totalWithDecision > 0 ? Math.round((approvedCount / totalWithDecision) * 100) : 0;

        return {
            totalMobile: mobileRecords.length,
            pendingApprovals: pendingApprovals.length,
            outsideGeofence: outsideGeofence.length,
            approvalRate,
        };
    }, [records]);

    // تغيير الفلتر
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    }, []);

    // عرض شارة المصدر
    const getSourceBadge = (source) => {
        const config = {
            biometric: { label: 'بصمة', variant: 'success' },
            mobile: { label: 'جوال', variant: 'primary' },
            manual: { label: 'يدوي', variant: 'default' },
        };
        const { label, variant } = config[source] || { label: source, variant: 'default' };
        return <Badge variant={variant} size="sm">{label}</Badge>;
    };

    // عرض شارة حالة النطاق الجغرافي
    const getGeofenceBadge = (status) => {
        if (status === 'inside') {
            return <Badge variant="success" size="sm" dot>داخل النطاق</Badge>;
        }
        return <Badge variant="warning" size="sm" dot>خارج النطاق</Badge>;
    };

    // عرض شارة حالة الموافقة
    const getApprovalBadge = (status) => {
        const config = {
            approved: { label: 'معتمد', variant: 'success' },
            pending: { label: 'قيد المراجعة', variant: 'warning' },
            rejected: { label: 'مرفوض', variant: 'danger' },
        };
        const { label, variant } = config[status] || { label: status, variant: 'default' };
        return <Badge variant={variant} size="sm">{label}</Badge>;
    };

    // أنماط الألوان
    const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    const cardBgAlt = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
    const textPrimary = darkMode ? 'text-white' : 'text-gray-900 dark:text-white';
    const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
    const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';
    const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 text-gray-900 dark:text-white';
    const tableBorder = darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700';
    const tableHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
    const tableHeader = darkMode ? 'bg-gray-700/30' : 'bg-gray-50 dark:bg-gray-800';

    return (
        <div className="space-y-6" dir="rtl">
            {/* ============ بطاقات الإحصائيات ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* إجمالي سجلات الجوال */}
                <div className={`rounded-xl border p-5 ${cardBg}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${textSecondary}`}>سجلات الجوال اليوم</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${textPrimary}`}>{stats.totalMobile}</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>من إجمالي {records.length} سجل</p>
                </div>

                {/* طلبات موافقة معلقة */}
                <div className={`rounded-xl border p-5 ${cardBg}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${textSecondary}`}>موافقات معلقة</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${textPrimary}`}>{stats.pendingApprovals}</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>بانتظار المراجعة</p>
                </div>

                {/* خارج النطاق الجغرافي */}
                <div className={`rounded-xl border p-5 ${cardBg}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${textSecondary}`}>خارج النطاق</span>
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${textPrimary}`}>{stats.outsideGeofence}</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>تسجيل من خارج النطاق</p>
                </div>

                {/* نسبة الموافقة */}
                <div className={`rounded-xl border p-5 ${cardBg}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${textSecondary}`}>نسبة الموافقة</span>
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${textPrimary}`}>{stats.approvalRate}%</p>
                    <p className={`text-xs mt-1 ${textMuted}`}>من السجلات المُعالجة</p>
                </div>
            </div>

            {/* ============ الفلاتر ============ */}
            <div className={`rounded-xl border p-4 ${cardBg}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* فلتر التاريخ */}
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${textSecondary}`}>التاريخ</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 transition-colors ${inputBg}`}
                        />
                    </div>

                    {/* فلتر المصدر */}
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${textSecondary}`}>المصدر</label>
                        <select
                            value={filters.source}
                            onChange={(e) => handleFilterChange('source', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 transition-colors ${inputBg}`}
                        >
                            <option value="all">الكل</option>
                            <option value="mobile">جوال</option>
                            <option value="biometric">بصمة</option>
                            <option value="manual">يدوي</option>
                        </select>
                    </div>

                    {/* فلتر النطاق الجغرافي */}
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${textSecondary}`}>النطاق الجغرافي</label>
                        <select
                            value={filters.geofenceStatus}
                            onChange={(e) => handleFilterChange('geofenceStatus', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 transition-colors ${inputBg}`}
                        >
                            <option value="all">الكل</option>
                            <option value="inside">داخل النطاق</option>
                            <option value="outside">خارج النطاق</option>
                        </select>
                    </div>

                    {/* فلتر حالة الموافقة */}
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${textSecondary}`}>حالة الموافقة</label>
                        <select
                            value={filters.approvalStatus}
                            onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 transition-colors ${inputBg}`}
                        >
                            <option value="all">الكل</option>
                            <option value="approved">معتمد</option>
                            <option value="pending">قيد المراجعة</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ============ جدول البيانات ============ */}
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                {filteredData.length === 0 ? (
                    <EmptyState
                        title="لا توجد سجلات"
                        description="لا توجد سجلات حضور عبر الجوال تطابق معايير البحث المحددة."
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={tableHeader}>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>اسم الموظف</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>التاريخ</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>الدخول</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>الخروج</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>المصدر</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>النطاق</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>سبب العمل الميداني</th>
                                        <th className={`text-right px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>الحالة</th>
                                        <th className={`text-center px-4 py-3 font-semibold ${textSecondary} border-b ${tableBorder}`}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((record) => (
                                        <tr key={record.id} className={`border-b ${tableBorder} ${tableHover} transition-colors`}>
                                            <td className={`px-4 py-3 font-medium ${textPrimary}`}>
                                                <div>
                                                    <p className="font-semibold">{record.employeeName}</p>
                                                    <p className={`text-xs ${textMuted}`}>{record.employeeId} - {record.department}</p>
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 ${textSecondary}`}>{record.date}</td>
                                            <td className={`px-4 py-3 ${textPrimary} font-mono`}>{record.checkIn || '-'}</td>
                                            <td className={`px-4 py-3 ${textPrimary} font-mono`}>{record.checkOut || '-'}</td>
                                            <td className="px-4 py-3">{getSourceBadge(record.source)}</td>
                                            <td className="px-4 py-3">{getGeofenceBadge(record.geofenceStatus)}</td>
                                            <td className={`px-4 py-3 ${textSecondary} max-w-[200px] truncate`}>
                                                {record.fieldWorkReason || '-'}
                                            </td>
                                            <td className="px-4 py-3">{getApprovalBadge(record.status)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {record.selfieUrl ? (
                                                    <button
                                                        onClick={() => setSelfieModal({ open: true, record })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        عرض الصورة
                                                    </button>
                                                ) : (
                                                    <span className={`text-xs ${textMuted}`}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ترقيم الصفحات */}
                        {totalPages > 1 && (
                            <div className={`flex items-center justify-between px-4 py-3 border-t ${tableBorder}`}>
                                <p className={`text-sm ${textSecondary}`}>
                                    عرض {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredData.length)} من {filteredData.length} سجل
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                            darkMode
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        السابق
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : darkMode
                                                        ? 'text-gray-300 hover:bg-gray-700'
                                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                            darkMode
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        التالي
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ============ نافذة عرض الصورة الذاتية ============ */}
            <Modal
                isOpen={selfieModal.open}
                onClose={() => setSelfieModal({ open: false, record: null })}
                title="تفاصيل التسجيل عبر الجوال"
                size="md"
            >
                {selfieModal.record && (
                    <div className="space-y-5">
                        {/* معلومات الموظف */}
                        <div className={`rounded-xl p-4 ${cardBgAlt}`}>
                            <p className={`font-bold text-lg ${textPrimary}`}>{selfieModal.record.employeeName}</p>
                            <p className={`text-sm ${textSecondary}`}>{selfieModal.record.employeeId} - {selfieModal.record.department}</p>
                        </div>

                        {/* الصورة الذاتية */}
                        <div className="text-center">
                            <p className={`text-sm font-medium mb-3 ${textSecondary}`}>الصورة الذاتية عند التسجيل</p>
                            <div className={`inline-block rounded-xl overflow-hidden border-2 ${
                                darkMode ? 'border-gray-600' : 'border-gray-200 dark:border-gray-700'
                            }`}>
                                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* تفاصيل الموقع والوقت */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={`rounded-xl p-4 ${cardBgAlt}`}>
                                <p className={`text-xs font-medium mb-1 ${textMuted}`}>الإحداثيات الجغرافية</p>
                                <p className={`text-sm font-mono ${textPrimary}`} dir="ltr">
                                    {selfieModal.record.latitude != null
                                        ? `${selfieModal.record.latitude.toFixed(4)}, ${selfieModal.record.longitude.toFixed(4)}`
                                        : 'غير متوفر'}
                                </p>
                            </div>
                            <div className={`rounded-xl p-4 ${cardBgAlt}`}>
                                <p className={`text-xs font-medium mb-1 ${textMuted}`}>وقت التقاط الصورة</p>
                                <p className={`text-sm ${textPrimary}`}>
                                    {selfieModal.record.selfieTimestamp
                                        ? new Date(selfieModal.record.selfieTimestamp).toLocaleString('ar-SA')
                                        : 'غير متوفر'}
                                </p>
                            </div>
                        </div>

                        {/* حالة النطاق */}
                        <div className={`rounded-xl p-4 flex items-center justify-between ${cardBgAlt}`}>
                            <span className={`text-sm font-medium ${textSecondary}`}>حالة النطاق الجغرافي</span>
                            {getGeofenceBadge(selfieModal.record.geofenceStatus)}
                        </div>

                        {/* سبب العمل الميداني */}
                        {selfieModal.record.fieldWorkReason && (
                            <div className={`rounded-xl p-4 ${cardBgAlt}`}>
                                <p className={`text-xs font-medium mb-1 ${textMuted}`}>سبب العمل الميداني</p>
                                <p className={`text-sm ${textPrimary}`}>{selfieModal.record.fieldWorkReason}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
