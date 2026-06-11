/**
 * قالب التقارير الموحد
 * يستخدم لجميع التقارير والمخرجات مع تكامل كامل مع إعدادات الجهة
 */

import React, { forwardRef, useMemo } from 'react';
import { useOrganization } from '@/context/OrganizationContext';

import { fmtDate } from '../../utils/hijriDate';

/**
 * قالب التقرير الموحد
 * يدعم: PDF، الطباعة، العرض على الشاشة
 */
const UnifiedReportTemplate = forwardRef(({
    // محتوى التقرير
    children,
    title,
    subtitle,
    reportNumber,
    reportDate,

    // إعدادات الصفحة
    orientation = 'portrait', // 'portrait' | 'landscape'
    paperSize = 'A4',
    showBorder = true,

    // التحكم في العناصر
    showHeader = true,
    showFooter = true,
    showLogo = null, // null = من الإعدادات
    showStamp = null,
    showWatermark = null,
    showQRCode = null,
    showSignatures = null,

    // التوقيعات
    signatures = [],

    // رقم الصفحة
    pageNumber,
    totalPages,

    // نوع التقرير
    reportType = 'general', // 'general' | 'official' | 'letter' | 'certificate'

    // CSS مخصص
    className = '',
    style = {},
}, ref) => {
    const { organization } = useOrganization();
    const settings = organization?.reportSettings || {};

    // تحديد قيم العرض
    const display = useMemo(() => ({
        logo: showLogo ?? settings.showLogo ?? true,
        stamp: showStamp ?? settings.showStamp ?? true,
        watermark: showWatermark ?? settings.showWatermark ?? false,
        qrCode: showQRCode ?? settings.showQRCode ?? true,
        signatures: showSignatures ?? settings.showSignatures ?? true,
    }), [showLogo, showStamp, showWatermark, showQRCode, showSignatures, settings]);

    // أبعاد الصفحة
    const pageDimensions = useMemo(() => {
        const sizes = {
            'A4': { width: '210mm', height: '297mm' },
            'A3': { width: '297mm', height: '420mm' },
            'Letter': { width: '215.9mm', height: '279.4mm' },
            'Legal': { width: '215.9mm', height: '355.6mm' },
        };
        const size = sizes[paperSize] || sizes['A4'];
        return orientation === 'landscape'
            ? { width: size.height, height: size.width }
            : size;
    }, [paperSize, orientation]);

    // التاريخ الحالي
    const currentDate = useMemo(() => {
        const date = reportDate ? new Date(reportDate) : new Date();
        return {
            gregorian: fmtDate(date),
            hijri: date.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' }),
        };
    }, [reportDate]);

    // إنشاء رمز QR (placeholder)
    const qrCodeUrl = useMemo(() => {
        if (!display.qrCode) return null;
        const data = encodeURIComponent(JSON.stringify({
            org: organization?.name,
            report: reportNumber || title,
            date: currentDate.gregorian,
        }));
        return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${data}`;
    }, [display.qrCode, organization?.name, reportNumber, title, currentDate.gregorian]);

    return (
        <div
            ref={ref}
            className={`unified-report ${className}`}
            style={{
                ...style,
                fontFamily: settings.fontFamily || 'Cairo, sans-serif',
                direction: 'rtl',
                backgroundColor: '#fff',
                position: 'relative',
                minHeight: pageDimensions.height,
                width: pageDimensions.width,
                maxWidth: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
            }}
        >
            {/* العلامة المائية */}
            {display.watermark && organization?.watermark && (
                <div
                    className="watermark"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        opacity: 0.08,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                >
                    <img
                        src={organization.watermark}
                        alt=""
                        style={{ maxWidth: '60%', maxHeight: '60%' }}
                    />
                </div>
            )}

            {/* رأس التقرير */}
            {showHeader && (
                <ReportHeader
                    organization={organization}
                    title={title}
                    subtitle={subtitle}
                    reportNumber={reportNumber}
                    currentDate={currentDate}
                    display={display}
                    reportType={reportType}
                />
            )}

            {/* محتوى التقرير */}
            <div
                className="report-content"
                style={{
                    padding: `${settings.margins?.top || 20}mm ${settings.margins?.right || 15}mm ${settings.margins?.bottom || 20}mm ${settings.margins?.left || 15}mm`,
                    position: 'relative',
                    zIndex: 1,
                    minHeight: 'calc(100% - 200px)',
                }}
            >
                {children}
            </div>

            {/* التوقيعات */}
            {display.signatures && signatures.length > 0 && (
                <SignaturesSection
                    signatures={signatures}
                    settings={organization?.signatureSettings}
                    stamp={display.stamp ? organization?.stamp : null}
                />
            )}

            {/* تذييل التقرير */}
            {showFooter && (
                <ReportFooter
                    organization={organization}
                    pageNumber={pageNumber}
                    totalPages={totalPages}
                    qrCodeUrl={qrCodeUrl}
                    showBorder={showBorder}
                />
            )}

            {/* أنماط الطباعة */}
            <style jsx>{`
                @media print {
                    .unified-report {
                        width: ${pageDimensions.width} !important;
                        min-height: ${pageDimensions.height} !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }

                    @page {
                        size: ${paperSize} ${orientation};
                        margin: 10mm;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .watermark {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
});

UnifiedReportTemplate.displayName = 'UnifiedReportTemplate';

/**
 * رأس التقرير
 */
function ReportHeader({ organization, title, subtitle, reportNumber, currentDate, display, reportType }) {
    const isOfficial = reportType === 'official' || reportType === 'letter';

    return (
        <div
            className="report-header"
            style={{
                borderBottom: isOfficial ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
                padding: '15mm 15mm 10mm 15mm',
                marginBottom: '10mm',
            }}
        >
            {/* الصف الأول: الشعار واسم الجهة */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                {/* الشعار واسم الجهة */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {display.logo && organization?.logo && (
                        <img
                            src={organization.logo}
                            alt={organization.name}
                            style={{ height: '60px', objectFit: 'contain' }}
                        />
                    )}
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
                            {organization?.name || 'منصة مسارات'}
                        </h1>
                        {organization?.nameEn && (
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', direction: 'ltr', textAlign: 'right' }}>
                                {organization.nameEn}
                            </p>
                        )}
                    </div>
                </div>

                {/* رمز QR أو الختم */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    {display.stamp && organization?.stamp && (
                        <img
                            src={organization.stamp}
                            alt="الختم الرسمي"
                            style={{ height: '50px', opacity: 0.8 }}
                        />
                    )}
                </div>
            </div>

            {/* الصف الثاني: عنوان التقرير */}
            {title && (
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#111827',
                        borderBottom: isOfficial ? '2px double #1d4ed8' : 'none',
                        paddingBottom: isOfficial ? '8px' : '0',
                        display: 'inline-block',
                    }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
            )}

            {/* الصف الثالث: رقم التقرير والتاريخ */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '15px',
                fontSize: '12px',
                color: '#4b5563',
            }}>
                <div>
                    {reportNumber && (
                        <span>رقم التقرير: <strong>{reportNumber}</strong></span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span>التاريخ الهجري: {currentDate.hijri}</span>
                    <span>التاريخ الميلادي: {currentDate.gregorian}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * قسم التوقيعات
 */
function SignaturesSection({ signatures, settings, stamp }) {
    const maxSignatures = settings?.maxSignatures || 4;
    const displayedSignatures = signatures.slice(0, maxSignatures);
    const columns = Math.min(displayedSignatures.length, 4);

    return (
        <div
            className="signatures-section"
            style={{
                borderTop: '1px solid #e5e7eb',
                padding: '20mm 15mm 10mm 15mm',
                marginTop: '20mm',
            }}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '20px',
                textAlign: 'center',
            }}>
                {displayedSignatures.map((sig, idx) => (
                    <div key={idx} style={{ padding: '10px' }}>
                        {/* مساحة التوقيع */}
                        <div style={{
                            height: '60px',
                            borderBottom: '1px solid #9ca3af',
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                        }}>
                            {sig.signature && (
                                <img
                                    src={sig.signature}
                                    alt="التوقيع"
                                    style={{ maxHeight: '50px', maxWidth: '100px' }}
                                />
                            )}
                        </div>

                        {/* اسم الموقع */}
                        <p style={{ margin: '5px 0', fontSize: '12px', fontWeight: 'bold', color: '#111827' }}>
                            {sig.name}
                        </p>

                        {/* المسمى الوظيفي */}
                        {settings?.showJobTitle && sig.title && (
                            <p style={{ margin: '2px 0', fontSize: '11px', color: '#6b7280' }}>
                                {sig.title}
                            </p>
                        )}

                        {/* التاريخ */}
                        {settings?.showDate && sig.date && (
                            <p style={{ margin: '2px 0', fontSize: '10px', color: '#9ca3af' }}>
                                {fmtDate(sig.date)}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* الختم في الوسط */}
            {stamp && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <img
                        src={stamp}
                        alt="الختم الرسمي"
                        style={{ height: '80px', opacity: 0.9 }}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * تذييل التقرير
 */
function ReportFooter({ organization, pageNumber, totalPages, qrCodeUrl, showBorder }) {
    return (
        <div
            className="report-footer"
            style={{
                borderTop: showBorder ? '1px solid #e5e7eb' : 'none',
                padding: '10mm 15mm',
                fontSize: '10px',
                color: '#6b7280',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#fff',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* معلومات التواصل */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {organization?.phone && (
                        <span>هاتف: {organization.phone}</span>
                    )}
                    {organization?.email && (
                        <span>بريد: {organization.email}</span>
                    )}
                    {organization?.website && (
                        <span>موقع: {organization.website}</span>
                    )}
                </div>

                {/* العنوان */}
                <div style={{ textAlign: 'center' }}>
                    {organization?.address && (
                        <div>{organization.address}</div>
                    )}
                    {organization?.city && (
                        <div>{organization.city} - ص.ب: {organization.poBox || '-'}</div>
                    )}
                </div>

                {/* رمز QR ورقم الصفحة */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {qrCodeUrl && (
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            style={{ width: '50px', height: '50px' }}
                        />
                    )}
                    {pageNumber && totalPages && (
                        <div style={{ textAlign: 'center' }}>
                            <div>صفحة</div>
                            <div style={{ fontWeight: 'bold' }}>{pageNumber} / {totalPages}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* السجل التجاري والرقم الضريبي */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '30px',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px dashed #e5e7eb',
                fontSize: '9px',
            }}>
                {organization?.crNumber && (
                    <span>سجل تجاري: {organization.crNumber}</span>
                )}
                {organization?.vatNumber && (
                    <span>الرقم الضريبي: {organization.vatNumber}</span>
                )}
            </div>
        </div>
    );
}

export default UnifiedReportTemplate;

/**
 * مكون بسيط لعرض جدول البيانات في التقرير
 */
export function ReportTable({ columns, data, showRowNumbers = true, striped = true }) {
    return (
        <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            marginTop: '10px',
        }}>
            <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                    {showRowNumbers && (
                        <th style={{
                            padding: '10px 8px',
                            border: '1px solid #d1d5db',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: '40px',
                        }}>
                            #
                        </th>
                    )}
                    {columns.map((col, idx) => (
                        <th
                            key={idx}
                            style={{
                                padding: '10px 8px',
                                border: '1px solid #d1d5db',
                                fontWeight: 'bold',
                                textAlign: col.align || 'right',
                                width: col.width,
                            }}
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIdx) => (
                    <tr
                        key={rowIdx}
                        style={{
                            backgroundColor: striped && rowIdx % 2 === 1 ? '#f9fafb' : '#fff',
                        }}
                    >
                        {showRowNumbers && (
                            <td style={{
                                padding: '8px',
                                border: '1px solid #d1d5db',
                                textAlign: 'center',
                                color: '#6b7280',
                            }}>
                                {rowIdx + 1}
                            </td>
                        )}
                        {columns.map((col, colIdx) => (
                            <td
                                key={colIdx}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #d1d5db',
                                    textAlign: col.align || 'right',
                                }}
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
 * مكون ملخص التقرير
 */
export function ReportSummary({ items }) {
    return (
        <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
        }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>
                ملخص التقرير
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: item.color || '#1e40af' }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
