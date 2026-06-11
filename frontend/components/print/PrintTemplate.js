import React, { forwardRef } from 'react';
import { useOrganization } from '../../context/OrganizationContext';

/**
 * قالب الطباعة الموحد
 * يستخدم لجميع التقارير والمستندات في النظام
 */
const PrintTemplate = forwardRef(({
    title,
    subtitle,
    department,
    section,
    reportNumber,
    reportDate,
    children,
    signatures = [],
    showStamp = true,
    showQRCode = true,
    showWatermark = false,
    orientation = 'portrait',
    customHeader,
    customFooter,
}, ref) => {
    const { organization } = useOrganization();
    const settings = organization.reportSettings || {};

    const currentDate = reportDate || new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const hijriDate = new Date().toLocaleDateString('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div
            ref={ref}
            className="print-template bg-white dark:bg-gray-900 text-black"
            style={{
                fontFamily: settings.fontFamily || 'Cairo, sans-serif',
                direction: 'rtl',
                padding: '20mm 15mm',
                minHeight: orientation === 'landscape' ? '210mm' : '297mm',
                width: orientation === 'landscape' ? '297mm' : '210mm',
                position: 'relative',
            }}
        >
            {/* Watermark */}
            {showWatermark && organization.watermark && settings.showWatermark && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ zIndex: 0 }}
                >
                    <img
                        src={organization.watermark}
                        alt=""
                        className="opacity-5 max-w-[60%]"
                    />
                </div>
            )}

            {/* Content Container */}
            <div className="relative" style={{ zIndex: 1 }}>
                {/* Header */}
                {customHeader || (
                    <header className="border-b-2 border-gray-800 pb-4 mb-6">
                        <div className="flex items-start justify-between">
                            {/* Logo */}
                            {settings.showLogo !== false && organization.logo && (
                                <div className="flex-shrink-0">
                                    <img
                                        src={organization.logo}
                                        alt={organization.name}
                                        style={{ height: `${settings.headerHeight || 60}px` }}
                                    />
                                </div>
                            )}

                            {/* Organization Info */}
                            <div className="text-center flex-1 px-4">
                                <h1 className="text-xl font-bold">{organization.name}</h1>
                                {organization.nameEn && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300" style={{ direction: 'ltr' }}>
                                        {organization.nameEn}
                                    </p>
                                )}
                                {department && (
                                    <p className="text-sm font-semibold mt-1">{department}</p>
                                )}
                                {section && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{section}</p>
                                )}
                            </div>

                            {/* Report Info */}
                            <div className="text-left text-sm flex-shrink-0">
                                {reportNumber && (
                                    <p className="font-mono">الرقم: {reportNumber}</p>
                                )}
                                <p>التاريخ: {currentDate}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{hijriDate}</p>
                            </div>
                        </div>
                    </header>
                )}

                {/* Report Title */}
                {(title || subtitle) && (
                    <div className="text-center mb-6">
                        {title && (
                            <h2 className="text-2xl font-bold border-b-2 border-gray-400 inline-block pb-2 px-8">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-gray-600 dark:text-gray-300 mt-2">{subtitle}</p>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <main className="mb-8">
                    {children}
                </main>

                {/* Signatures */}
                {settings.showSignatures !== false && signatures.length > 0 && (
                    <SignaturesSection
                        signatures={signatures}
                        stamp={showStamp && settings.showStamp !== false ? organization.stamp : null}
                        placement={organization.signatureSettings?.signaturePlacement || 'footer'}
                        showJobTitle={organization.signatureSettings?.showJobTitle !== false}
                        showDate={organization.signatureSettings?.showDate !== false}
                    />
                )}

                {/* Footer */}
                {customFooter || (
                    <footer className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
                        <div className="flex items-end justify-between">
                            {/* Contact Info */}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                <p>{organization.address}</p>
                                <p>
                                    هاتف: {organization.phone}
                                    {organization.fax && ` | فاكس: ${organization.fax}`}
                                </p>
                                <p>
                                    {organization.email}
                                    {organization.website && ` | ${organization.website}`}
                                </p>
                            </div>

                            {/* QR Code */}
                            {showQRCode && settings.showQRCode !== false && (
                                <div className="flex flex-col items-center">
                                    <QRCodePlaceholder
                                        data={`${organization.name}|${reportNumber || 'N/A'}|${currentDate}`}
                                    />
                                    <p className="text-[8px] text-gray-400 mt-1">للتحقق من صحة المستند</p>
                                </div>
                            )}

                            {/* Page Number Placeholder */}
                            <div className="text-xs text-gray-400">
                                صفحة <span className="page-number">1</span>
                            </div>
                        </div>
                    </footer>
                )}
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4'};
                        margin: ${settings.margins?.top || 20}mm ${settings.margins?.right || 15}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 15}mm;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .print-template {
                        padding: 0 !important;
                        min-height: auto !important;
                        width: auto !important;
                    }

                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
});

PrintTemplate.displayName = 'PrintTemplate';

/**
 * قسم التوقيعات
 */
function SignaturesSection({ signatures, stamp, placement, showJobTitle, showDate }) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
    };

    return (
        <div className={`mt-12 pt-6 border-t-2 border-gray-300 dark:border-gray-600 ${placement === 'side' ? 'flex' : ''}`}>
            {placement !== 'side' && (
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">التوقيعات والاعتمادات</h4>
            )}
            <div className={`grid ${gridCols[signatures.length] || 'grid-cols-3'} gap-6`}>
                {signatures.map((sig, idx) => (
                    <div key={idx} className="text-center relative">
                        <p className="font-bold text-sm">{sig.role}</p>
                        {showJobTitle && sig.title && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sig.title}</p>
                        )}
                        <div className="mt-6 mb-2">
                            {sig.signature ? (
                                <img
                                    src={sig.signature}
                                    alt="توقيع"
                                    className="h-12 mx-auto"
                                />
                            ) : (
                                <div className="h-12"></div>
                            )}
                        </div>
                        <div className="border-b border-gray-400 w-32 mx-auto"></div>
                        <p className="text-sm font-medium mt-2">{sig.name || '...................'}</p>
                        {showDate && sig.date && (
                            <p className="text-xs text-gray-400">{sig.date}</p>
                        )}

                        {/* Show stamp on last signature */}
                        {stamp && idx === signatures.length - 1 && (
                            <img
                                src={stamp}
                                alt="ختم"
                                className="absolute -top-4 -left-4 w-24 h-24 opacity-60"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * QR Code Placeholder (يمكن استبداله بمكتبة QR حقيقية)
 */
function QRCodePlaceholder({ data }) {
    return (
        <div
            className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded flex items-center justify-center"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Cg fill='%23374151'%3E%3Crect x='10' y='10' width='30' height='30'/%3E%3Crect x='60' y='10' width='30' height='30'/%3E%3Crect x='10' y='60' width='30' height='30'/%3E%3Crect x='50' y='50' width='10' height='10'/%3E%3Crect x='70' y='50' width='10' height='10'/%3E%3Crect x='50' y='70' width='10' height='10'/%3E%3Crect x='70' y='70' width='20' height='20'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: 'contain',
            }}
        />
    );
}

/**
 * جدول قابل للطباعة
 */
export function PrintTable({ columns, data, showRowNumbers = true, striped = true }) {
    return (
        <table className="w-full border-collapse text-sm">
            <thead>
                <tr className="bg-gray-100 dark:bg-gray-700/50">
                    {showRowNumbers && (
                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-center w-12">م</th>
                    )}
                    {columns.map((col, idx) => (
                        <th
                            key={idx}
                            className="border border-gray-300 dark:border-gray-600 p-2"
                            style={{ width: col.width, textAlign: col.align || 'right' }}
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIdx) => (
                    <tr key={rowIdx} className={striped && rowIdx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                        {showRowNumbers && (
                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">{rowIdx + 1}</td>
                        )}
                        {columns.map((col, colIdx) => (
                            <td
                                key={colIdx}
                                className="border border-gray-300 dark:border-gray-600 p-2"
                                style={{ textAlign: col.align || 'right' }}
                            >
                                {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/**
 * قسم معلومات في التقرير
 */
export function PrintInfoSection({ title, items }) {
    return (
        <div className="mb-6">
            {title && (
                <h4 className="font-bold text-sm bg-gray-100 dark:bg-gray-700/50 p-2 mb-2">{title}</h4>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {items.map((item, idx) => (
                    <div key={idx} className="flex">
                        <span className="text-gray-600 dark:text-gray-300 ml-2">{item.label}:</span>
                        <span className="font-medium">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * ملخص/إجمالي
 */
export function PrintSummary({ items, title = 'الملخص' }) {
    return (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
            <h4 className="font-bold text-sm mb-3">{title}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((item, idx) => (
                    <div key={idx} className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="text-lg font-bold">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PrintTemplate;
