import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ContentCard, Badge, Button, Tabs, TabPanel, EmptyState, LoadingSpinner } from '../ui';
import { LEGACY_RECORD_TYPES, MODULE_NAMES, MODULE_ICONS } from '../../lib/legacy-record-types';
import LegacyDataBanner from './LegacyDataBanner';
import LegacyRecordsTable from './LegacyRecordsTable';
import LegacyRecordDetail from './LegacyRecordDetail';
import LegacyImportWizard from './LegacyImportWizard';
import LegacyImportHistory from './LegacyImportHistory';

// أيقونات SVG مدمجة
const ICONS = {
    document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    tag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
    server: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    upload: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
};

/** أيقونة SVG عامة */
const Icon = ({ path, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{path}</svg>
);

// تعريف التبويبات
const TAB_DEFINITIONS = [
    { id: 'records', label: 'السجلات التاريخية' },
    { id: 'import', label: 'استيراد البيانات' },
    { id: 'history', label: 'سجل العمليات' },
];

// ألوان بطاقات الإحصائيات
const STAT_COLORS = [
    { dark: 'bg-blue-900/30 text-blue-400', light: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
    { dark: 'bg-purple-900/30 text-purple-400', light: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
    { dark: 'bg-green-900/30 text-green-400', light: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
    { dark: 'bg-amber-900/30 text-amber-400', light: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
];

/** بطاقة إحصائية مصغرة */
const StatMiniCard = ({ icon, label, value, colorIdx, darkMode, cardBg, textPrimary, textSecondary }) => (
    <div className={`rounded-xl border p-4 ${cardBg}`}>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? STAT_COLORS[colorIdx].dark : STAT_COLORS[colorIdx].light}`}>
                <Icon path={icon} />
            </div>
            <div className="min-w-0">
                <p className={`text-xs ${textSecondary}`}>{label}</p>
                <p className={`text-lg font-bold ${textPrimary} truncate`}>{value}</p>
            </div>
        </div>
    </div>
);

/** شريحة فلتر (Chip) */
const FilterChip = ({ active, darkMode, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            active
                ? 'bg-blue-600 text-white border-blue-600'
                : darkMode
                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }`}
    >
        {children}
    </button>
);

/**
 * LegacySystemSetup - صفحة إعداد البيانات التاريخية المشتركة
 * تُستخدم من جميع الوحدات (HR, Warehouse, Finance, Movement)
 * لعرض وإدارة السجلات المنقولة من الأنظمة السابقة
 */
export default function LegacySystemSetup({ moduleType, darkMode = false }) {
    // ======== الحالة ========
    const [activeTab, setActiveTab] = useState('records');
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecordType, setSelectedRecordType] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showImportWizard, setShowImportWizard] = useState(false);

    // أنواع السجلات للوحدة الحالية
    const recordTypes = useMemo(() => LEGACY_RECORD_TYPES[moduleType] || [], [moduleType]);

    // ======== جلب البيانات ========
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [recordsRes, statsRes] = await Promise.all([
                fetch(`/api/legacy-records/${encodeURIComponent(moduleType)}`),
                fetch(`/api/legacy-records/stats?module=${encodeURIComponent(moduleType)}`),
            ]);
            if (!recordsRes.ok) throw new Error('فشل في جلب السجلات التاريخية');
            if (!statsRes.ok) throw new Error('فشل في جلب الإحصائيات');
            const recordsData = await recordsRes.json();
            const statsData = await statsRes.json();
            setRecords(Array.isArray(recordsData) ? recordsData : recordsData.records || []);
            setStats(statsData);
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
        }
    }, [moduleType]);

    // جلب البيانات عند التحميل أو تغيير الوحدة
    useEffect(() => { fetchData(); }, [fetchData]);

    // السجلات المفلترة حسب النوع المختار
    const filteredRecords = useMemo(() => {
        if (!selectedRecordType) return records;
        return records.filter((r) => r.recordType === selectedRecordType);
    }, [records, selectedRecordType]);

    // أسماء أنواع السجلات للجدول
    const recordTypeNames = useMemo(() => recordTypes.map((rt) => rt.name), [recordTypes]);

    // ======== معالجات الأحداث ========
    const handleRecordClick = useCallback((record) => {
        setSelectedRecord(record);
        setShowDetailModal(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setShowDetailModal(false);
        setSelectedRecord(null);
    }, []);

    const handleImportComplete = useCallback(() => {
        setShowImportWizard(false);
        fetchData();
    }, [fetchData]);

    const handleFilterToggle = useCallback((typeId) => {
        setSelectedRecordType((prev) => (prev === typeId ? null : typeId));
    }, []);

    // تنسيق التاريخ بالعربية
    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    }, []);

    // تبويبات Tabs
    const tabs = useMemo(() => TAB_DEFINITIONS.map((t) => ({ id: t.id, label: t.label })), []);

    // الكلاسات المشتركة
    const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900 dark:text-white';
    const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

    // حالة التحميل
    if (loading) {
        return (
            <div dir="rtl" className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // حالة الخطأ
    if (error) {
        return (
            <div dir="rtl" className="py-10">
                <EmptyState
                    title="حدث خطأ"
                    description={error}
                    action={<Button variant="primary" size="md" onClick={fetchData}>إعادة المحاولة</Button>}
                />
            </div>
        );
    }

    // بيانات بطاقات الإحصائيات
    const statCards = [
        { icon: ICONS.document, label: 'إجمالي السجلات', value: (stats?.totalRecords ?? records.length).toLocaleString('ar-SA') },
        { icon: ICONS.tag, label: 'أنواع السجلات', value: (stats?.recordTypesCount ?? recordTypes.length).toLocaleString('ar-SA') },
        { icon: ICONS.server, label: 'النظام المصدر', value: stats?.sourceSystem || 'غير محدد' },
        { icon: ICONS.calendar, label: 'آخر استيراد', value: formatDate(stats?.lastImportDate) },
    ];

    return (
        <div dir="rtl" className="space-y-6">
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((sc, idx) => (
                    <StatMiniCard
                        key={sc.label}
                        icon={sc.icon}
                        label={sc.label}
                        value={sc.value}
                        colorIdx={idx}
                        darkMode={darkMode}
                        cardBg={cardBg}
                        textPrimary={textPrimary}
                        textSecondary={textSecondary}
                    />
                ))}
            </div>

            {/* التبويبات */}
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="default"
                aria-label={`تبويبات البيانات التاريخية - ${MODULE_NAMES[moduleType] || moduleType}`}
            />

            {/* التبويب الأول: السجلات التاريخية */}
            {activeTab === 'records' && (
                <div className="space-y-4">
                    <LegacyDataBanner
                        sourceSystem={stats?.sourceSystem || 'النظام السابق'}
                        importDate={stats?.lastImportDate}
                        recordCount={stats?.totalRecords ?? records.length}
                        darkMode={darkMode}
                    />
                    {/* فلتر أنواع السجلات */}
                    {recordTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <FilterChip active={!selectedRecordType} darkMode={darkMode} onClick={() => setSelectedRecordType(null)}>
                                الكل
                            </FilterChip>
                            {recordTypes.map((rt) => (
                                <FilterChip key={rt.id} active={selectedRecordType === rt.id} darkMode={darkMode} onClick={() => handleFilterToggle(rt.id)}>
                                    <span>{rt.icon}</span>
                                    <span>{rt.name}</span>
                                </FilterChip>
                            ))}
                        </div>
                    )}
                    <ContentCard className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        <LegacyRecordsTable
                            records={filteredRecords}
                            recordTypes={recordTypeNames}
                            moduleType={moduleType}
                            darkMode={darkMode}
                            onRecordClick={handleRecordClick}
                        />
                    </ContentCard>
                </div>
            )}

            {/* التبويب الثاني: استيراد البيانات */}
            {activeTab === 'import' && (
                <div className="space-y-4">
                    <ContentCard className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                                <Icon path={ICONS.upload} className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${textPrimary}`}>
                                    استيراد بيانات {MODULE_NAMES[moduleType] || moduleType}
                                </h3>
                                <p className={`text-sm mt-1 ${textSecondary}`}>
                                    استيراد السجلات التاريخية من النظام السابق عبر ملفات Excel أو CSV
                                </p>
                            </div>
                            <Button variant="primary" size="lg" onClick={() => setShowImportWizard(true)}>
                                بدء الاستيراد
                            </Button>
                        </div>
                    </ContentCard>
                    <LegacyImportWizard
                        moduleType={moduleType}
                        isOpen={showImportWizard}
                        onClose={() => setShowImportWizard(false)}
                        onImportComplete={handleImportComplete}
                        darkMode={darkMode}
                    />
                </div>
            )}

            {/* التبويب الثالث: سجل العمليات */}
            {activeTab === 'history' && (
                <LegacyImportHistory moduleType={moduleType} darkMode={darkMode} />
            )}

            {/* نافذة تفاصيل السجل */}
            <LegacyRecordDetail
                record={selectedRecord}
                isOpen={showDetailModal}
                onClose={handleCloseDetail}
                darkMode={darkMode}
            />
        </div>
    );
}

LegacySystemSetup.propTypes = {
    /** نوع الوحدة: hr, warehouse, finance, movement */
    moduleType: PropTypes.string.isRequired,
    /** الوضع الداكن */
    darkMode: PropTypes.bool,
};
