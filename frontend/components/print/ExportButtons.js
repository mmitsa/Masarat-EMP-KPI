import React, { useState, useRef } from 'react';
import { exportToExcel, exportToCSV, exportToPDF, printElement } from '../../lib/exportUtils';
import { useOrganization } from '../../context/OrganizationContext';

/**
 * أزرار التصدير والطباعة الموحدة
 * تستخدم في جميع الشاشات التي تحتاج لتصدير البيانات
 */
export default function ExportButtons({
    data = [],
    columns = [],
    filename = 'report',
    title,
    subtitle,
    printRef,
    showPrint = true,
    showPDF = true,
    showExcel = true,
    showCSV = false,
    darkMode = false,
    size = 'md', // 'sm' | 'md' | 'lg'
    variant = 'default', // 'default' | 'compact' | 'icon-only'
    disabled = false,
    onBeforeExport,
    onAfterExport,
    includeSummary = false,
    summaryData = [],
}) {
    const { organization } = useOrganization();
    const [exporting, setExporting] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-5 py-2.5 text-base gap-2',
    };

    const iconSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const handleExport = async (type) => {
        if (disabled) return;

        setExporting(type);
        try {
            if (onBeforeExport) await onBeforeExport(type);

            switch (type) {
                case 'excel':
                    exportToExcel(data, columns, filename, {
                        title,
                        subtitle,
                        includeOrganization: true,
                        includeSummary,
                        summaryData,
                    });
                    break;

                case 'csv':
                    exportToCSV(data, columns, filename, {
                        title,
                        includeHeader: true,
                    });
                    break;

                case 'pdf':
                    if (printRef?.current) {
                        await exportToPDF(printRef.current, filename, {
                            title,
                            subtitle,
                            orientation: organization?.reportSettings?.orientation || 'portrait',
                            paperSize: organization?.reportSettings?.paperSize || 'A4',
                            showHeader: true,
                            showFooter: true,
                            showWatermark: organization?.reportSettings?.showWatermark ?? false,
                        });
                    } else {
                        alert('يرجى تحديد عنصر الطباعة');
                    }
                    break;

                case 'print':
                    if (printRef?.current) {
                        printElement(printRef.current, {
                            title,
                            subtitle,
                            showHeader: true,
                            showFooter: true,
                        });
                    } else {
                        window.print();
                    }
                    break;
            }

            if (onAfterExport) await onAfterExport(type);
        } catch (error) {
            console.warn('Export error:', error);
            alert('حدث خطأ أثناء التصدير');
        } finally {
            setExporting(null);
            setShowDropdown(false);
        }
    };

    // Compact variant - dropdown
    if (variant === 'compact') {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={disabled}
                    className={`flex items-center ${sizeClasses[size]} rounded-xl font-medium transition-all ${
                        darkMode
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <ExportIcon className={iconSizes[size]} />
                    <span>تصدير</span>
                    <ChevronDownIcon className={iconSizes[size]} />
                </button>

                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />
                        <div className={`absolute top-full mt-2 left-0 z-50 min-w-[180px] rounded-xl shadow-lg border ${
                            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                        }`}>
                            {showPrint && (
                                <DropdownItem
                                    icon={<PrintIcon className="w-4 h-4" />}
                                    label="طباعة"
                                    onClick={() => handleExport('print')}
                                    loading={exporting === 'print'}
                                    darkMode={darkMode}
                                />
                            )}
                            {showPDF && (
                                <DropdownItem
                                    icon={<PDFIcon className="w-4 h-4" />}
                                    label="تصدير PDF"
                                    onClick={() => handleExport('pdf')}
                                    loading={exporting === 'pdf'}
                                    darkMode={darkMode}
                                />
                            )}
                            {showExcel && (
                                <DropdownItem
                                    icon={<ExcelIcon className="w-4 h-4" />}
                                    label="تصدير Excel"
                                    onClick={() => handleExport('excel')}
                                    loading={exporting === 'excel'}
                                    darkMode={darkMode}
                                />
                            )}
                            {showCSV && (
                                <DropdownItem
                                    icon={<CSVIcon className="w-4 h-4" />}
                                    label="تصدير CSV"
                                    onClick={() => handleExport('csv')}
                                    loading={exporting === 'csv'}
                                    darkMode={darkMode}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Icon-only variant
    if (variant === 'icon-only') {
        return (
            <div className="flex items-center gap-1">
                {showPrint && (
                    <IconButton
                        icon={<PrintIcon className={iconSizes[size]} />}
                        onClick={() => handleExport('print')}
                        loading={exporting === 'print'}
                        title="طباعة"
                        darkMode={darkMode}
                        disabled={disabled}
                    />
                )}
                {showPDF && (
                    <IconButton
                        icon={<PDFIcon className={iconSizes[size]} />}
                        onClick={() => handleExport('pdf')}
                        loading={exporting === 'pdf'}
                        title="تصدير PDF"
                        darkMode={darkMode}
                        disabled={disabled}
                        color="red"
                    />
                )}
                {showExcel && (
                    <IconButton
                        icon={<ExcelIcon className={iconSizes[size]} />}
                        onClick={() => handleExport('excel')}
                        loading={exporting === 'excel'}
                        title="تصدير Excel"
                        darkMode={darkMode}
                        disabled={disabled}
                        color="green"
                    />
                )}
                {showCSV && (
                    <IconButton
                        icon={<CSVIcon className={iconSizes[size]} />}
                        onClick={() => handleExport('csv')}
                        loading={exporting === 'csv'}
                        title="تصدير CSV"
                        darkMode={darkMode}
                        disabled={disabled}
                        color="blue"
                    />
                )}
            </div>
        );
    }

    // Default variant - separate buttons
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {showPrint && (
                <ExportButton
                    icon={<PrintIcon className={iconSizes[size]} />}
                    label="طباعة"
                    onClick={() => handleExport('print')}
                    loading={exporting === 'print'}
                    darkMode={darkMode}
                    size={size}
                    disabled={disabled}
                />
            )}
            {showPDF && (
                <ExportButton
                    icon={<PDFIcon className={iconSizes[size]} />}
                    label="PDF"
                    onClick={() => handleExport('pdf')}
                    loading={exporting === 'pdf'}
                    darkMode={darkMode}
                    size={size}
                    disabled={disabled}
                    color="red"
                />
            )}
            {showExcel && (
                <ExportButton
                    icon={<ExcelIcon className={iconSizes[size]} />}
                    label="Excel"
                    onClick={() => handleExport('excel')}
                    loading={exporting === 'excel'}
                    darkMode={darkMode}
                    size={size}
                    disabled={disabled}
                    color="green"
                />
            )}
            {showCSV && (
                <ExportButton
                    icon={<CSVIcon className={iconSizes[size]} />}
                    label="CSV"
                    onClick={() => handleExport('csv')}
                    loading={exporting === 'csv'}
                    darkMode={darkMode}
                    size={size}
                    disabled={disabled}
                    color="blue"
                />
            )}
        </div>
    );
}

// Export Button
function ExportButton({ icon, label, onClick, loading, darkMode, size, disabled, color }) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-5 py-2.5 text-base gap-2',
    };

    const colorClasses = {
        red: darkMode
            ? 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100',
        green: darkMode
            ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50'
            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100',
        blue: darkMode
            ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-900/50'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100',
        default: darkMode
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center ${sizeClasses[size]} rounded-xl font-medium border transition-all ${
                colorClasses[color] || colorClasses.default
            } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                icon
            )}
            <span>{label}</span>
        </button>
    );
}

// Icon Button
function IconButton({ icon, onClick, loading, title, darkMode, disabled, color }) {
    const colorClasses = {
        red: darkMode ? 'hover:bg-red-900/30 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-600',
        green: darkMode ? 'hover:bg-green-900/30 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600',
        blue: darkMode ? 'hover:bg-blue-900/30 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600',
        default: darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
            } ${colorClasses[color] || colorClasses.default} ${
                disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                icon
            )}
        </button>
    );
}

// Dropdown Item
function DropdownItem({ icon, label, onClick, loading, darkMode }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50'
            } ${loading ? 'opacity-50' : ''}`}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                icon
            )}
            <span>{label}</span>
        </button>
    );
}

// Icons
function ExportIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    );
}

function PrintIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
    );
}

function PDFIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
            <path d="M8 12h1.5v5H8v-5zm3 0h1.5v5H11v-5zm3 0h2v1.5h-1v.75h1v1.5h-1V17h-1v-5z"/>
        </svg>
    );
}

function ExcelIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
            <path d="M8 12l2 2.5L8 17h1.5l1.25-1.75L12 17h1.5l-2-2.5 2-2.5H12l-1.25 1.75L9.5 12H8z"/>
        </svg>
    );
}

function CSVIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
            <path d="M8 14v-2h2v2H8zm0 4v-2h2v2H8zm3-4v-2h2v2h-2zm0 4v-2h2v2h-2zm3-4v-2h2v2h-2zm0 4v-2h2v2h-2z"/>
        </svg>
    );
}

function ChevronDownIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}
