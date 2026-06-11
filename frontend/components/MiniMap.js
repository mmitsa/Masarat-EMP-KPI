import React, { useEffect, useRef, useState } from 'react';

/**
 * مكون Mini Map - خريطة صغيرة لعرض الموقع الحالي في الهيكل
 * @param {Object} props
 * @param {number} props.scale - مقياس الزوم الحالي
 * @param {Object} props.position - الموضع الحالي {x, y}
 * @param {Function} props.onNavigate - دالة التنقل إلى موضع جديد
 * @param {boolean} props.darkMode - الوضع الداكن
 * @param {boolean} props.visible - إظهار/إخفاء الخريطة
 */
export default function MiniMap({
    scale = 1,
    position = { x: 0, y: 0 },
    onNavigate,
    darkMode = false,
    visible = true
}) {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // رسم Mini Map
    useEffect(() => {
        if (!visible || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // مسح Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // خلفية Mini Map
        ctx.fillStyle = darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // حدود Mini Map
        ctx.strokeStyle = darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // رسم تمثيل للمحتوى (مستطيل كبير)
        const contentWidth = 150;
        const contentHeight = 100;
        const contentX = (canvas.width - contentWidth) / 2;
        const contentY = (canvas.height - contentHeight) / 2;

        ctx.fillStyle = darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(contentX, contentY, contentWidth, contentHeight);

        // رسم Viewport (المنطقة المرئية حالياً)
        const viewportWidth = (100 / scale) * 1.5;
        const viewportHeight = (60 / scale) * 1.5;

        // حساب موضع Viewport بناءً على position
        const normalizedX = -position.x / (scale * 10);
        const normalizedY = -position.y / (scale * 10);

        const viewportX = contentX + contentWidth / 2 + normalizedX - viewportWidth / 2;
        const viewportY = contentY + contentHeight / 2 + normalizedY - viewportHeight / 2;

        // رسم مستطيل Viewport
        ctx.strokeStyle = darkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 1)';
        ctx.fillStyle = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 2;
        ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
        ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

        // إضافة علامة + في المنتصف
        ctx.strokeStyle = darkMode ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)';
        ctx.lineWidth = 1;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const crossSize = 8;

        // خط أفقي
        ctx.beginPath();
        ctx.moveTo(centerX - crossSize, centerY);
        ctx.lineTo(centerX + crossSize, centerY);
        ctx.stroke();

        // خط عمودي
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - crossSize);
        ctx.lineTo(centerX, centerY + crossSize);
        ctx.stroke();

    }, [scale, position, darkMode, visible]);

    // معالج النقر على Mini Map للتنقل
    const handleClick = (e) => {
        if (!onNavigate || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // تحويل إحداثيات النقر إلى موضع في الهيكل الرئيسي
        const contentWidth = 150;
        const contentHeight = 100;
        const contentX = (canvas.width - contentWidth) / 2;
        const contentY = (canvas.height - contentHeight) / 2;

        const normalizedX = ((x - contentX - contentWidth / 2) / contentWidth) * 2;
        const normalizedY = ((y - contentY - contentHeight / 2) / contentHeight) * 2;

        const newX = -normalizedX * scale * 500;
        const newY = -normalizedY * scale * 500;

        onNavigate({ x: newX, y: newY });
    };

    // معالج السحب على Mini Map
    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleClick(e);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        handleClick(e);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50 group">
            {/* Container */}
            <div
                className={`
                    rounded-xl overflow-hidden
                    shadow-lg border-2
                    transition-all duration-200
                    ${darkMode
                        ? 'border-gray-700 shadow-gray-900/50'
                        : 'border-gray-200 dark:border-gray-700 shadow-gray-300/50'
                    }
                `}
            >
                {/* Header */}
                <div className={`
                    px-3 py-2 text-xs font-medium
                    ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'}
                `}>
                    🗺️ خريطة التنقل
                </div>

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={140}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                    onMouseDown={handleMouseDown}
                    onClick={handleClick}
                />

                {/* Info */}
                <div className={`
                    px-3 py-2 text-xs
                    ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}
                `}>
                    <div className="flex justify-between items-center">
                        <span>الزوم: {Math.round(scale * 100)}%</span>
                        <span className="text-[10px] opacity-70">انقر للتنقل</span>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            <div className={`
                absolute -top-10 left-1/2 -translate-x-1/2
                px-3 py-1 rounded-lg text-xs whitespace-nowrap
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200 pointer-events-none
                ${darkMode
                    ? 'bg-gray-800 text-gray-200 border border-gray-700'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-md'
                }
            `}>
                انقر أو اسحب للتنقل السريع
            </div>
        </div>
    );
}
