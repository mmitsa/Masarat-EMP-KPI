/**
 * مودال معاينة التقرير الشامل للموظف
 * Full Employee Report Preview Modal
 */

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Modal from '../../ui/Modal';
import FullEmployeeReport from './FullEmployeeReport';
import { useOrganizationStructure } from '../../../context/OrganizationStructureContext';

export default function FullEmployeeReportModal({ isOpen, onClose, employee, tabData }) {
    const reportRef = useRef(null);
    const { orgSettings } = useOrganizationStructure();

    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `تقرير_${employee?.name || 'موظف'}`,
    });

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="التقرير الشامل للموظف" size="xl">
            <div className="space-y-4">
                {/* أزرار الإجراءات */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {employee?.name?.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{employee?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{employee?.position} - {employee?.department_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        طباعة التقرير
                    </button>
                </div>

                {/* معاينة التقرير */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                    <div className="flex justify-center">
                        <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: '-25%' }}>
                            <FullEmployeeReport
                                ref={reportRef}
                                employee={employee}
                                tabData={tabData}
                                orgSettings={orgSettings}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* تذييل */}
            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 transition">
                    إغلاق
                </button>
            </div>
        </Modal>
    );
}
