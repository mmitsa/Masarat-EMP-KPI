/**
 * DataMapperImport - مكون استيراد البيانات العام مع ربط الحقول
 * ═══════════════════════════════════════════════════════════════
 *
 * Workflow:
 *   الخطوة 1: اختيار نوع البيانات (الجدول الهدف)
 *   الخطوة 2: رفع ملف Excel
 *   الخطوة 3: ربط أعمدة الملف بأعمدة النظام (Data Mapping)
 *   الخطوة 4: معاينة ← تنفيذ ← نتيجة
 *
 * Props:
 *   onComplete(summary) - callback بعد الانتهاء
 *   preSelectedTable    - جدول محدد مسبقاً (اختياري)
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// ══════════════════════════════════════════════════════
// أيقونات SVG مبسطة
// ══════════════════════════════════════════════════════
const Icons = {
  upload: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  arrowLeft: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.562a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.657" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  file: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
};

// ══════════════════════════════════════════════════════
// الخطوات
// ══════════════════════════════════════════════════════
const STEPS = [
  { id: 'select',   labelAr: 'اختيار النوع',  labelEn: 'Select Type' },
  { id: 'upload',   labelAr: 'رفع الملف',     labelEn: 'Upload File' },
  { id: 'mapping',  labelAr: 'ربط الحقول',    labelEn: 'Map Fields' },
  { id: 'execute',  labelAr: 'التنفيذ',       labelEn: 'Execute' },
];

export default function DataMapperImport({ onComplete, preSelectedTable }) {
  // ── الحالة ──
  const [currentStep, setCurrentStep] = useState(preSelectedTable ? 1 : 0);
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState(null);
  const [selectedTableKey, setSelectedTableKey] = useState(preSelectedTable || '');
  const [selectedTableDef, setSelectedTableDef] = useState(null);

  // بيانات الملف
  const [fileData, setFileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ربط الحقول: { excelHeader: systemField }
  const [mapping, setMapping] = useState({});

  // التنفيذ
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [dryRunResult, setDryRunResult] = useState(null);

  const fileInputRef = useRef(null);

  // ══════════════════════════════════════════════════════
  // 1. جلب قائمة الجداول
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    setTablesLoading(true);
    setTablesError(null);
    fetch('/api/import/table-schema', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.success && d.data) {
          setTables(d.data);
        } else {
          setTablesError(d.error || 'لم يتم العثور على جداول');
        }
      })
      .catch(err => {
        console.error('Failed to load tables:', err);
        setTablesError('فشل تحميل أنواع البيانات: ' + err.message);
      })
      .finally(() => setTablesLoading(false));
  }, []);

  // ══════════════════════════════════════════════════════
  // 2. جلب تعريف الجدول المحدد
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    if (!selectedTableKey) return;
    fetch(`/api/import/table-schema?key=${selectedTableKey}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setSelectedTableDef(d.data); })
      .catch(console.error);
  }, [selectedTableKey]);

  // ══════════════════════════════════════════════════════
  // 3. رفع الملف
  // ══════════════════════════════════════════════════════
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setFileData(null);
    setMapping({});

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/parse-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFileData(data.data);
        // محاولة الربط التلقائي
        if (selectedTableDef) {
          autoMapColumns(data.data.headers, selectedTableDef.columns);
        }
        setCurrentStep(2); // الانتقال لخطوة الربط
      } else {
        alert(data.message || 'فشل تحليل الملف');
      }
    } catch (err) {
      alert('خطأ في رفع الملف: ' + err.message);
    } finally {
      setUploading(false);
    }
  }, [selectedTableDef]);

  // ══════════════════════════════════════════════════════
  // 4. ربط تلقائي (Auto-Map)
  // ══════════════════════════════════════════════════════
  const autoMapColumns = useCallback((excelHeaders, systemColumns) => {
    const newMapping = {};

    excelHeaders.forEach(h => {
      const headerName = h.name.toLowerCase().trim();

      // بحث مطابقة بالاسم العربي أو الإنجليزي أو اسم الحقل
      const match = systemColumns.find(col => {
        const fieldLower = col.field.toLowerCase();
        const arLower = col.labelAr.toLowerCase();
        const enLower = col.labelEn.toLowerCase();

        return fieldLower === headerName
          || arLower === headerName
          || enLower === headerName
          || headerName.includes(arLower)
          || arLower.includes(headerName)
          || headerName.includes(enLower)
          || enLower.includes(headerName)
          || fieldLower.includes(headerName)
          || headerName.includes(fieldLower);
      });

      if (match) {
        newMapping[h.name] = match.field;
      }
    });

    setMapping(newMapping);
  }, []);

  // إعادة الربط التلقائي
  const handleAutoMap = useCallback(() => {
    if (fileData && selectedTableDef) {
      autoMapColumns(fileData.headers, selectedTableDef.columns);
    }
  }, [fileData, selectedTableDef, autoMapColumns]);

  // ══════════════════════════════════════════════════════
  // 5. تحديث ربط عمود
  // ══════════════════════════════════════════════════════
  const updateMapping = useCallback((excelCol, systemField) => {
    // مسح الكل
    if (excelCol === '__clear_all__') {
      setMapping({});
      return;
    }
    setMapping(prev => {
      const next = { ...prev };
      if (!systemField || systemField === '') {
        delete next[excelCol];
      } else {
        next[excelCol] = systemField;
      }
      return next;
    });
  }, []);

  // ══════════════════════════════════════════════════════
  // 6. التحقق قبل التنفيذ (Dry Run)
  // ══════════════════════════════════════════════════════
  const handleDryRun = useCallback(async () => {
    if (!fileData || !selectedTableKey) return;
    setExecuting(true);
    setDryRunResult(null);

    try {
      const res = await fetch('/api/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableKey: selectedTableKey,
          mapping,
          rows: fileData.sampleRows.slice(0, 5),
          options: { dryRun: true },
        }),
      });
      const data = await res.json();
      setDryRunResult(data);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setExecuting(false);
    }
  }, [fileData, selectedTableKey, mapping]);

  // ══════════════════════════════════════════════════════
  // 7. التنفيذ الفعلي
  // ══════════════════════════════════════════════════════
  const handleExecute = useCallback(async () => {
    if (!fileData || !selectedTableKey) return;
    setExecuting(true);
    setResult(null);
    setProgress(10);
    setCurrentStep(3);

    try {
      const fileInput = fileInputRef.current;
      const file = fileInput?.files?.[0];

      if (file) {
        // ═══ الطريقة الأفضل: إرسال الملف + الربط معاً في طلب واحد ═══
        // هذا يقرأ كل الصفوف من الملف على السيرفر مباشرة
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tableKey', selectedTableKey);
        formData.append('mapping', JSON.stringify(mapping));
        formData.append('options', JSON.stringify({ skipDuplicates: true }));

        setProgress(30);

        const execRes = await fetch('/api/import/parse-and-import', {
          method: 'POST',
          body: formData,
        });

        setProgress(80);
        const execData = await execRes.json();
        setProgress(100);
        setResult(execData);

        if (onComplete && execData.summary) {
          onComplete(execData.summary);
        }
      } else {
        // ═══ Fallback: استخدام البيانات المحملة مسبقاً (sampleRows فقط) ═══
        setProgress(40);

        const execRes = await fetch('/api/import/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableKey: selectedTableKey,
            mapping,
            rows: fileData.sampleRows,
            options: { skipDuplicates: true },
          }),
        });

        setProgress(80);
        const execData = await execRes.json();
        setProgress(100);
        setResult(execData);

        if (onComplete && execData.summary) {
          onComplete(execData.summary);
        }
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'خطأ في عملية الاستيراد: ' + err.message,
        summary: { total: 0, inserted: 0, skipped: 0, failed: 0 },
      });
    } finally {
      setExecuting(false);
    }
  }, [fileData, selectedTableKey, mapping, onComplete]);

  // ══════════════════════════════════════════════════════
  // إحصائيات الربط
  // ══════════════════════════════════════════════════════
  const mappingStats = useMemo(() => {
    if (!selectedTableDef) return { mapped: 0, total: 0, required: 0, requiredMapped: 0 };

    const mappedFields = new Set(Object.values(mapping).filter(v => v && v !== '__skip__'));
    const requiredFields = selectedTableDef.columns.filter(c => c.required);
    const requiredMapped = requiredFields.filter(c => mappedFields.has(c.field));

    return {
      mapped: mappedFields.size,
      total: selectedTableDef.columns.length,
      required: requiredFields.length,
      requiredMapped: requiredMapped.length,
    };
  }, [mapping, selectedTableDef]);

  // الحقول المتاحة للربط (غير مستخدمة بعد)
  const availableSystemFields = useMemo(() => {
    if (!selectedTableDef) return [];
    const usedFields = new Set(Object.values(mapping).filter(v => v && v !== '__skip__'));
    return selectedTableDef.columns.filter(c => !usedFields.has(c.field));
  }, [mapping, selectedTableDef]);

  // الحقول الموصى بها (الاختيارية ذات الأولوية) — أول 8 حقول اختيارية كحد أقصى
  const recommendedFields = useMemo(() => {
    if (!selectedTableDef) return [];
    return selectedTableDef.columns.filter(c => !c.required).slice(0, 8);
  }, [selectedTableDef]);

  // إحصائيات الاكتمال
  const completenessStats = useMemo(() => {
    if (!selectedTableDef) return null;
    const mappedSet = new Set(Object.values(mapping).filter(v => v && v !== '__skip__'));
    const required = selectedTableDef.columns.filter(c => c.required);
    const recommended = selectedTableDef.columns.filter(c => !c.required).slice(0, 8);
    const reqMapped = required.filter(c => mappedSet.has(c.field)).length;
    const recMapped = recommended.filter(c => mappedSet.has(c.field)).length;
    const totalMapped = mappedSet.size;
    const total = selectedTableDef.columns.length;
    const overallPct = total > 0 ? Math.round((totalMapped / total) * 100) : 0;
    const reqPct = required.length > 0 ? Math.round((reqMapped / required.length) * 100) : 100;
    const recPct = recommended.length > 0 ? Math.round((recMapped / recommended.length) * 100) : 0;
    return { reqMapped, reqTotal: required.length, reqPct, recMapped, recTotal: recommended.length, recPct, overallPct, totalMapped, total };
  }, [mapping, selectedTableDef]);

  // ══════════════════════════════════════════════════════
  // إعادة تعيين
  // ══════════════════════════════════════════════════════
  const handleReset = useCallback(() => {
    setCurrentStep(preSelectedTable ? 1 : 0);
    setFileData(null);
    setMapping({});
    setResult(null);
    setDryRunResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [preSelectedTable]);

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── شريط الخطوات ── */}
      <StepBar steps={STEPS} currentStep={currentStep} />

      {/* ── الخطوة 0: اختيار نوع البيانات ── */}
      {currentStep === 0 && (
        <TableSelector
          tables={tables}
          loading={tablesLoading}
          error={tablesError}
          selected={selectedTableKey}
          onSelect={(key) => {
            setSelectedTableKey(key);
            setCurrentStep(1);
          }}
          onRetry={() => {
            setTablesLoading(true);
            setTablesError(null);
            fetch('/api/import/table-schema', { credentials: 'include' })
              .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
              .then(d => { if (d.success && d.data) setTables(d.data); else setTablesError(d.error || 'لم يتم العثور على جداول'); })
              .catch(err => setTablesError('فشل تحميل أنواع البيانات: ' + err.message))
              .finally(() => setTablesLoading(false));
          }}
        />
      )}

      {/* ── الخطوة 1: رفع الملف ── */}
      {currentStep === 1 && (
        <FileUploadStep
          selectedTableDef={selectedTableDef}
          uploading={uploading}
          fileInputRef={fileInputRef}
          onUpload={handleFileUpload}
          onBack={() => setCurrentStep(0)}
        />
      )}

      {/* ── الخطوة 2: ربط الحقول ── */}
      {currentStep === 2 && fileData && selectedTableDef && (
        <MappingStep
          fileData={fileData}
          tableDef={selectedTableDef}
          mapping={mapping}
          mappingStats={mappingStats}
          availableSystemFields={availableSystemFields}
          completenessStats={completenessStats}
          recommendedFields={recommendedFields}
          dryRunResult={dryRunResult}
          executing={executing}
          onUpdateMapping={updateMapping}
          onAutoMap={handleAutoMap}
          onDryRun={handleDryRun}
          onExecute={handleExecute}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {/* ── الخطوة 3: النتيجة ── */}
      {currentStep === 3 && (
        <ResultStep
          result={result}
          executing={executing}
          progress={progress}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// المكونات الفرعية
// ══════════════════════════════════════════════════════════════

/**
 * شريط الخطوات
 */
function StepBar({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            i === currentStep
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200'
              : i < currentStep
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'text-gray-400'
          }`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              i < currentStep
                ? 'bg-green-500 text-white'
                : i === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500 dark:text-gray-400'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </span>
            {step.labelAr}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${i < currentStep ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * اختيار نوع البيانات (الجدول)
 */
function TableSelector({ tables, loading, error, selected, onSelect, onRetry }) {
  const iconMap = {
    users: '👥', calendar: '📅', clock: '⏰', banknotes: '💰',
    'building-office': '🏢', briefcase: '💼', 'minus-circle': '➖',
    'arrow-trending-up': '📈', 'currency-dollar': '💵', 'academic-cap': '🎓',
    'user-plus': '➕', 'map-pin': '📍', star: '⭐', 'arrows-right-left': '↔️',
    flag: '🏳️', 'clipboard-list': '📋',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">اختر نوع البيانات المراد استيرادها</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">حدد الجدول الذي تريد إدخال البيانات فيه</p>

      {/* حالة التحميل */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل أنواع البيانات...</span>
        </div>
      )}

      {/* حالة الخطأ */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* قائمة الجداول */}
      {!loading && !error && tables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد أنواع بيانات متاحة للاستيراد</p>
        </div>
      )}

      {!loading && !error && tables.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tables.map(t => (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md text-center ${
                selected === t.key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 bg-white dark:bg-gray-900'
              }`}
            >
              <span className="text-2xl">{iconMap[t.icon] || '📊'}</span>
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{t.nameAr}</span>
              <span className="text-xs text-gray-400">{t.columnCount} حقل • {t.requiredCount} مطلوب</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * خطوة رفع الملف
 */
function FileUploadStep({ selectedTableDef, uploading, fileInputRef, onUpload, onBack }) {
  const [dragActive, setDragActive] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onUpload(file);
  }, [onUpload]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  // الحقول المطلوبة والموصى بها لجدول الموظفين
  const EMPLOYEE_REQUIRED = ['الاسم بالعربي', 'رقم البطاقة / الإثبات', 'الجنسية'];
  const EMPLOYEE_RECOMMENDED = ['الاسم بالإنجليزي', 'الإدارة الحالية', 'الوظيفة الحالية', 'المرتبة', 'الدرجة', 'الراتب الأساسي', 'البنك', 'رقم الحساب'];

  return (
    <div className="space-y-4">
      {/* ── لوحة التعليمات ── */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-100 transition-colors"
          onClick={() => setInstructionsOpen(v => !v)}
        >
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-semibold text-sm">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            تعليمات الاستيراد
          </div>
          <svg className={`w-4 h-4 text-blue-500 transition-transform ${instructionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {instructionsOpen && (
          <div className="px-5 pb-4 text-sm text-blue-800 dark:text-blue-200 border-t border-blue-200 dark:border-blue-800">
            <ul className="list-disc mr-5 space-y-1.5 mt-3">
              <li>
                <strong>الحقول المطلوبة:</strong>{' '}
                {selectedTableDef?.columns?.filter(c => c.required).map(c => c.labelAr).join('، ') || EMPLOYEE_REQUIRED.join('، ')}
              </li>
              <li>
                <strong>الحقول الموصى بها:</strong>{' '}
                {selectedTableDef?.nameAr === 'الموظفين'
                  ? EMPLOYEE_RECOMMENDED.join('، ')
                  : selectedTableDef?.columns?.filter(c => !c.required).slice(0, 6).map(c => c.labelAr).join('، ') || '—'
                }
              </li>
              <li>
                <strong>صيغ الملف المقبولة:</strong> Excel (.xlsx, .xls) — يتم تجاهل الأعمدة والأوراق الفارغة تلقائياً
              </li>
              <li>
                <strong>الحد الأقصى:</strong> 2000 صف في المرة الواحدة (الملف حتى 20 ميجابايت)
              </li>
              <li>تأكد أن <strong>الصف الأول</strong> يحتوي على عناوين الأعمدة</li>
              <li>سيتم ربط الأعمدة تلقائياً بناءً على الاسم، ويمكنك تعديل الربط يدوياً في الخطوة التالية</li>
            </ul>
          </div>
        )}
      </div>

      {/* ── بطاقة رفع الملف ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              رفع ملف Excel — {selectedTableDef?.nameAr}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedTableDef?.description}</p>
          </div>
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600">
            {Icons.arrowLeft}
            <span>رجوع</span>
          </button>
        </div>

      {/* منطقة الرفع */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-300">جاري تحليل الملف...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-blue-400">{Icons.upload}</div>
            <div>
              <span className="text-gray-700 dark:text-gray-200 font-medium">اسحب ملف Excel هنا</span>
              <span className="text-gray-400 mx-2">أو</span>
              <label className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                اختر ملف
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">
              يدعم: Excel (.xlsx, .xls) و CSV • الحد الأقصى: 20 ميجابايت
            </p>
          </div>
        )}
      </div>

      {/* معلومات الحقول المطلوبة */}
      {selectedTableDef && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">الحقول المطلوبة في هذا الجدول:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTableDef.columns.filter(c => c.required).map(c => (
              <span key={c.field} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded-full text-xs font-medium">
                {c.labelAr}
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/**
 * خطوة ربط الحقول (الأهم!)
 */
function MappingStep({
  fileData, tableDef, mapping, mappingStats, availableSystemFields,
  completenessStats, recommendedFields,
  dryRunResult, executing, onUpdateMapping, onAutoMap, onDryRun, onExecute, onBack
}) {
  const canExecute = mappingStats.requiredMapped === mappingStats.required && Object.keys(mapping).length > 0;

  return (
    <div className="space-y-4">
      {/* رأس مع معلومات الملف */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-green-500">{Icons.file}</div>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-100">{fileData.fileName}</span>
              <span className="text-sm text-gray-400 mr-3">
                {fileData.totalRows} صف • {fileData.headers.length} عمود • الورقة: {fileData.selectedSheet}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50">
              {Icons.arrowLeft}
              <span>رجوع</span>
            </button>
          </div>
        </div>
      </div>

      {/* إحصائيات الربط + أزرار */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">مُربط: <strong className="text-green-700">{mappingStats.mapped}</strong>/{mappingStats.total}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">مطلوب: <strong className={mappingStats.requiredMapped === mappingStats.required ? 'text-green-700' : 'text-red-600'}>
                {mappingStats.requiredMapped}
              </strong>/{mappingStats.required}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAutoMap}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 transition-all"
            >
              {Icons.sparkles}
              ربط تلقائي
            </button>
            <button
              onClick={() => onUpdateMapping('__clear_all__', null)}
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
              title="مسح كل الربط"
            >
              مسح الكل
            </button>
          </div>
        </div>
      </div>

      {/* جدول الربط */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 py-3 px-4 w-10">#</th>
                <th className="text-right text-xs font-semibold text-blue-600 dark:text-blue-400 py-3 px-4">عمود الملف (Excel)</th>
                <th className="text-center text-xs font-semibold text-gray-400 py-3 px-4 w-10">←</th>
                <th className="text-right text-xs font-semibold text-green-600 dark:text-green-400 py-3 px-4">حقل النظام</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 py-3 px-4">عيّنة من البيانات</th>
              </tr>
            </thead>
            <tbody>
              {fileData.headers.map((header, idx) => {
                const mappedField = mapping[header.name];
                const colDef = mappedField ? tableDef.columns.find(c => c.field === mappedField) : null;
                const sampleValue = fileData.sampleRows[0]?.[header.name] || '';
                const isMapped = !!mappedField && mappedField !== '__skip__';

                return (
                  <tr key={header.name} className={`border-b border-gray-50 transition-all ${
                    isMapped ? 'bg-green-50/30' : ''
                  }`}>
                    <td className="py-2.5 px-4 text-xs text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                          {header.name}
                        </span>
                        <span className="text-xs text-gray-400">({header.sampleType})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isMapped ? (
                        <span className="text-green-500">{Icons.link}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <select
                        className={`w-full px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          isMapped
                            ? 'border-green-300 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
                        }`}
                        value={mappedField || ''}
                        onChange={(e) => onUpdateMapping(header.name, e.target.value)}
                      >
                        <option value="">— لا تربط —</option>
                        <option value="__skip__">⊘ تخطي هذا العمود</option>
                        <optgroup label="الحقول المطلوبة">
                          {tableDef.columns.filter(c => c.required).map(c => (
                            <option key={c.field} value={c.field}>
                              ⚠ {c.labelAr} ({c.field})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="الحقول الاختيارية">
                          {tableDef.columns.filter(c => !c.required).map(c => (
                            <option key={c.field} value={c.field}>
                              {c.labelAr} ({c.field})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate block max-w-[200px]" title={sampleValue}>
                        {sampleValue || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* معاينة البيانات المُربطة */}
      {Object.keys(mapping).length > 0 && fileData.sampleRows.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            معاينة البيانات المُربطة (أول {Math.min(3, fileData.sampleRows.length)} صفوف)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {Object.entries(mapping).filter(([, v]) => v && v !== '__skip__').map(([excelCol, sysField]) => {
                    const colDef = tableDef.columns.find(c => c.field === sysField);
                    return (
                      <th key={sysField} className="text-right px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {colDef?.labelAr || sysField}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {fileData.sampleRows.slice(0, 3).map((row, ri) => (
                  <tr key={ri} className="border-t border-gray-100 dark:border-gray-800">
                    {Object.entries(mapping).filter(([, v]) => v && v !== '__skip__').map(([excelCol, sysField]) => (
                      <td key={sysField} className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                        {row[excelCol] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── مؤشر اكتمال البيانات ── */}
      {completenessStats && Object.keys(mapping).length > 0 && (
        <CompletenessIndicator stats={completenessStats} />
      )}

      {/* نتيجة الاختبار (Dry Run) */}
      {dryRunResult && (
        <div className={`rounded-xl p-4 border ${
          dryRunResult.summary?.failed > 0
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <p className="text-sm font-medium mb-1">{dryRunResult.message}</p>
          {dryRunResult.errors?.length > 0 && (
            <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1">
              {dryRunResult.errors.slice(0, 5).map((e, i) => (
                <li key={i}>صف {e.row}: {e.messages?.join(', ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* أزرار التنفيذ */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {canExecute
            ? `جاهز لاستيراد ${fileData.totalRows} صف في "${tableDef.nameAr}"`
            : `يرجى ربط جميع الحقول المطلوبة (${mappingStats.requiredMapped}/${mappingStats.required})`
          }
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDryRun}
            disabled={!canExecute || executing}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            اختبار أولاً
          </button>
          <button
            onClick={onExecute}
            disabled={!canExecute || executing}
            className="px-6 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm dark:shadow-gray-900/20"
          >
            {executing ? 'جاري التنفيذ...' : 'تنفيذ الاستيراد'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * خطوة النتيجة
 */
function ResultStep({ result, executing, progress, onReset }) {
  if (executing || !result) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-10 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 text-center">
        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">جاري الاستيراد...</h3>
        <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progress}%</p>
      </div>
    );
  }

  const { summary, errors, message } = result;
  const isSuccess = summary?.inserted > 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 text-center space-y-6">
      {/* أيقونة النتيجة */}
      <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
        isSuccess ? 'bg-green-100' : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        {isSuccess ? (
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {isSuccess ? 'تم الاستيراد بنجاح!' : 'فشل الاستيراد'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>

      {/* إحصائيات */}
      {summary && (
        <div className="flex items-center justify-center gap-6">
          <StatBadge label="المجموع" value={summary.total} color="gray" />
          <StatBadge label="تم الإدراج" value={summary.inserted} color="green" />
          {summary.skipped > 0 && <StatBadge label="تم التخطي" value={summary.skipped} color="amber" />}
          {summary.failed > 0 && <StatBadge label="فشل" value={summary.failed} color="red" />}
        </div>
      )}

      {/* أخطاء */}
      {errors && errors.length > 0 && (
        <div className="text-right bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-h-40 overflow-y-auto">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">تفاصيل الأخطاء:</h4>
          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
            {errors.slice(0, 20).map((e, i) => (
              <li key={i}>
                <strong>صف {e.row}:</strong> {e.messages?.join(' | ')}
              </li>
            ))}
            {errors.length > 20 && (
              <li className="text-red-500 font-medium">و {errors.length - 20} أخطاء إضافية...</li>
            )}
          </ul>
        </div>
      )}

      {/* زر العودة */}
      <button
        onClick={onReset}
        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm dark:shadow-gray-900/20"
      >
        استيراد ملف آخر
      </button>
    </div>
  );
}

/**
 * مؤشر اكتمال البيانات
 */
function CompletenessIndicator({ stats }) {
  const { reqMapped, reqTotal, reqPct, recMapped, recTotal, recPct, overallPct } = stats;

  // تحديد لون الشريط حسب النسبة
  function barColor(pct) {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-400';
    return 'bg-red-400';
  }

  function textColor(pct) {
    if (pct >= 80) return 'text-green-700 dark:text-green-300';
    if (pct >= 50) return 'text-amber-700';
    return 'text-red-700 dark:text-red-300';
  }

  function bgColor(pct) {
    if (pct >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (pct >= 50) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  }

  const overallLabel = overallPct >= 80 ? 'جاهز للاستيراد' : overallPct >= 50 ? 'يُنصح بربط المزيد من الحقول' : 'ربط الحقول المطلوبة ضروري قبل المتابعة';

  return (
    <div className={`rounded-xl p-4 border ${bgColor(overallPct)}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">مؤشر اكتمال البيانات</h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${textColor(overallPct)} ${overallPct >= 80 ? 'bg-green-100' : overallPct >= 50 ? 'bg-amber-100' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {overallLabel}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* الحقول المطلوبة */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-300">البيانات المطلوبة</span>
            <span className={`text-xs font-bold ${textColor(reqPct)}`}>{reqMapped}/{reqTotal} ({reqPct}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${barColor(reqPct)}`}
              style={{ width: `${reqPct}%` }}
            />
          </div>
        </div>

        {/* الحقول الموصى بها */}
        {recTotal > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-300">البيانات الموصى بها</span>
              <span className={`text-xs font-bold ${textColor(recPct)}`}>{recMapped}/{recTotal} ({recPct}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor(recPct)}`}
                style={{ width: `${recPct}%` }}
              />
            </div>
          </div>
        )}

        {/* الإجمالي */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">الإجمالي</span>
            <span className={`text-xs font-bold ${textColor(overallPct)}`}>{overallPct}% جاهز</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColor(overallPct)}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  const colors = {
    gray: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };
  return (
    <div className={`px-4 py-2 rounded-lg ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
