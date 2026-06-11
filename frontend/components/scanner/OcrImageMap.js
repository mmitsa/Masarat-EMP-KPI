/**
 * مكون الخريطة التفاعلية للـ OCR
 * Interactive OCR Image Map Component
 *
 * يعرض الصورة مع مناطق OCR قابلة للنقر
 * ويسمح بتعيين النص للحقول المناسبة
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// الحقول المتاحة للتعيين
const AVAILABLE_FIELDS = [
    { id: 'documentNumber', nameAr: 'رقم المستند', icon: '#️⃣' },
    { id: 'date', nameAr: 'التاريخ', icon: '📅' },
    { id: 'subject', nameAr: 'الموضوع', icon: '📝' },
    { id: 'sender', nameAr: 'المرسل', icon: '👤' },
    { id: 'recipient', nameAr: 'المرسل إليه', icon: '👥' },
    { id: 'referenceNumber', nameAr: 'الرقم المرجعي', icon: '🔗' },
    { id: 'notes', nameAr: 'ملاحظات', icon: '📌' },
];

// ألوان المناطق حسب الثقة
const getRegionColor = (confidence, isSelected, isHovered) => {
    if (isSelected) return 'rgba(59, 130, 246, 0.5)'; // أزرق
    if (isHovered) return 'rgba(139, 92, 246, 0.4)'; // بنفسجي

    if (confidence >= 80) return 'rgba(34, 197, 94, 0.3)'; // أخضر - ثقة عالية
    if (confidence >= 60) return 'rgba(234, 179, 8, 0.3)'; // أصفر - ثقة متوسطة
    return 'rgba(239, 68, 68, 0.3)'; // أحمر - ثقة منخفضة
};

const getBorderColor = (confidence, isSelected, isHovered) => {
    if (isSelected) return '#3b82f6';
    if (isHovered) return '#8b5cf6';

    if (confidence >= 80) return '#22c55e';
    if (confidence >= 60) return '#eab308';
    return '#ef4444';
};

/**
 * مكون الخريطة التفاعلية
 */
export default function OcrImageMap({
    imageSrc,
    regions = [],
    extractedData = {},
    onRegionClick,
    onFieldAssign,
    onTextSelect,
    selectedRegionId = null,
    zoom = 100,
    showRegions = true,
    showConfidence = true,
    className = '',
}) {
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const [showFieldMenu, setShowFieldMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [scale, setScale] = useState(1);

    // حساب حجم الصورة
    useEffect(() => {
        if (imageRef.current) {
            const img = imageRef.current;
            const updateSize = () => {
                setImageSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };

            if (img.complete) {
                updateSize();
            } else {
                img.onload = updateSize;
            }
        }
    }, [imageSrc]);

    // حساب المقياس
    useEffect(() => {
        if (containerRef.current && imageSize.width > 0) {
            const containerWidth = containerRef.current.clientWidth;
            setScale((containerWidth / imageSize.width) * (zoom / 100));
        }
    }, [imageSize, zoom]);

    // النقر على منطقة
    const handleRegionClick = useCallback((region, event) => {
        event.stopPropagation();

        setSelectedText(region.text);
        setMenuPosition({
            x: event.clientX,
            y: event.clientY,
        });
        setShowFieldMenu(true);

        onRegionClick?.(region);
    }, [onRegionClick]);

    // تعيين النص لحقل
    const handleFieldSelect = useCallback((fieldId) => {
        if (selectedText && onFieldAssign) {
            onFieldAssign(fieldId, selectedText);
        }
        setShowFieldMenu(false);
        setSelectedText('');
    }, [selectedText, onFieldAssign]);

    // نسخ النص
    const handleCopyText = useCallback(() => {
        if (selectedText) {
            navigator.clipboard.writeText(selectedText);
            setShowFieldMenu(false);
        }
    }, [selectedText]);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = () => setShowFieldMenu(false);
        if (showFieldMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showFieldMenu]);

    return (
        <div className={`relative ${className}`} dir="rtl">
            {/* شريط الأدوات */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {regions.length} منطقة نصية
                    </span>
                    {showConfidence && regions.length > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            | متوسط الثقة: {Math.round(regions.reduce((sum, r) => sum + r.confidence, 0) / regions.length)}%
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => showRegions && setShowFieldMenu(false)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            showRegions ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' : 'bg-gray-200 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        عرض المناطق
                    </button>
                </div>
            </div>

            {/* حاوية الصورة */}
            <div
                ref={containerRef}
                className="relative overflow-auto bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
                style={{ maxHeight: '600px' }}
            >
                <div
                    className="relative inline-block"
                    style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top right',
                    }}
                >
                    {/* الصورة */}
                    <img
                        ref={imageRef}
                        src={imageSrc}
                        alt="مستند ممسوح"
                        className="max-w-none"
                        draggable={false}
                    />

                    {/* مناطق OCR */}
                    {showRegions && regions.map((region) => {
                        const isSelected = selectedRegionId === region.id;
                        const isHovered = hoveredRegion === region.id;

                        return (
                            <div
                                key={region.id}
                                className="absolute cursor-pointer transition-all duration-150"
                                style={{
                                    left: `${region.box.x}px`,
                                    top: `${region.box.y}px`,
                                    width: `${region.box.width}px`,
                                    height: `${region.box.height}px`,
                                    backgroundColor: getRegionColor(region.confidence, isSelected, isHovered),
                                    border: `2px solid ${getBorderColor(region.confidence, isSelected, isHovered)}`,
                                    borderRadius: '4px',
                                }}
                                onMouseEnter={() => setHoveredRegion(region.id)}
                                onMouseLeave={() => setHoveredRegion(null)}
                                onClick={(e) => handleRegionClick(region, e)}
                                title={`${region.text} (${Math.round(region.confidence)}%)`}
                            >
                                {/* شارة الثقة */}
                                {showConfidence && isHovered && (
                                    <div className="absolute -top-6 right-0 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        {Math.round(region.confidence)}%
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* قائمة تعيين الحقول */}
            {showFieldMenu && (
                <div
                    className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-64"
                    style={{
                        left: `${menuPosition.x}px`,
                        top: `${menuPosition.y}px`,
                        transform: 'translate(-100%, 0)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* النص المحدد */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">النص المحدد:</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{selectedText}</p>
                    </div>

                    {/* خيارات الحقول */}
                    <div className="py-1">
                        <p className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400">تعيين إلى:</p>
                        {AVAILABLE_FIELDS.map((field) => (
                            <button
                                key={field.id}
                                onClick={() => handleFieldSelect(field.id)}
                                className="w-full px-4 py-2 text-right hover:bg-blue-50 flex items-center gap-2 transition-colors"
                            >
                                <span>{field.icon}</span>
                                <span className="text-sm">{field.nameAr}</span>
                                {extractedData[field.id] && (
                                    <span className="text-xs text-green-600 dark:text-green-400 mr-auto">✓</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* إجراءات إضافية */}
                    <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                        <button
                            onClick={handleCopyText}
                            className="w-full px-4 py-2 text-right hover:bg-gray-50 flex items-center gap-2 text-gray-600 dark:text-gray-300"
                        >
                            <span>📋</span>
                            <span className="text-sm">نسخ النص</span>
                        </button>
                    </div>
                </div>
            )}

            {/* مفتاح الألوان */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500"></div>
                    <span>ثقة عالية (&gt;80%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500"></div>
                    <span>ثقة متوسطة (60-80%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500"></div>
                    <span>ثقة منخفضة (&lt;60%)</span>
                </div>
            </div>
        </div>
    );
}

/**
 * مكون عرض النص المستخرج
 */
export function ExtractedDataPanel({
    extractedData = {},
    classification = null,
    onFieldChange,
    onApplyToForm,
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4" dir="rtl">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🤖</span>
                <span>البيانات المستخرجة تلقائياً</span>
            </h4>

            {/* تصنيف المستند */}
            {classification && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-700 dark:text-purple-300">نوع المستند:</span>
                        <span className="font-bold text-purple-900">{classification.nameAr}</span>
                    </div>
                    <div className="mt-1 text-xs text-purple-600">
                        نسبة الثقة: {classification.confidence}%
                    </div>
                </div>
            )}

            {/* الحقول المستخرجة */}
            <div className="space-y-3">
                {AVAILABLE_FIELDS.map((field) => {
                    const value = extractedData[field.id];
                    const hasValue = value && value.trim();

                    return (
                        <div
                            key={field.id}
                            className={`p-3 rounded-lg border ${
                                hasValue
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span>{field.icon}</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {field.nameAr}
                                </span>
                                {hasValue && (
                                    <span className="text-xs text-green-600 dark:text-green-400 mr-auto">تم الاستخراج ✓</span>
                                )}
                            </div>
                            {hasValue ? (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => onFieldChange?.(field.id, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                            ) : (
                                <p className="text-sm text-gray-400 italic">لم يتم الاستخراج</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* زر التطبيق */}
            {Object.values(extractedData).some(v => v) && (
                <button
                    onClick={onApplyToForm}
                    className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <span>✨</span>
                    <span>تطبيق على النموذج</span>
                </button>
            )}
        </div>
    );
}

/**
 * مكون عرض النص الكامل
 */
export function FullTextPanel({ fullText, onCopy }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onCopy?.();
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4" dir="rtl">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>📄</span>
                    <span>النص الكامل</span>
                </h4>
                <button
                    onClick={handleCopy}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        copied
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                >
                    {copied ? '✓ تم النسخ' : '📋 نسخ'}
                </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {fullText || 'لا يوجد نص مستخرج'}
                </pre>
            </div>
        </div>
    );
}
