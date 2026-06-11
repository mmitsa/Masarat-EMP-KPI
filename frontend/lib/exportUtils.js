/**
 * أدوات التصدير الموحدة
 * تكامل كامل مع إعدادات الجهة لجميع المخرجات
 * PDF - Excel - CSV - الطباعة
 */
import { fmtDate } from '../utils/hijriDate';

/**
 * الحصول على إعدادات الجهة من localStorage
 */
function getOrganizationSettings() {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem('masarat-organization');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

/**
 * إعدادات الجهة الافتراضية
 */
const defaultOrganization = {
    name: 'منصة مسارات',
    nameEn: 'Masarat Platform',
    shortName: 'مسارات',
    phone: '',
    fax: '',
    email: 'info@masarat.sa',
    website: 'www.masarat.sa',
    address: 'المملكة العربية السعودية',
    city: 'الرياض',
    postalCode: '12345',
    poBox: '12345',
    crNumber: '',
    vatNumber: '',
    logo: null,
    stamp: null,
    watermark: null,
    reportSettings: {
        showLogo: true,
        showStamp: true,
        showWatermark: false,
        showQRCode: true,
        fontFamily: 'Cairo',
    },
};

/**
 * إنشاء رأس التقرير HTML
 */
function createReportHeader(organization, options = {}) {
    const { title, subtitle, reportNumber, showLogo = true, showStamp = true } = options;
    const org = organization || defaultOrganization;
    const currentDate = new Date();
    const gregorianDate = fmtDate(currentDate);
    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
        <div class="report-header" style="border-bottom: 2px solid #1d4ed8; padding: 20px 0; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${showLogo && org.logo ? `<img src="${org.logo}" alt="${org.name}" style="height: 60px; object-fit: contain;">` : ''}
                    <div>
                        <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #1e40af;">${org.name}</h1>
                        ${org.nameEn ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280; direction: ltr; text-align: right;">${org.nameEn}</p>` : ''}
                    </div>
                </div>
                ${showStamp && org.stamp ? `<img src="${org.stamp}" alt="الختم" style="height: 50px; opacity: 0.8;">` : ''}
            </div>
            ${title ? `
                <div style="text-align: center; margin-top: 20px;">
                    <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #111827; border-bottom: 2px double #1d4ed8; padding-bottom: 8px; display: inline-block;">${title}</h2>
                    ${subtitle ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">${subtitle}</p>` : ''}
                </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; color: #4b5563;">
                <div>${reportNumber ? `رقم التقرير: <strong>${reportNumber}</strong>` : ''}</div>
                <div style="display: flex; gap: 20px;">
                    <span>هـ: ${hijriDate}</span>
                    <span>م: ${gregorianDate}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * إنشاء تذييل التقرير HTML
 */
function createReportFooter(organization, options = {}) {
    const { pageNumber, totalPages, showQRCode = true } = options;
    const org = organization || defaultOrganization;

    // إنشاء رابط QR Code
    const qrData = encodeURIComponent(JSON.stringify({ org: org.name, date: new Date().toISOString() }));
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${qrData}`;

    return `
        <div class="report-footer" style="border-top: 1px solid #e5e7eb; padding: 15px 0; margin-top: 30px; font-size: 10px; color: #6b7280;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; flex-direction: column; gap: 3px;">
                    ${org.phone ? `<span>هاتف: ${org.phone}</span>` : ''}
                    ${org.email ? `<span>بريد: ${org.email}</span>` : ''}
                    ${org.website ? `<span>موقع: ${org.website}</span>` : ''}
                </div>
                <div style="text-align: center;">
                    ${org.address ? `<div>${org.address}</div>` : ''}
                    ${org.city ? `<div>${org.city} - ص.ب: ${org.poBox || '-'}</div>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${showQRCode ? `<img src="${qrUrl}" alt="QR" style="width: 50px; height: 50px;">` : ''}
                    ${pageNumber && totalPages ? `
                        <div style="text-align: center;">
                            <div>صفحة</div>
                            <div style="font-weight: bold;">${pageNumber} / ${totalPages}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 30px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb; font-size: 9px;">
                ${org.crNumber ? `<span>سجل تجاري: ${org.crNumber}</span>` : ''}
                ${org.vatNumber ? `<span>الرقم الضريبي: ${org.vatNumber}</span>` : ''}
            </div>
        </div>
    `;
}

/**
 * إنشاء العلامة المائية CSS
 */
function createWatermarkStyles(organization) {
    if (!organization?.watermark) return '';
    return `
        .report-content::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            width: 50%;
            height: 50%;
            background-image: url('${organization.watermark}');
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            opacity: 0.06;
            pointer-events: none;
            z-index: 0;
        }
    `;
}

/**
 * تصدير إلى PDF باستخدام الطباعة
 */
export async function exportToPDF(element, filename = 'report', options = {}) {
    const organization = getOrganizationSettings() || defaultOrganization;
    const settings = organization?.reportSettings || {};

    const {
        orientation = settings.orientation || 'portrait',
        paperSize = settings.paperSize || 'A4',
        showHeader = true,
        showFooter = true,
        showWatermark = settings.showWatermark ?? false,
        title,
        subtitle,
        reportNumber,
    } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
        return;
    }

    const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
            try {
                return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n');
            } catch {
                return '';
            }
        })
        .join('\n');

    const header = showHeader ? createReportHeader(organization, { title, subtitle, reportNumber }) : '';
    const footer = showFooter ? createReportFooter(organization) : '';
    const watermarkStyles = showWatermark ? createWatermarkStyles(organization) : '';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>${filename}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                ${styles}

                @page {
                    size: ${paperSize} ${orientation};
                    margin: 15mm;
                }

                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                body {
                    font-family: '${settings.fontFamily || 'Cairo'}', sans-serif;
                    margin: 0;
                    padding: 20px;
                    direction: rtl;
                    background: #fff;
                }

                .report-content {
                    position: relative;
                }

                ${watermarkStyles}

                .no-print {
                    display: none !important;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    border: 1px solid #d1d5db;
                    padding: 8px;
                    text-align: right;
                }

                th {
                    background-color: #f3f4f6;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            ${header}
            <div class="report-content">
                ${element.outerHTML}
            </div>
            ${footer}
        </body>
        </html>
    `);

    printWindow.document.close();

    await new Promise(resolve => {
        printWindow.onload = resolve;
        setTimeout(resolve, 1500);
    });

    printWindow.print();
    setTimeout(() => printWindow.close(), 100);
}

/**
 * تصدير إلى Excel مع بيانات الجهة
 */
export function exportToExcel(data, columns, filename = 'report', options = {}) {
    const organization = getOrganizationSettings() || defaultOrganization;

    const {
        sheetName = 'Sheet1',
        title,
        subtitle,
        includeHeader = true,
        includeSummary = false,
        summaryData = [],
        includeOrganization = true,
    } = options;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';

    // الأنماط
    xml += `<Styles>
        <Style ss:ID="OrgName">
            <Font ss:Bold="1" ss:Size="18" ss:Color="#1e40af"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
        </Style>
        <Style ss:ID="OrgNameEn">
            <Font ss:Size="12" ss:Color="#6b7280"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        </Style>
        <Style ss:ID="Title">
            <Font ss:Bold="1" ss:Size="16"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
        </Style>
        <Style ss:ID="Subtitle">
            <Font ss:Size="12" ss:Color="#6b7280"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
        </Style>
        <Style ss:ID="DateInfo">
            <Font ss:Size="10" ss:Color="#4b5563"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
        </Style>
        <Style ss:ID="Header">
            <Font ss:Bold="1" ss:Size="11"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
            <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
            <Borders>
                <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
            </Borders>
        </Style>
        <Style ss:ID="Cell">
            <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
            <Borders>
                <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
            </Borders>
        </Style>
        <Style ss:ID="CellCenter">
            <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
            <Borders>
                <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
            </Borders>
        </Style>
        <Style ss:ID="Number">
            <NumberFormat ss:Format="#,##0"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
            <Borders>
                <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
            </Borders>
        </Style>
        <Style ss:ID="Currency">
            <NumberFormat ss:Format="#,##0.00 &quot;ر.س&quot;"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
            <Borders>
                <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
                <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
            </Borders>
        </Style>
        <Style ss:ID="Footer">
            <Font ss:Size="9" ss:Color="#6b7280"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
        </Style>
    </Styles>`;

    xml += `<Worksheet ss:Name="${escapeXml(sheetName)}" ss:RightToLeft="1">\n<Table>\n`;

    // عرض الأعمدة
    columns.forEach((col, idx) => {
        xml += `<Column ss:Index="${idx + 1}" ss:Width="${col.width || 100}"/>\n`;
    });

    // بيانات الجهة
    if (includeOrganization && includeHeader) {
        // اسم الجهة
        xml += `<Row ss:Height="28"><Cell ss:StyleID="OrgName" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(organization.name)}</Data></Cell></Row>\n`;

        // الاسم الإنجليزي
        if (organization.nameEn) {
            xml += `<Row ss:Height="22"><Cell ss:StyleID="OrgNameEn" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(organization.nameEn)}</Data></Cell></Row>\n`;
        }

        // السجل التجاري والرقم الضريبي
        const regInfo = [];
        if (organization.crNumber) regInfo.push(`سجل تجاري: ${organization.crNumber}`);
        if (organization.vatNumber) regInfo.push(`الرقم الضريبي: ${organization.vatNumber}`);
        if (regInfo.length > 0) {
            xml += `<Row ss:Height="18"><Cell ss:StyleID="Footer" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(regInfo.join(' | '))}</Data></Cell></Row>\n`;
        }

        // صف فارغ
        xml += '<Row ss:Height="10"></Row>\n';
    }

    // عنوان التقرير
    if (title) {
        xml += `<Row ss:Height="30"><Cell ss:StyleID="Title" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>\n`;

        if (subtitle) {
            xml += `<Row ss:Height="22"><Cell ss:StyleID="Subtitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(subtitle)}</Data></Cell></Row>\n`;
        }

        xml += '<Row ss:Height="8"></Row>\n';
    }

    // التاريخ
    const currentDate = new Date();
    const gregorianDate = fmtDate(currentDate);
    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic');
    xml += `<Row ss:Height="18"><Cell ss:StyleID="DateInfo" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">تاريخ التقرير: ${gregorianDate} | ${hijriDate}</Data></Cell></Row>\n`;
    xml += '<Row ss:Height="8"></Row>\n';

    // رؤوس الأعمدة
    xml += '<Row ss:Height="25">\n';
    columns.forEach(col => {
        xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>\n`;
    });
    xml += '</Row>\n';

    // البيانات
    data.forEach((row, idx) => {
        xml += '<Row ss:Height="20">\n';
        columns.forEach(col => {
            const value = col.render ? col.render(row[col.key], row, idx) : row[col.key];
            const type = col.type === 'number' || col.type === 'currency' ? 'Number' : 'String';
            const style = col.type === 'number' ? 'Number' : col.type === 'currency' ? 'Currency' : col.align === 'center' ? 'CellCenter' : 'Cell';
            xml += `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>\n`;
        });
        xml += '</Row>\n';
    });

    // الملخص
    if (includeSummary && summaryData.length > 0) {
        xml += '<Row ss:Height="10"></Row>\n';
        xml += `<Row ss:Height="25"><Cell ss:StyleID="Header" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">ملخص التقرير</Data></Cell></Row>\n`;

        summaryData.forEach(item => {
            xml += '<Row ss:Height="20">\n';
            xml += `<Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(item.label)}</Data></Cell>\n`;
            xml += `<Cell ss:StyleID="${item.type === 'number' ? 'Number' : 'Cell'}" ss:MergeAcross="${columns.length - 2}"><Data ss:Type="${item.type === 'number' ? 'Number' : 'String'}">${escapeXml(String(item.value))}</Data></Cell>\n`;
            xml += '</Row>\n';
        });
    }

    // تذييل الجهة
    if (includeOrganization && includeHeader) {
        xml += '<Row ss:Height="15"></Row>\n';
        const contactInfo = [];
        if (organization.phone) contactInfo.push(`هاتف: ${organization.phone}`);
        if (organization.email) contactInfo.push(`بريد: ${organization.email}`);
        if (organization.website) contactInfo.push(`موقع: ${organization.website}`);
        if (contactInfo.length > 0) {
            xml += `<Row ss:Height="16"><Cell ss:StyleID="Footer" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(contactInfo.join(' | '))}</Data></Cell></Row>\n`;
        }
        if (organization.address) {
            xml += `<Row ss:Height="16"><Cell ss:StyleID="Footer" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(organization.address)} - ${organization.city || ''}</Data></Cell></Row>\n`;
        }
    }

    xml += '</Table>\n</Worksheet>\n</Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    downloadBlob(blob, `${filename}.xls`);
}

/**
 * تصدير إلى CSV
 */
export function exportToCSV(data, columns, filename = 'report', options = {}) {
    const organization = getOrganizationSettings() || defaultOrganization;
    const { includeHeader = true, title } = options;

    let csv = '\uFEFF'; // BOM for UTF-8

    if (includeHeader) {
        csv += `"${organization.name}"\n`;
        if (organization.nameEn) csv += `"${organization.nameEn}"\n`;
        csv += '\n';
        if (title) csv += `"${title}"\n\n`;
        csv += `"تاريخ التصدير: ${fmtDate(new Date())}"\n\n`;
    }

    // رؤوس الأعمدة
    csv += columns.map(col => `"${col.header}"`).join(',') + '\n';

    // البيانات
    data.forEach(row => {
        csv += columns.map(col => {
            const value = col.render ? col.render(row[col.key], row) : row[col.key];
            return `"${String(value ?? '').replace(/"/g, '""')}"`;
        }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `${filename}.csv`);
}

/**
 * طباعة مباشرة مع بيانات الجهة
 */
export function printElement(element, options = {}) {
    const organization = getOrganizationSettings() || defaultOrganization;
    const settings = organization?.reportSettings || {};

    const {
        title,
        subtitle,
        reportNumber,
        showHeader = true,
        showFooter = true,
        showWatermark = settings.showWatermark ?? false,
    } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        window.print();
        return;
    }

    const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
            try {
                return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n');
            } catch {
                return '';
            }
        })
        .join('\n');

    const header = showHeader ? createReportHeader(organization, { title, subtitle, reportNumber }) : '';
    const footer = showFooter ? createReportFooter(organization) : '';
    const watermarkStyles = showWatermark ? createWatermarkStyles(organization) : '';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                ${styles}

                @page {
                    size: A4;
                    margin: 15mm;
                }

                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                body {
                    font-family: '${settings.fontFamily || 'Cairo'}', sans-serif;
                    margin: 0;
                    padding: 20px;
                    direction: rtl;
                }

                .report-content {
                    position: relative;
                }

                ${watermarkStyles}

                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
                th { background-color: #f3f4f6; font-weight: bold; }
            </style>
        </head>
        <body>
            ${header}
            <div class="report-content">${element.outerHTML}</div>
            ${footer}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

/**
 * طباعة محتوى HTML مباشرة
 */
export function printHTML(htmlContent, options = {}) {
    const organization = getOrganizationSettings() || defaultOrganization;
    const settings = organization?.reportSettings || {};

    const {
        title,
        subtitle,
        reportNumber,
        showHeader = true,
        showFooter = true,
    } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const header = showHeader ? createReportHeader(organization, { title, subtitle, reportNumber }) : '';
    const footer = showFooter ? createReportFooter(organization) : '';

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>${title || 'طباعة'}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 15mm; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                body { font-family: '${settings.fontFamily || 'Cairo'}', sans-serif; margin: 0; padding: 20px; direction: rtl; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
                th { background-color: #f3f4f6; font-weight: bold; }
            </style>
        </head>
        <body>
            ${header}
            <div class="report-content">${htmlContent}</div>
            ${footer}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}

// دوال مساعدة
function escapeXml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// دوال التنسيق
export function formatDateForExport(date) {
    if (!date) return '';
    return fmtDate(date);
}

export function formatNumberForExport(num) {
    if (num === null || num === undefined) return '';
    return Number(num).toLocaleString('ar-SA');
}

export function formatCurrencyForExport(amount) {
    if (amount === null || amount === undefined) return '';
    return `${Number(amount).toLocaleString('ar-SA')} ر.س`;
}

export default {
    exportToPDF,
    exportToExcel,
    exportToCSV,
    printElement,
    printHTML,
    formatDateForExport,
    formatNumberForExport,
    formatCurrencyForExport,
    getOrganizationSettings,
};
