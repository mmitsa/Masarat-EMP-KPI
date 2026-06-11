/**
 * مودال معاينة بطاقة تعريف الموظف
 * Employee Badge Preview Modal
 */

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import Modal from '../../ui/Modal';
import EmployeeBadgeCard from './EmployeeBadgeCard';
import { useOrganizationStructure } from '../../../context/OrganizationStructureContext';

export default function EmployeeBadgePreviewModal({ isOpen, onClose, employee }) {
    const badgeRef = useRef(null);
    const { orgSettings } = useOrganizationStructure();
    const [exporting, setExporting] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: badgeRef,
        documentTitle: `بطاقة_${employee?.name || 'موظف'}`,
    });

    const handleSaveAsImage = async () => {
        if (!badgeRef.current) return;
        setExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(badgeRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const link = document.createElement('a');
            link.download = `بطاقة_${employee?.name || 'موظف'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error exporting badge:', err);
            alert('حدث خطأ أثناء تصدير البطاقة كصورة');
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="معاينة بطاقة تعريف الموظف" size="md">
            <div className="space-y-6">
                {/* معاينة البطاقة */}
                <div className="flex justify-center py-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                    <div style={{ transform: 'scale(1.15)', transformOrigin: 'center' }}>
                        <EmployeeBadgeCard
                            ref={badgeRef}
                            employee={employee}
                            orgSettings={orgSettings}
                        />
                    </div>
                </div>

                {/* ملاحظة */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-amber-700">
                        يمكنك طباعة البطاقة على ورق مقوى وتغليفها لاستخدامها كهوية موظف داخل الجهة
                    </p>
                </div>
            </div>

            {/* أزرار */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 transition">
                    إغلاق
                </button>
                <button
                    onClick={handleSaveAsImage}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {exporting ? 'جاري التصدير...' : 'حفظ كصورة'}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    طباعة البطاقة
                </button>
            </div>
        </Modal>
    );
}
