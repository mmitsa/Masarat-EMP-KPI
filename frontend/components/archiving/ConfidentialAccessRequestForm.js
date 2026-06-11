/**
 * ConfidentialAccessRequestForm - نموذج طلب الوصول للمستندات السرية
 * يستخدم للوصول لمستندات من إدارات أخرى أو ذات سرية عالية
 */

import { useState } from 'react';
import { Modal, Button, Badge } from '../ui';

export default function ConfidentialAccessRequestForm({
    isOpen,
    onClose,
    documentId,
    documentInfo, // { name, barcode, department, confidentialityLevel, ownerName }
    requesterDepartment,
    onSubmit,
}) {
    const [formData, setFormData] = useState({
        accessType: 'View',
        businessPurpose: '',
        requestedAccessStart: '',
        requestedAccessEnd: '',
        priority: 'Normal',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const accessTypes = [
        { value: 'View', label: 'عرض فقط', description: 'عرض المستند بدون تحميل أو طباعة' },
        { value: 'ViewAndPrint', label: 'عرض وطباعة', description: 'عرض المستند مع إمكانية الطباعة' },
        { value: 'Full', label: 'صلاحيات كاملة', description: 'عرض وطباعة وتحميل المستند' },
    ];

    const confidentialityLabels = {
        0: { label: 'عام', color: 'success', icon: '🟢' },
        1: { label: 'داخلي', color: 'info', icon: '🔵' },
        2: { label: 'سري', color: 'warning', icon: '🟡' },
        3: { label: 'سري للغاية', color: 'danger', icon: '🟠' },
        4: { label: 'سري جداً', color: 'danger', icon: '🔴' },
    };

    const isCrossDepartment = documentInfo?.department !== requesterDepartment;

    const getRequiredApprovalLevels = () => {
        let baseLevel = documentInfo?.confidentialityLevel || 0;

        // إضافة مستوى للوصول عبر الإدارات
        if (isCrossDepartment) {
            baseLevel = Math.min(baseLevel + 1, 5);
        }

        // إضافة مستوى للصلاحيات الكاملة
        if (formData.accessType === 'Full') {
            baseLevel = Math.min(baseLevel + 1, 5);
        }

        return baseLevel;
    };

    const getApprovalChain = () => {
        const levels = getRequiredApprovalLevels();
        const chain = [];

        if (levels >= 1) chain.push('المدير المباشر');
        if (levels >= 2) chain.push('مدير الإدارة');
        if (levels >= 3) chain.push('مسؤول الأمن');
        if (levels >= 4) chain.push('الإدارة التنفيذية');
        if (levels >= 5) chain.push('المدير العام');

        return chain;
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.businessPurpose.trim()) {
            setError('الغرض من الوصول مطلوب');
            return;
        }

        if (formData.businessPurpose.length < 20) {
            setError('يجب أن يكون الغرض من الوصول 20 حرف على الأقل');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onSubmit({
                documentId,
                accessType: formData.accessType,
                businessPurpose: formData.businessPurpose.trim(),
                requestedAccessStart: formData.requestedAccessStart || null,
                requestedAccessEnd: formData.requestedAccessEnd || null,
                priority: formData.priority,
                notes: formData.notes.trim() || null,
            });
            handleClose();
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء إرسال الطلب');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            accessType: 'View',
            businessPurpose: '',
            requestedAccessStart: '',
            requestedAccessEnd: '',
            priority: 'Normal',
            notes: '',
        });
        setError(null);
        onClose();
    };

    const level = documentInfo?.confidentialityLevel || 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="طلب الوصول لمستند سري"
            size="xl"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* معلومات المستند */}
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-red-900 text-lg">
                                    {documentInfo?.name || 'مستند سري'}
                                </h4>
                                <Badge variant={confidentialityLabels[level]?.color || 'danger'}>
                                    {confidentialityLabels[level]?.icon} {confidentialityLabels[level]?.label}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-red-600 dark:text-red-400">الباركود:</span>
                                    <span className="font-mono text-red-900 mr-1">{documentInfo?.barcode}</span>
                                </div>
                                <div>
                                    <span className="text-red-600 dark:text-red-400">الإدارة المالكة:</span>
                                    <span className="text-red-900 mr-1">{documentInfo?.department}</span>
                                </div>
                                {documentInfo?.ownerName && (
                                    <div className="col-span-2">
                                        <span className="text-red-600 dark:text-red-400">مالك المستند:</span>
                                        <span className="text-red-900 mr-1">{documentInfo.ownerName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isCrossDepartment && (
                        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                                هذا المستند من إدارة أخرى ({documentInfo?.department}) - يتطلب موافقات إضافية
                            </span>
                        </div>
                    )}
                </div>

                {/* نوع الوصول */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                        نوع الوصول المطلوب <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {accessTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => handleChange('accessType', type.value)}
                                className={`p-4 rounded-xl border-2 text-right transition-all ${
                                    formData.accessType === type.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <p className={`font-semibold ${formData.accessType === type.value ? 'text-blue-700' : 'text-gray-900 dark:text-white'}`}>
                                    {type.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {type.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* الغرض من الوصول */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        الغرض من الوصول <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.businessPurpose}
                        onChange={(e) => handleChange('businessPurpose', e.target.value)}
                        placeholder="اشرح بالتفصيل سبب حاجتك للوصول لهذا المستند والغرض من استخدامه..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                        required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        الحد الأدنى 20 حرف - {formData.businessPurpose.length}/4000
                    </p>
                </div>

                {/* فترة الوصول */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        فترة الوصول المطلوبة (اختياري)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">من تاريخ</label>
                            <input
                                type="datetime-local"
                                value={formData.requestedAccessStart}
                                onChange={(e) => handleChange('requestedAccessStart', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">إلى تاريخ</label>
                            <input
                                type="datetime-local"
                                value={formData.requestedAccessEnd}
                                onChange={(e) => handleChange('requestedAccessEnd', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        إذا لم تحدد فترة، سيتم منح الوصول لمدة 7 أيام افتراضياً
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
                                onClick={() => handleChange('priority', option.value)}
                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                                    formData.priority === option.value
                                        ? option.color + ' border-current font-semibold'
                                        : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* سلسلة الموافقات */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        سلسلة الاعتمادات المطلوبة ({getRequiredApprovalLevels()} مستوى)
                    </h5>
                    <div className="flex items-center gap-2 flex-wrap">
                        {getApprovalChain().map((approver, index) => (
                            <div key={index} className="flex items-center">
                                <span className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200">
                                    {index + 1}. {approver}
                                </span>
                                {index < getApprovalChain().length - 1 && (
                                    <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* تنبيهات */}
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-semibold mb-1">ملاحظات مهمة:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>سيتم إشعار مالك المستند بطلب الوصول</li>
                                <li>جميع عمليات الوصول ستسجل في سجل التدقيق الأمني</li>
                                <li>قد يستغرق الاعتماد عدة أيام حسب عدد المستويات</li>
                                <li>يمكن إلغاء الوصول في أي وقت من قبل المعتمدين</li>
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
                        disabled={loading || formData.businessPurpose.length < 20}
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
