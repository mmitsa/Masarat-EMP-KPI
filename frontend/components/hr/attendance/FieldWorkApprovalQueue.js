import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Modal, EmptyState } from '../../ui';

// ============================================
// مكون قائمة طلبات الموافقة على العمل الميداني
// ============================================
export default function FieldWorkApprovalQueue({ darkMode }) {
    // قائمة الطلبات المعلقة - تُملأ من الـ API
    const [pendingRequests, setPendingRequests] = useState([]);

    // حالة نافذة الرفض
    const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
    const [rejectNotes, setRejectNotes] = useState('');

    // حالة التحميل للأزرار
    const [processingId, setProcessingId] = useState(null);

    // جلب البيانات من الـ API
    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch('/api/hr/attendance/field-work');
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data)) {
                        const mapped = data.map(item => ({
                            id: item.attendanceId || item.id,
                            employeeName: item.employeeName || item.EmployeeName,
                            employeeId: item.employeeId || item.EmployeeId,
                            department: item.departmentName || item.department,
                            date: item.date || item.Date,
                            time: item.checkInTime || item.time,
                            distanceFromNearest: item.distanceFromNearestLocation != null
                                ? Math.round(item.distanceFromNearestLocation / 1000 * 10) / 10
                                : null,
                            nearestLocation: item.nearestLocationName || 'غير محدد',
                            reason: item.fieldWorkReason || item.reason,
                            selfieUrl: item.checkInSelfieUrl || null,
                            latitude: item.latitude,
                            longitude: item.longitude,
                        }));
                        setPendingRequests(mapped);
                        return;
                    }
                }
            } catch {
                // API unavailable - keep empty list
            }
        };
        fetchPending();
    }, []);

    // أنماط الألوان
    const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    const cardBgAlt = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
    const textPrimary = darkMode ? 'text-white' : 'text-gray-900 dark:text-white';
    const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
    const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';
    const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 dark:placeholder-gray-500' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

    // الموافقة على طلب
    const handleApprove = useCallback(async (requestId) => {
        setProcessingId(requestId);
        try {
            await fetch('/api/hr/attendance/field-work', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', requestId: requestId }),
            });
        } catch { /* continue with local state update */ }
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        setProcessingId(null);
    }, []);

    // فتح نافذة الرفض
    const openRejectModal = useCallback((requestId) => {
        setRejectModal({ open: true, requestId });
        setRejectNotes('');
    }, []);

    // تأكيد الرفض
    const handleReject = useCallback(async () => {
        if (!rejectModal.requestId) return;
        setProcessingId(rejectModal.requestId);
        try {
            await fetch('/api/hr/attendance/field-work', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', requestId: rejectModal.requestId, notes: rejectNotes }),
            });
        } catch { /* continue with local state update */ }
        setPendingRequests((prev) => prev.filter((r) => r.id !== rejectModal.requestId));
        setRejectModal({ open: false, requestId: null });
        setRejectNotes('');
        setProcessingId(null);
    }, [rejectModal.requestId, rejectNotes]);

    return (
        <div className="space-y-4 mt-6" dir="rtl">
            {/* العنوان */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className={`text-lg font-bold ${textPrimary}`}>طلبات الموافقة على العمل الميداني</h3>
                    <p className={`text-sm ${textSecondary}`}>
                        {pendingRequests.length > 0
                            ? `${pendingRequests.length} طلبات بانتظار المراجعة`
                            : 'لا توجد طلبات معلقة'}
                    </p>
                </div>
                {pendingRequests.length > 0 && (
                    <Badge variant="warning" size="md" dot>
                        {pendingRequests.length} معلق
                    </Badge>
                )}
            </div>

            {/* قائمة الطلبات */}
            {pendingRequests.length === 0 ? (
                <EmptyState
                    title="لا توجد طلبات معلقة"
                    description="جميع طلبات العمل الميداني تمت مراجعتها. ستظهر الطلبات الجديدة هنا عند ورودها."
                    icon={
                        <svg className="w-16 h-16 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pendingRequests.map((request) => (
                        <div
                            key={request.id}
                            className={`rounded-xl border p-5 transition-all duration-200 ${cardBg} ${
                                processingId === request.id ? 'opacity-60 pointer-events-none' : ''
                            }`}
                        >
                            {/* رأس البطاقة - معلومات الموظف والصورة */}
                            <div className="flex items-start gap-4 mb-4">
                                {/* صورة الموظف المصغرة (placeholder) */}
                                <div className="flex-shrink-0">
                                    <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${
                                        darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/50'
                                    } flex items-center justify-center`}>
                                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* معلومات الموظف */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-base ${textPrimary}`}>{request.employeeName}</h4>
                                    <p className={`text-sm ${textSecondary}`}>{request.department}</p>
                                    <p className={`text-xs ${textMuted}`}>{request.employeeId}</p>
                                </div>

                                {/* صورة السيلفي المصغرة */}
                                <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-lg overflow-hidden border ${
                                        darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/50'
                                    } flex items-center justify-center`}
                                        title="الصورة الذاتية"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* تفاصيل الطلب */}
                            <div className="space-y-3 mb-4">
                                {/* التاريخ والوقت */}
                                <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{request.date} - الساعة {request.time}</span>
                                </div>

                                {/* المسافة من أقرب موقع */}
                                <div className={`flex items-center gap-2 text-sm`}>
                                    <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className={textSecondary}>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">{request.distanceFromNearest} كم</span>
                                        {' '}من {request.nearestLocation}
                                    </span>
                                </div>

                                {/* سبب العمل الميداني */}
                                <div className={`rounded-lg p-3 ${cardBgAlt}`}>
                                    <p className={`text-xs font-medium mb-1 ${textMuted}`}>سبب العمل الميداني</p>
                                    <p className={`text-sm ${textPrimary}`}>{request.reason}</p>
                                </div>
                            </div>

                            {/* أزرار الإجراءات */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleApprove(request.id)}
                                    disabled={processingId === request.id}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {processingId === request.id ? 'جاري المعالجة...' : 'موافقة'}
                                </button>
                                <button
                                    onClick={() => openRejectModal(request.id)}
                                    disabled={processingId === request.id}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    رفض
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ============ نافذة ملاحظات الرفض ============ */}
            <Modal
                isOpen={rejectModal.open}
                onClose={() => setRejectModal({ open: false, requestId: null })}
                title="رفض طلب العمل الميداني"
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setRejectModal({ open: false, requestId: null })}
                            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                                darkMode
                                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={handleReject}
                            disabled={!rejectNotes.trim()}
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            تأكيد الرفض
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className={`text-sm ${textSecondary}`}>
                        يرجى كتابة سبب رفض الطلب. سيتم إرسال الملاحظات للموظف.
                    </p>
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${textSecondary}`}>ملاحظات الرفض</label>
                        <textarea
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            rows={3}
                            placeholder="اكتب سبب الرفض هنا..."
                            className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none ${inputBg}`}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
