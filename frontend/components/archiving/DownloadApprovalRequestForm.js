/**
 * DownloadApprovalRequestForm - نموذج طلب صلاحية التحميل/الطباعة
 */

import { useState } from 'react';
import { Modal, Button, Badge } from '../ui';

export default function DownloadApprovalRequestForm({
    isOpen,
    onClose,
    documentId,
    documentName,
    documentBarcode,
    confidentialityLevel = 0,
    requestType = 'Download', // 'Download' or 'Print'
    onSubmit,
}) {
    const [justification, setJustification] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const confidentialityLabels = {
        0: { label: 'عام', color: 'success' },
        1: { label: 'داخلي', color: 'info' },
        2: { label: 'سري', color: 'warning' },
        3: { label: 'سري للغاية', color: 'danger' },
        4: { label: 'سري جداً', color: 'danger' },
    };

    const getRequiredApprovalLevels = () => {
        const baseLevel = confidentialityLevel;
        if (requestType === 'BulkDownload') {
            return Math.min(baseLevel + 1, 4);
        }
        return baseLevel;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!justification.trim()) {
            setError('سبب الطلب مطلوب');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onSubmit({
                documentId,
                accessType: requestType,
                justification: justification.trim(),
                priority,
                notes: notes.trim() || null,
            });
            onClose();
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء إرسال الطلب');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setJustification('');
        setPriority('Normal');
        setNotes('');
        setError(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`طلب صلاحية ${requestType === 'Download' ? 'التحميل' : 'الطباعة'}`}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* معلومات المستند */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">
                                {documentName}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                                {documentBarcode}
                            </p>
                        </div>
                        <Badge variant={confidentialityLabels[confidentialityLevel]?.color || 'info'}>
                            {confidentialityLabels[confidentialityLevel]?.label || 'غير محدد'}
                        </Badge>
                    </div>
                </div>

                {/* نوع الطلب */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-lg ${requestType === 'Download' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-100 text-purple-600'}`}>
                        {requestType === 'Download' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {requestType === 'Download' ? 'طلب تحميل المستند' : 'طلب طباعة المستند'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            يتطلب موافقة {getRequiredApprovalLevels()} مستوى
                        </p>
                    </div>
                </div>

                {/* سبب الطلب */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        سبب الطلب <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="اكتب سبب حاجتك للتحميل/الطباعة بشكل واضح..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                        required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        الحد الأدنى 10 أحرف - {justification.length}/2000
                    </p>
                </div>

                {/* الأولوية */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        أولوية الطلب
                    </label>
                    <div className="flex gap-3">
                        {[
                            { value: 'Normal', label: 'عادي', color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600' },
                            { value: 'High', label: 'مرتفع', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-300' },
                            { value: 'Urgent', label: 'عاجل', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setPriority(option.value)}
                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                                    priority === option.value
                                        ? option.color + ' border-current font-semibold'
                                        : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ملاحظات إضافية */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        ملاحظات إضافية (اختياري)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="أي معلومات إضافية تود إضافتها..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                    />
                </div>

                {/* تنبيه */}
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-semibold mb-1">ملاحظات مهمة:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>صلاحية {requestType === 'Download' ? 'التحميل' : 'الطباعة'} ستكون سارية لمدة <strong>30 دقيقة فقط</strong> بعد الموافقة</li>
                                <li>سيتم تسجيل جميع عمليات الوصول في سجل التدقيق الأمني</li>
                                <li>قد يتطلب الطلب موافقة عدة مستويات حسب مستوى سرية المستند</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* رسالة الخطأ */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || justification.length < 10}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                جاري الإرسال...
                            </>
                        ) : (
                            'إرسال الطلب'
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
