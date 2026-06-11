/**
 * AccessApprovalDashboard - لوحة إدارة طلبات الوصول
 * تعرض الطلبات المعلقة للموافقة وطلبات المستخدم
 */

import { useState, useEffect } from 'react';
import { Button, Badge, Modal, ContentCard, DataTable, Tabs, TabPanel } from '../ui';
import api from '../../lib/api';

import { fmtDate } from '../../utils/hijriDate';

export default function AccessApprovalDashboard() {
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [approveComment, setApproveComment] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    // تحميل البيانات
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/archiving/access-approvals?status=pending');
            const data = await res.json();
            const pending = data.data || [];

            const res2 = await fetch('/api/archiving/access-approvals/my-requests');
            const data2 = await res2.json();
            const requests = data2.data || [];

            setPendingApprovals(pending);
            setMyRequests(requests);
            setStats({
                pending: pending.length,
                approved: requests.filter(r => r.status === 'Approved').length,
                rejected: requests.filter(r => r.status === 'Rejected').length,
            });
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            setPendingApprovals([]);
            setMyRequests([]);
            setStats({ pending: 0, approved: 0, rejected: 0 });
        } finally {
            setLoading(false);
        }
    };

    // الموافقة على طلب
    const handleApprove = async () => {
        if (!selectedRequest) return;

        setActionLoading(true);
        try {
            // تحديث البيانات محلياً
            setPendingApprovals(prev => prev.filter(r => r.requestId !== selectedRequest.requestId));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));

            setShowApproveModal(false);
            setApproveComment('');
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error approving request:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // رفض طلب
    const handleReject = async () => {
        if (!selectedRequest || !rejectReason.trim()) return;

        setActionLoading(true);
        try {
            setPendingApprovals(prev => prev.filter(r => r.requestId !== selectedRequest.requestId));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));

            setShowRejectModal(false);
            setRejectReason('');
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error rejecting request:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // الحصول على لون الحالة
    const getStatusBadge = (status) => {
        const statusConfig = {
            Pending: { label: 'في الانتظار', variant: 'warning' },
            UnderReview: { label: 'قيد المراجعة', variant: 'info' },
            Approved: { label: 'معتمد', variant: 'success' },
            Rejected: { label: 'مرفوض', variant: 'danger' },
            Expired: { label: 'منتهي', variant: 'secondary' },
        };
        const config = statusConfig[status] || { label: status, variant: 'secondary' };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    // الحصول على اسم نوع الوصول
    const getAccessTypeName = (type) => {
        const types = {
            View: 'عرض',
            Download: 'تحميل',
            Print: 'طباعة',
            ViewAndPrint: 'عرض وطباعة',
            Full: 'صلاحيات كاملة',
        };
        return types[type] || type;
    };

    // أعمدة جدول الطلبات المعلقة
    const pendingColumns = [
        {
            key: 'documentName',
            label: 'المستند',
            render: (_, row) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{row.documentName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{row.documentBarcode}</p>
                </div>
            ),
        },
        {
            key: 'requesterName',
            label: 'مقدم الطلب',
            render: (_, row) => (
                <div>
                    <p className="font-medium">{row.requesterName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{row.requesterDepartment}</p>
                </div>
            ),
        },
        {
            key: 'accessType',
            label: 'نوع الوصول',
            render: (_, row) => (
                <Badge variant="info">{getAccessTypeName(row.accessType)}</Badge>
            ),
        },
        {
            key: 'confidentialityLevel',
            label: 'السرية',
            render: (_, row) => {
                const levels = ['عام', 'داخلي', 'سري', 'سري للغاية', 'سري جداً'];
                const colors = ['success', 'info', 'warning', 'danger', 'danger'];
                return (
                    <Badge variant={colors[row.confidentialityLevel]}>
                        {levels[row.confidentialityLevel]}
                    </Badge>
                );
            },
        },
        {
            key: 'priority',
            label: 'الأولوية',
            render: (_, row) => {
                const priorities = {
                    Normal: { label: 'عادي', color: 'secondary' },
                    High: { label: 'مرتفع', color: 'warning' },
                    Urgent: { label: 'عاجل', color: 'danger' },
                };
                const config = priorities[row.priority] || priorities.Normal;
                return <Badge variant={config.color}>{config.label}</Badge>;
            },
        },
        {
            key: 'requestedAt',
            label: 'تاريخ الطلب',
            render: (_, row) => fmtDate(row.requestedAt),
        },
        {
            key: 'actions',
            label: 'الإجراءات',
            render: (_, row) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                            setSelectedRequest(row);
                            setShowApproveModal(true);
                        }}
                    >
                        موافقة
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                            setSelectedRequest(row);
                            setShowRejectModal(true);
                        }}
                    >
                        رفض
                    </Button>
                </div>
            ),
        },
    ];

    // أعمدة جدول طلباتي
    const myRequestsColumns = [
        {
            key: 'documentName',
            label: 'المستند',
            render: (_, row) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{row.documentName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{row.documentBarcode}</p>
                </div>
            ),
        },
        {
            key: 'accessType',
            label: 'نوع الوصول',
            render: (_, row) => (
                <Badge variant="info">{getAccessTypeName(row.accessType)}</Badge>
            ),
        },
        {
            key: 'status',
            label: 'الحالة',
            render: (_, row) => getStatusBadge(row.status),
        },
        {
            key: 'requestedAt',
            label: 'تاريخ الطلب',
            render: (_, row) => fmtDate(row.requestedAt),
        },
        {
            key: 'tokenExpiresAt',
            label: 'صلاحية الرمز',
            render: (_, row) => {
                if (row.status !== 'Approved' || !row.tokenExpiresAt) return '-';
                const expires = new Date(row.tokenExpiresAt);
                const now = new Date();
                if (expires < now) {
                    return <span className="text-red-500 text-sm">منتهي</span>;
                }
                const mins = Math.round((expires - now) / 60000);
                return <span className="text-green-600 dark:text-green-400 text-sm">{mins} دقيقة</span>;
            },
        },
        {
            key: 'rejectionReason',
            label: 'الملاحظات',
            render: (_, row) => row.rejectionReason || '-',
        },
    ];

    const tabs = [
        { id: 'pending', label: `الطلبات المعلقة (${stats.pending})` },
        { id: 'myRequests', label: 'طلباتي' },
    ];

    return (
        <div className="space-y-6">
            {/* الإحصائيات */}
            <div className="grid grid-cols-3 gap-4">
                <ContentCard className="text-center">
                    <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">طلبات معلقة</div>
                </ContentCard>
                <ContentCard className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">طلبات معتمدة</div>
                </ContentCard>
                <ContentCard className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">طلبات مرفوضة</div>
                </ContentCard>
            </div>

            {/* التبويبات */}
            <ContentCard>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                <div className="mt-4">
                    {loading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">جاري التحميل...</p>
                        </div>
                    ) : (
                        <>
                            <TabPanel isActive={activeTab === 'pending'}>
                                {pendingApprovals.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        لا توجد طلبات معلقة
                                    </div>
                                ) : (
                                    <DataTable
                                        columns={pendingColumns}
                                        data={pendingApprovals}
                                        emptyMessage="لا توجد طلبات معلقة"
                                    />
                                )}
                            </TabPanel>

                            <TabPanel isActive={activeTab === 'myRequests'}>
                                {myRequests.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        لا توجد طلبات
                                    </div>
                                ) : (
                                    <DataTable
                                        columns={myRequestsColumns}
                                        data={myRequests}
                                        emptyMessage="لا توجد طلبات"
                                    />
                                )}
                            </TabPanel>
                        </>
                    )}
                </div>
            </ContentCard>

            {/* نافذة الموافقة */}
            <Modal
                isOpen={showApproveModal}
                onClose={() => {
                    setShowApproveModal(false);
                    setApproveComment('');
                    setSelectedRequest(null);
                }}
                title="تأكيد الموافقة"
            >
                <div className="p-6 space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-green-800 dark:text-green-200">
                            أنت على وشك الموافقة على طلب {getAccessTypeName(selectedRequest?.accessType)} للمستند:
                        </p>
                        <p className="font-semibold text-green-900 mt-2">
                            {selectedRequest?.documentName}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            تعليق (اختياري)
                        </label>
                        <textarea
                            value={approveComment}
                            onChange={(e) => setApproveComment(e.target.value)}
                            placeholder="أضف تعليقاً إذا رغبت..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowApproveModal(false);
                                setApproveComment('');
                                setSelectedRequest(null);
                            }}
                            disabled={actionLoading}
                        >
                            إلغاء
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleApprove}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'جاري الموافقة...' : 'تأكيد الموافقة'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* نافذة الرفض */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRequest(null);
                }}
                title="تأكيد الرفض"
            >
                <div className="p-6 space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-red-800 dark:text-red-200">
                            أنت على وشك رفض طلب {getAccessTypeName(selectedRequest?.accessType)} للمستند:
                        </p>
                        <p className="font-semibold text-red-900 mt-2">
                            {selectedRequest?.documentName}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            سبب الرفض <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="يرجى توضيح سبب الرفض..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowRejectModal(false);
                                setRejectReason('');
                                setSelectedRequest(null);
                            }}
                            disabled={actionLoading}
                        >
                            إلغاء
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleReject}
                            disabled={actionLoading || !rejectReason.trim()}
                        >
                            {actionLoading ? 'جاري الرفض...' : 'تأكيد الرفض'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
