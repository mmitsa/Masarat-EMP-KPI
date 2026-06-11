/**
 * نموذج قرار الإجازة
 * Leave Decision Form Component
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
    CheckCircleIcon,
    PlusIcon,
    XMarkIcon,
    ListBulletIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Input, Select, Badge } from '../../../ui';
import { getLeaveTypeName } from '../../../../constants/leave-types';
import {
    getArticlesForLeaveType,
    getDefaultArticlesForType,
    getClausesForLeaveType,
    getDefaultClausesForType,
    CLAUSE_CATEGORIES,
} from '../../../../constants/leave-decision-articles';
import { formatDateArabic } from '../../../../utils/hr-helpers';
import api from '../../../../lib/api';

const LeaveDecisionForm = ({
    onGenerate,
    loading = false,
    selectedLeave: externalSelectedLeave = null,
    onLeaveSelect,
}) => {
    // بيانات النموذج
    const [formData, setFormData] = useState({
        leaveId: '',
        decisionNumber: '',
        decisionDate: new Date().toISOString().split('T')[0],
        authorityId: '',
        articleIds: [],
        clauseIds: [],
        customClauses: [],
    });

    // بيانات مرجعية
    const [approvedLeaves, setApprovedLeaves] = useState([]);
    const [authorities, setAuthorities] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // حالة البند المخصص
    const [showCustomClauseInput, setShowCustomClauseInput] = useState(false);
    const [customClauseText, setCustomClauseText] = useState('');

    // تحميل البيانات
    useEffect(() => {
        loadFormData();
    }, []);

    // ربط الإجازة الخارجية
    useEffect(() => {
        if (externalSelectedLeave) {
            setFormData(prev => ({
                ...prev,
                leaveId: externalSelectedLeave.id?.toString() || '',
            }));
        }
    }, [externalSelectedLeave]);

    const fetchApprovedLeaves = async () => {
        try {
            const res = await fetch('/api/hr/leaves?status=approved');
            const data = await res.json();
            if (data.success) return data.data || [];
            return [];
        } catch { return []; }
    };

    const loadFormData = async () => {
        setLoadingData(true);
        try {
            const leavesList = await fetchApprovedLeaves();
            setApprovedLeaves(leavesList);
            setAuthorities([]);

            setFormData(prev => ({
                ...prev,
                decisionNumber: generateDecisionNumber(),
            }));
        } catch (err) {
            console.error('Error loading form data:', err);
            setApprovedLeaves([]);
            setAuthorities([]);
        } finally {
            setLoadingData(false);
        }
    };

    // الإجازة المختارة
    const selectedLeave = useMemo(() => {
        return externalSelectedLeave || approvedLeaves.find(l => l.id?.toString() === formData.leaveId?.toString());
    }, [formData.leaveId, approvedLeaves, externalSelectedLeave]);

    // المواد القانونية حسب نوع الإجازة
    const availableArticles = useMemo(() => {
        if (!selectedLeave?.leave_type) return [];
        return getArticlesForLeaveType(selectedLeave.leave_type);
    }, [selectedLeave]);

    // البنود حسب نوع الإجازة
    const availableClauses = useMemo(() => {
        if (!selectedLeave?.leave_type) return [];
        return getClausesForLeaveType(selectedLeave.leave_type);
    }, [selectedLeave]);

    // اختيار المواد والبنود الافتراضية عند تغيير الإجازة
    useEffect(() => {
        if (selectedLeave?.leave_type) {
            const defaultArticles = getDefaultArticlesForType(selectedLeave.leave_type);
            const defaultClauses = getDefaultClausesForType(selectedLeave.leave_type);

            setFormData(prev => ({
                ...prev,
                articleIds: defaultArticles.map(a => a.id),
                clauseIds: defaultClauses.map(c => c.id),
            }));
        }
    }, [selectedLeave?.leave_type]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'leaveId' && value) {
            const leave = approvedLeaves.find(l => l.id?.toString() === value);
            if (leave && onLeaveSelect) {
                onLeaveSelect(leave);
            }
            setFormData(prev => ({ ...prev, [field]: value, decisionNumber: generateDecisionNumber() }));
        }
    };

    // تبديل مادة
    const toggleArticle = useCallback((articleId) => {
        setFormData(prev => ({
            ...prev,
            articleIds: prev.articleIds.includes(articleId)
                ? prev.articleIds.filter(id => id !== articleId)
                : [...prev.articleIds, articleId],
        }));
    }, []);

    // تبديل بند
    const toggleClause = useCallback((clauseId) => {
        setFormData(prev => ({
            ...prev,
            clauseIds: prev.clauseIds.includes(clauseId)
                ? prev.clauseIds.filter(id => id !== clauseId)
                : [...prev.clauseIds, clauseId],
        }));
    }, []);

    // إضافة بند مخصص
    const addCustomClause = () => {
        if (!customClauseText.trim()) return;
        setFormData(prev => ({
            ...prev,
            customClauses: [...prev.customClauses, {
                id: `custom-${Date.now()}`,
                text: customClauseText.trim(),
            }],
        }));
        setCustomClauseText('');
        setShowCustomClauseInput(false);
    };

    // حذف بند مخصص
    const removeCustomClause = (id) => {
        setFormData(prev => ({
            ...prev,
            customClauses: prev.customClauses.filter(c => c.id !== id),
        }));
    };

    // توليد القرار
    const handleGenerate = () => {
        if (!formData.leaveId || !formData.authorityId) return;

        const selectedArticles = availableArticles.filter(a => formData.articleIds.includes(a.id));
        const selectedClauses = availableClauses.filter(c => formData.clauseIds.includes(c.id));
        const authority = authorities.find(a => a.id?.toString() === formData.authorityId?.toString());

        onGenerate?.({
            ...formData,
            leave: selectedLeave,
            authority,
            articles: selectedArticles,
            clauses: [...selectedClauses, ...formData.customClauses],
        });
    };

    // خيارات الإجازات
    const leaveOptions = [
        { value: '', label: 'اختر الإجازة المعتمدة...' },
        ...approvedLeaves.map(leave => ({
            value: leave.id?.toString(),
            label: `${leave.employee?.fullName || leave.employee?.nameAr} - ${getLeaveTypeName(leave.leave_type)} (${formatDateArabic(leave.start_date)})`,
        })),
    ];

    // خيارات أصحاب الصلاحية
    const authorityOptions = [
        { value: '', label: 'اختر صاحب الصلاحية...' },
        ...authorities.map(auth => ({
            value: auth.id?.toString(),
            label: `${auth.fullName || auth.nameAr} - ${auth.position}`,
        })),
    ];

    if (loadingData) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
                </div>
            </ContentCard>
        );
    }

    return (
        <ContentCard
            title="إعداد قرار الإجازة"
            icon={<DocumentTextIcon className="w-5 h-5" />}
        >
            <div className="space-y-6">
                {/* اختيار الإجازة */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        <CalendarIcon className="w-4 h-4 inline ml-1" />
                        الإجازة المعتمدة <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.leaveId}
                        onChange={(e) => handleChange('leaveId', e.target.value)}
                        options={leaveOptions}
                    />
                </div>

                {/* معلومات الموظف المختار */}
                {selectedLeave && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">بيانات الموظف والإجازة</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500 dark:text-gray-400">الاسم:</span> <span className="font-medium">{selectedLeave.employee?.fullName || selectedLeave.employee?.nameAr}</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">الرقم الوظيفي:</span> <span className="font-medium">{selectedLeave.employee?.employeeNumber}</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">نوع الإجازة:</span> <Badge variant="primary" size="sm">{getLeaveTypeName(selectedLeave.leave_type)}</Badge></div>
                            <div><span className="text-gray-500 dark:text-gray-400">عدد الأيام:</span> <span className="font-medium">{selectedLeave.days} أيام</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">من:</span> <span className="font-medium">{formatDateArabic(selectedLeave.start_date)}</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">إلى:</span> <span className="font-medium">{formatDateArabic(selectedLeave.end_date)}</span></div>
                        </div>
                    </div>
                )}

                {/* رقم القرار والتاريخ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">رقم القرار</label>
                        <Input
                            value={formData.decisionNumber}
                            onChange={(e) => handleChange('decisionNumber', e.target.value)}
                            placeholder="رقم القرار"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">تاريخ القرار</label>
                        <Input
                            type="date"
                            value={formData.decisionDate}
                            onChange={(e) => handleChange('decisionDate', e.target.value)}
                        />
                    </div>
                </div>

                {/* صاحب الصلاحية */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        صاحب الصلاحية <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.authorityId}
                        onChange={(e) => handleChange('authorityId', e.target.value)}
                        options={authorityOptions}
                    />
                </div>

                {/* السند النظامي - المواد القانونية */}
                {selectedLeave && availableArticles.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            <BookOpenIcon className="w-4 h-4 inline ml-1" />
                            السند النظامي (المواد القانونية)
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                            {availableArticles.map(article => (
                                <label
                                    key={article.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                        formData.articleIds.includes(article.id)
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                            : 'bg-gray-50 dark:bg-gray-800 border border-transparent hover:bg-gray-100'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.articleIds.includes(article.id)}
                                        onChange={() => toggleArticle(article.id)}
                                        className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-400 rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" size="sm">المادة {article.number}</Badge>
                                            {article.leaveType === 'all' && (
                                                <Badge variant="gray" size="sm">عام</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{article.text}</p>
                                        {article.reference && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{article.reference}</p>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formData.articleIds.length} مادة مختارة من {availableArticles.length}
                        </p>
                    </div>
                )}

                {/* بنود القرار */}
                {selectedLeave && availableClauses.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            <ListBulletIcon className="w-4 h-4 inline ml-1" />
                            بنود القرار
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                            {availableClauses.map(clause => {
                                const catInfo = CLAUSE_CATEGORIES[clause.category];
                                return (
                                    <label
                                        key={clause.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                            formData.clauseIds.includes(clause.id)
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                : 'bg-gray-50 dark:bg-gray-800 border border-transparent hover:bg-gray-100'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.clauseIds.includes(clause.id)}
                                            onChange={() => toggleClause(clause.id)}
                                            className="mt-1 w-4 h-4 text-green-600 dark:text-green-400 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            {catInfo && (
                                                <Badge variant="outline" size="sm" className="mb-1">{catInfo.name}</Badge>
                                            )}
                                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{clause.text}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* البنود المخصصة */}
                        {formData.customClauses.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">بنود مخصصة:</p>
                                {formData.customClauses.map(clause => (
                                    <div key={clause.id} className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">{clause.text}</p>
                                        <button
                                            onClick={() => removeCustomClause(clause.id)}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* إضافة بند مخصص */}
                        {showCustomClauseInput ? (
                            <div className="mt-3 flex gap-2">
                                <textarea
                                    value={customClauseText}
                                    onChange={(e) => setCustomClauseText(e.target.value)}
                                    placeholder="أدخل نص البند المخصص..."
                                    rows={2}
                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                                <div className="flex flex-col gap-1">
                                    <Button variant="primary" size="sm" onClick={addCustomClause}>
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setShowCustomClauseInput(false); setCustomClauseText(''); }}>
                                        <XMarkIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => setShowCustomClauseInput(true)}
                                icon={<PlusIcon className="w-4 h-4" />}
                            >
                                إضافة بند مخصص
                            </Button>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formData.clauseIds.length + formData.customClauses.length} بند مختار
                        </p>
                    </div>
                )}

                {/* زر التوليد */}
                <div className="flex justify-end pt-4 border-t">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleGenerate}
                        disabled={!formData.leaveId || !formData.authorityId || loading}
                        icon={loading
                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <CheckCircleIcon className="w-5 h-5" />
                        }
                    >
                        {loading ? 'جاري التوليد...' : 'توليد قرار الإجازة'}
                    </Button>
                </div>
            </div>
        </ContentCard>
    );
};

// توليد رقم القرار
function generateDecisionNumber() {
    const year = new Date().getFullYear();
    const seq = Date.now().toString().slice(-6);
    return `LD-${year}-${seq}`;
}

export default LeaveDecisionForm;
