/**
 * نموذج قرار الانتداب
 * Secondment Decision Form Component
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
    MapPinIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Button, Input, Select, Badge } from '../../../ui';
import { formatDateArabic } from '../../../../utils/hr-helpers';
import {
    SECONDMENT_ARTICLES,
    SECONDMENT_CLAUSES,
    SECONDMENT_CLAUSE_CATEGORIES,
    SECONDMENT_TYPES,
    getDefaultSecondmentArticles,
    getDefaultSecondmentClauses,
} from '../../../../constants/secondment-decision-articles';
import api from '../../../../lib/api';
import { useWallet } from '../../../../context/WalletContext';
import { WalletCostEstimator } from '../../../wallet';
import { estimateSecondmentCost } from '../../../../lib/walletData';

const SecondmentDecisionForm = ({
    onGenerate,
    loading = false,
}) => {
    // بيانات النموذج
    const [formData, setFormData] = useState({
        employeeId: '',
        decisionNumber: '',
        decisionDate: new Date().toISOString().split('T')[0],
        authorityId: '',
        // بيانات الانتداب
        secondmentType: 'internal',
        destination: '',
        city: '',
        mission: '',
        startDate: '',
        endDate: '',
        dailyAllowance: '',
        // المواد والبنود
        articleIds: [],
        clauseIds: [],
        customClauses: [],
    });

    // بيانات مرجعية
    const [employees, setEmployees] = useState([]);
    const [authorities, setAuthorities] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // حالة البند المخصص
    const [showCustomClauseInput, setShowCustomClauseInput] = useState(false);
    const [customClauseText, setCustomClauseText] = useState('');

    // حالة تجاوز صاحب الصلاحية (المحفظة)
    const [authorityOverride, setAuthorityOverride] = useState(false);

    // المحفظة
    const { wallet, commitFunds, canIssueDecision } = useWallet();

    // تحميل البيانات
    useEffect(() => {
        loadFormData();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/hr/employees');
            const data = await res.json();
            if (data.success) return (data.data || []).map(e => ({
                id: e.id,
                name: e.nameAr || e.name,
                fullName: e.nameAr || e.name,
                nameAr: e.nameAr || e.name,
                nationalId: e.nationalId,
                position: e.jobTitle || e.position || '',
                department: e.departmentName || e.department || '',
                grade: e.grade || '',
                employeeNumber: e.employeeNumber || e.employee_number || '',
            }));
            return [];
        } catch { return []; }
    };

    const loadFormData = async () => {
        setLoadingData(true);
        try {
            const empList = await fetchEmployees();
            setEmployees(empList);
            setAuthorities([]);

            setFormData(prev => ({
                ...prev,
                decisionNumber: generateDecisionNumber(),
            }));
        } catch (err) {
            console.error('Error loading form data:', err);
            setEmployees([]);
            setAuthorities([]);
        } finally {
            setLoadingData(false);
        }
    };

    // الموظف المختار
    const selectedEmployee = useMemo(() => {
        return employees.find(e => e.id?.toString() === formData.employeeId?.toString());
    }, [formData.employeeId, employees]);

    // حساب التكلفة التقديرية للانتداب
    const estimatedCost = useMemo(() => {
        if (!formData.dailyAllowance || !formData.startDate || !formData.endDate) return 0;
        return estimateSecondmentCost(
            Number(formData.dailyAllowance),
            formData.startDate,
            formData.endDate
        );
    }, [formData.dailyAllowance, formData.startDate, formData.endDate]);

    // التحقق من رصيد المحفظة
    const walletCheck = useMemo(() => {
        if (!estimatedCost || estimatedCost <= 0) return null;
        return canIssueDecision(estimatedCost);
    }, [estimatedCost, canIssueDecision]);

    // المواد القانونية
    const availableArticles = useMemo(() => {
        return SECONDMENT_ARTICLES;
    }, []);

    // البنود
    const availableClauses = useMemo(() => {
        return SECONDMENT_CLAUSES;
    }, []);

    // اختيار المواد والبنود الافتراضية عند تغيير الموظف
    useEffect(() => {
        if (selectedEmployee) {
            const defaultArticles = getDefaultSecondmentArticles();
            const defaultClauses = getDefaultSecondmentClauses();

            setFormData(prev => ({
                ...prev,
                articleIds: defaultArticles.map(a => a.id),
                clauseIds: defaultClauses.map(c => c.id),
            }));
        }
    }, [selectedEmployee?.id]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'employeeId' && value) {
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

    // توليد القرار مع ربط المحفظة
    const handleGenerate = async () => {
        if (!formData.employeeId || !formData.authorityId) return;
        if (walletCheck && !walletCheck.allowed && !authorityOverride) return;

        const selectedArticles = availableArticles.filter(a => formData.articleIds.includes(a.id));
        const selectedClauses = availableClauses.filter(c => formData.clauseIds.includes(c.id));
        const authority = authorities.find(a => a.id?.toString() === formData.authorityId?.toString());

        // خصم من المحفظة عند الإصدار - يجب النجاح قبل إصدار القرار
        if (estimatedCost > 0 && wallet) {
            const result = await commitFunds(
                estimatedCost,
                'secondment',
                formData.decisionNumber,
                `انتداب - ${selectedEmployee?.fullName || selectedEmployee?.nameAr} - ${formData.destination || formData.city}`,
                authorityOverride
            );
            if (!result?.success) {
                // فشل الخصم - لا يتم إصدار القرار
                return;
            }
        }

        onGenerate?.({
            ...formData,
            employee: selectedEmployee,
            authority,
            articles: selectedArticles,
            clauses: [...selectedClauses, ...formData.customClauses],
            walletCommitAmount: estimatedCost,
            authorityOverride,
        });
    };

    // خيارات الموظفين
    const employeeOptions = [
        { value: '', label: 'اختر الموظف...' },
        ...employees.map(emp => ({
            value: emp.id?.toString(),
            label: `${emp.fullName || emp.nameAr} - ${emp.position}`,
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

    // خيارات نوع الانتداب
    const secondmentTypeOptions = Object.entries(SECONDMENT_TYPES).map(([key, val]) => ({
        value: key,
        label: val.label,
    }));

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
            title="إعداد قرار الانتداب"
            icon={<DocumentTextIcon className="w-5 h-5" />}
        >
            <div className="space-y-6">
                {/* اختيار الموظف */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        <UserIcon className="w-4 h-4 inline ml-1" />
                        الموظف <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.employeeId}
                        onChange={(e) => handleChange('employeeId', e.target.value)}
                        options={employeeOptions}
                    />
                </div>

                {/* معلومات الموظف المختار */}
                {selectedEmployee && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">بيانات الموظف</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500 dark:text-gray-400">الاسم:</span> <span className="font-medium">{selectedEmployee.fullName || selectedEmployee.nameAr}</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">الرقم الوظيفي:</span> <span className="font-medium">{selectedEmployee.employeeNumber}</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">المسمى الوظيفي:</span> <span className="font-medium">{selectedEmployee.position}</span></div>
                            <div><span className="text-gray-500 dark:text-gray-400">الإدارة:</span> <span className="font-medium">{selectedEmployee.department}</span></div>
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

                {/* تفاصيل الانتداب */}
                {selectedEmployee && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPinIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">تفاصيل الانتداب</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* نوع الانتداب */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">نوع الانتداب</label>
                                <Select
                                    value={formData.secondmentType}
                                    onChange={(e) => handleChange('secondmentType', e.target.value)}
                                    options={secondmentTypeOptions}
                                />
                            </div>

                            {/* جهة الانتداب */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    <BuildingOfficeIcon className="w-4 h-4 inline ml-1" />
                                    جهة الانتداب
                                </label>
                                <Input
                                    value={formData.destination}
                                    onChange={(e) => handleChange('destination', e.target.value)}
                                    placeholder="اسم الجهة المنتدب إليها"
                                />
                            </div>

                            {/* المدينة */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">المدينة</label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    placeholder="المدينة"
                                />
                            </div>

                            {/* البدل اليومي */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">البدل اليومي (ريال)</label>
                                <Input
                                    type="number"
                                    value={formData.dailyAllowance}
                                    onChange={(e) => handleChange('dailyAllowance', e.target.value)}
                                    placeholder="مبلغ البدل اليومي"
                                />
                            </div>

                            {/* تاريخ البداية */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    <CalendarIcon className="w-4 h-4 inline ml-1" />
                                    تاريخ البداية
                                </label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                            </div>

                            {/* تاريخ النهاية */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    <CalendarIcon className="w-4 h-4 inline ml-1" />
                                    تاريخ النهاية
                                </label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>

                            {/* المهمة - عرض كامل */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">المهمة</label>
                                <textarea
                                    value={formData.mission}
                                    onChange={(e) => handleChange('mission', e.target.value)}
                                    placeholder="وصف مهمة الانتداب..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* السند النظامي - المواد القانونية */}
                {selectedEmployee && availableArticles.length > 0 && (
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
                                            {article.category === 'labor_law' && (
                                                <Badge variant="gray" size="sm">نظام العمل</Badge>
                                            )}
                                            {article.category === 'civil_service' && (
                                                <Badge variant="gray" size="sm">الخدمة المدنية</Badge>
                                            )}
                                            {article.category === 'internal' && (
                                                <Badge variant="gray" size="sm">لائحة داخلية</Badge>
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
                {selectedEmployee && availableClauses.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            <ListBulletIcon className="w-4 h-4 inline ml-1" />
                            بنود القرار
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                            {availableClauses.map(clause => {
                                const catInfo = SECONDMENT_CLAUSE_CATEGORIES[clause.category];
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

                {/* مقدّر تكلفة المحفظة */}
                {selectedEmployee && estimatedCost > 0 && (
                    <WalletCostEstimator
                        estimatedCost={estimatedCost}
                        referenceType="secondment"
                        authorityOverride={authorityOverride}
                        onAuthorityOverrideChange={setAuthorityOverride}
                    />
                )}

                {/* زر التوليد */}
                <div className="flex justify-end pt-4 border-t">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleGenerate}
                        disabled={!formData.employeeId || !formData.authorityId || loading || (walletCheck && !walletCheck.allowed && !authorityOverride)}
                        icon={loading
                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <CheckCircleIcon className="w-5 h-5" />
                        }
                    >
                        {loading ? 'جاري التوليد...' : 'توليد قرار الانتداب'}
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
    return `SD-${year}-${seq}`;
}

export default SecondmentDecisionForm;
