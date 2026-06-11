/**
 * محرر الصور المتقدم
 * Advanced Image Editor Component
 *
 * يوفر أدوات تعديل شاملة للصور:
 * - تدوير وقلب
 * - اقتصاص
 * - سطوع وتباين
 * - فلاتر
 * - تكبير وتصغير
 * - إعادة تسمية
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// أيقونات الأدوات
const Icons = {
    RotateRight: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    RotateLeft: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    FlipHorizontal: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7v.01M4 12v.01M4 17v.01" />
        </svg>
    ),
    FlipVertical: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
    ),
    Crop: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    ),
    ZoomIn: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
    ),
    ZoomOut: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
    ),
    Brightness: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Contrast: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ),
    Filter: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
    ),
    Undo: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    ),
    Redo: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
    ),
    Save: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
    ),
    Close: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    Reset: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
};

// الفلاتر المتاحة
const FILTERS = [
    { id: 'none', name: 'بدون', nameAr: 'بدون فلتر', style: '' },
    { id: 'grayscale', name: 'رمادي', nameAr: 'تدرج رمادي', style: 'grayscale(100%)' },
    { id: 'sepia', name: 'سيبيا', nameAr: 'بني قديم', style: 'sepia(100%)' },
    { id: 'invert', name: 'معكوس', nameAr: 'ألوان معكوسة', style: 'invert(100%)' },
    { id: 'blur', name: 'ضبابي', nameAr: 'ضبابي', style: 'blur(2px)' },
    { id: 'sharpen', name: 'حاد', nameAr: 'حاد', style: 'contrast(150%) brightness(110%)' },
    { id: 'vintage', name: 'كلاسيكي', nameAr: 'كلاسيكي', style: 'sepia(50%) contrast(95%) brightness(95%)' },
    { id: 'cool', name: 'بارد', nameAr: 'بارد', style: 'saturate(80%) hue-rotate(180deg)' },
    { id: 'warm', name: 'دافئ', nameAr: 'دافئ', style: 'sepia(30%) saturate(140%)' },
    { id: 'high_contrast', name: 'تباين عالي', nameAr: 'تباين عالي', style: 'contrast(200%)' },
];

// نسب الاقتصاص
const CROP_RATIOS = [
    { id: 'free', name: 'حر', ratio: null },
    { id: '1:1', name: '1:1', ratio: 1 },
    { id: '4:3', name: '4:3', ratio: 4 / 3 },
    { id: '16:9', name: '16:9', ratio: 16 / 9 },
    { id: '3:2', name: '3:2', ratio: 3 / 2 },
    { id: 'a4', name: 'A4', ratio: 210 / 297 },
];

export default function ImageEditor({
    image,
    onSave,
    onCancel,
    onClose,
    fileName = 'صورة',
    className = '',
}) {
    // الحالات
    const [editedImage, setEditedImage] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [imageName, setImageName] = useState(fileName);
    const [isEditingName, setIsEditingName] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [activeTab, setActiveTab] = useState('transform'); // transform, adjust, filters, crop
    const [isCropping, setIsCropping] = useState(false);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [cropRatio, setCropRatio] = useState('free');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    // المراجع
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // تحميل الصورة
    useEffect(() => {
        if (image) {
            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                setOriginalImage(image);
                setEditedImage(image);
                saveToHistory(image);
            };
            img.src = typeof image === 'string' ? image : image.data;
        }
    }, [image]);

    // حفظ في التاريخ
    const saveToHistory = useCallback((imageData) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({
                image: imageData,
                rotation,
                flipH,
                flipV,
                brightness,
                contrast,
                saturation,
                filter: selectedFilter,
            });
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex, rotation, flipH, flipV, brightness, contrast, saturation, selectedFilter]);

    // التراجع
    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            applyHistoryState(prevState);
            setHistoryIndex(prev => prev - 1);
        }
    };

    // الإعادة
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            applyHistoryState(nextState);
            setHistoryIndex(prev => prev + 1);
        }
    };

    // تطبيق حالة من التاريخ
    const applyHistoryState = (state) => {
        setEditedImage(state.image);
        setRotation(state.rotation);
        setFlipH(state.flipH);
        setFlipV(state.flipV);
        setBrightness(state.brightness);
        setContrast(state.contrast);
        setSaturation(state.saturation);
        setSelectedFilter(state.filter);
    };

    // إعادة تعيين
    const handleReset = () => {
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setSelectedFilter('none');
        setZoom(100);
        setEditedImage(originalImage);
    };

    // تدوير الصورة
    const handleRotate = async (degrees) => {
        setIsLoading(true);
        const newRotation = (rotation + degrees) % 360;
        setRotation(newRotation);
        await applyTransformations(newRotation, flipH, flipV);
        setIsLoading(false);
    };

    // قلب أفقي
    const handleFlipH = async () => {
        setIsLoading(true);
        const newFlipH = !flipH;
        setFlipH(newFlipH);
        await applyTransformations(rotation, newFlipH, flipV);
        setIsLoading(false);
    };

    // قلب عمودي
    const handleFlipV = async () => {
        setIsLoading(true);
        const newFlipV = !flipV;
        setFlipV(newFlipV);
        await applyTransformations(rotation, flipH, newFlipV);
        setIsLoading(false);
    };

    // تطبيق التحويلات
    const applyTransformations = async (rot, fh, fv) => {
        return new Promise((resolve) => {
            if (!imageRef.current) {
                resolve();
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = imageRef.current;

            // حساب الأبعاد بعد التدوير
            const radians = (rot * Math.PI) / 180;
            const sin = Math.abs(Math.sin(radians));
            const cos = Math.abs(Math.cos(radians));
            canvas.width = img.height * sin + img.width * cos;
            canvas.height = img.height * cos + img.width * sin;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(radians);
            if (fh) ctx.scale(-1, 1);
            if (fv) ctx.scale(1, -1);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            setEditedImage(canvas.toDataURL('image/jpeg', 0.95));
            resolve();
        });
    };

    // تطبيق الفلاتر والتعديلات
    const getFilterStyle = () => {
        const filters = [];

        // السطوع
        if (brightness !== 0) {
            filters.push(`brightness(${100 + brightness}%)`);
        }

        // التباين
        if (contrast !== 0) {
            filters.push(`contrast(${100 + contrast}%)`);
        }

        // التشبع
        if (saturation !== 0) {
            filters.push(`saturate(${100 + saturation}%)`);
        }

        // الفلتر المحدد
        const filter = FILTERS.find(f => f.id === selectedFilter);
        if (filter && filter.style) {
            filters.push(filter.style);
        }

        return filters.join(' ') || 'none';
    };

    // حفظ الصورة
    const handleSave = async () => {
        setIsLoading(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = editedImage;
            });

            canvas.width = img.width;
            canvas.height = img.height;

            // تطبيق الفلاتر
            ctx.filter = getFilterStyle();
            ctx.drawImage(img, 0, 0);

            const finalImage = canvas.toDataURL('image/jpeg', 0.95);

            if (onSave) {
                onSave({
                    data: finalImage,
                    name: imageName,
                    width: canvas.width,
                    height: canvas.height,
                    format: 'jpeg',
                    editedAt: new Date().toISOString(),
                });
            }

            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Error saving image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // التعامل مع الاقتصاص
    const handleStartCrop = () => {
        setIsCropping(true);
        setActiveTab('crop');
    };

    const handleApplyCrop = async () => {
        if (!cropArea.width || !cropArea.height) return;

        setIsLoading(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = editedImage;
            });

            canvas.width = cropArea.width;
            canvas.height = cropArea.height;

            ctx.drawImage(
                img,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, cropArea.width, cropArea.height
            );

            const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
            setEditedImage(croppedImage);
            saveToHistory(croppedImage);
            setIsCropping(false);

        } catch (error) {
            console.error('Error cropping:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // مكونات الأدوات
    const ToolButton = ({ icon: Icon, label, onClick, active, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 text-gray-600 dark:text-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={label}
        >
            <Icon />
            <span className="text-xs">{label}</span>
        </button>
    );

    const Slider = ({ label, value, onChange, min = -100, max = 100 }) => (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                <span className="text-gray-900 dark:text-white font-medium">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );

    return (
        <div className={`fixed inset-0 bg-black/90 z-50 flex flex-col ${className}`} dir="rtl">
            {/* رأس المحرر */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose || onCancel}
                        className="p-2 hover:bg-gray-800 rounded-lg"
                    >
                        <Icons.Close />
                    </button>
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={imageName}
                                onChange={(e) => setImageName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                className="bg-gray-800 px-3 py-1 rounded-lg text-white"
                                autoFocus
                            />
                        ) : (
                            <>
                                <span className="font-medium">{imageName}</span>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-1 hover:bg-gray-800 rounded"
                                >
                                    <Icons.Edit />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50"
                        title="تراجع"
                    >
                        <Icons.Undo />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-50"
                        title="إعادة"
                    >
                        <Icons.Redo />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-gray-800 rounded-lg"
                        title="إعادة تعيين"
                    >
                        <Icons.Reset />
                    </button>
                    <div className="w-px h-6 bg-gray-700 mx-2"></div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icons.Save />
                        <span>حفظ</span>
                    </button>
                </div>
            </div>

            {/* المحتوى الرئيسي */}
            <div className="flex-1 flex">
                {/* شريط الأدوات الجانبي */}
                <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
                    {/* التبويبات */}
                    <div className="flex gap-1 mb-4 bg-gray-700 rounded-lg p-1">
                        {[
                            { id: 'transform', label: 'تحويل' },
                            { id: 'adjust', label: 'تعديل' },
                            { id: 'filters', label: 'فلاتر' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                                    activeTab === tab.id ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* أدوات التحويل */}
                    {activeTab === 'transform' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-gray-400 text-sm mb-2">التدوير</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleRotate(-90)}
                                        className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    >
                                        <Icons.RotateLeft />
                                        <span className="text-sm">يسار</span>
                                    </button>
                                    <button
                                        onClick={() => handleRotate(90)}
                                        className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    >
                                        <Icons.RotateRight />
                                        <span className="text-sm">يمين</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-gray-400 text-sm mb-2">القلب</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleFlipH}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg text-white ${
                                            flipH ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icons.FlipHorizontal />
                                        <span className="text-sm">أفقي</span>
                                    </button>
                                    <button
                                        onClick={handleFlipV}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg text-white ${
                                            flipV ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    >
                                        <Icons.FlipVertical />
                                        <span className="text-sm">عمودي</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-gray-400 text-sm mb-2">التكبير</h4>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    >
                                        <Icons.ZoomOut />
                                    </button>
                                    <div className="flex-1 text-center text-white">{zoom}%</div>
                                    <button
                                        onClick={() => setZoom(Math.min(300, zoom + 25))}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                    >
                                        <Icons.ZoomIn />
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min="25"
                                    max="300"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseInt(e.target.value))}
                                    className="w-full mt-2"
                                />
                            </div>
                        </div>
                    )}

                    {/* أدوات التعديل */}
                    {activeTab === 'adjust' && (
                        <div className="space-y-4 text-white">
                            <Slider
                                label="السطوع"
                                value={brightness}
                                onChange={setBrightness}
                            />
                            <Slider
                                label="التباين"
                                value={contrast}
                                onChange={setContrast}
                            />
                            <Slider
                                label="التشبع"
                                value={saturation}
                                onChange={setSaturation}
                            />
                        </div>
                    )}

                    {/* الفلاتر */}
                    {activeTab === 'filters' && (
                        <div className="grid grid-cols-2 gap-2">
                            {FILTERS.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedFilter(filter.id)}
                                    className={`p-3 rounded-lg text-center transition-all ${
                                        selectedFilter === filter.id
                                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="text-sm">{filter.nameAr}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* منطقة المعاينة */}
                <div
                    ref={containerRef}
                    className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-900"
                >
                    {editedImage && (
                        <div
                            style={{
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.2s ease',
                            }}
                        >
                            <img
                                src={editedImage}
                                alt="معاينة"
                                style={{
                                    filter: getFilterStyle(),
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                }}
                                className="rounded-lg shadow-2xl"
                            />
                        </div>
                    )}

                    {isLoading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* شريط الحالة */}
            <div className="bg-gray-800 text-gray-400 px-4 py-2 text-sm flex justify-between">
                <span>
                    التكبير: {zoom}% | التدوير: {rotation}°
                </span>
                <span>
                    {brightness !== 0 && `السطوع: ${brightness > 0 ? '+' : ''}${brightness} | `}
                    {contrast !== 0 && `التباين: ${contrast > 0 ? '+' : ''}${contrast} | `}
                    {selectedFilter !== 'none' && `الفلتر: ${FILTERS.find(f => f.id === selectedFilter)?.nameAr}`}
                </span>
            </div>
        </div>
    );
}

// مكون زر التعديل السريع
export function QuickEditButton({ image, onSave, className = '' }) {
    const [showEditor, setShowEditor] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowEditor(true)}
                className={`p-2 hover:bg-gray-100 rounded-lg ${className}`}
                title="تعديل الصورة"
            >
                <Icons.Edit />
            </button>

            {showEditor && (
                <ImageEditor
                    image={image}
                    onSave={(edited) => {
                        onSave(edited);
                        setShowEditor(false);
                    }}
                    onClose={() => setShowEditor(false)}
                />
            )}
        </>
    );
}
