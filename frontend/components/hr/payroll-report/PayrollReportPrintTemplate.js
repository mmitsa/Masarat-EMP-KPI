/**
 * قالب طباعة تقرير الرواتب
 * Payroll Report Print Template Component
 */

import React, { forwardRef } from 'react';
import {
    formatCurrency,
    formatDateArabic,
    formatHijriDate,
    toArabicNumerals,
    getReportTypeByCode,
} from '../../../constants/payroll-report-types';

const PayrollReportPrintTemplate = forwardRef(({ report, settings }, ref) => {
    if (!report) return null;

    const {
        referenceNumber,
        reportType,
        generatedAt,
        financialPeriod,
        employee,
        salary,
        audit,
    } = report;

    const numberFormat = settings?.numberFormat || 'english';
    const reportTypeInfo = getReportTypeByCode(reportType);

    const format = (amount) => formatCurrency(amount, numberFormat, false);
    const formatWithCurrency = (amount) => formatCurrency(amount, numberFormat, true);

    // حساب الإجماليات
    const totalAllowances = salary?.totalAllowances ||
        (salary?.allowances?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0);
    const totalDeductions = salary?.totalDeductions ||
        (salary?.deductions?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0);
    const grossSalary = salary?.grossSalary || ((salary?.basic || 0) + totalAllowances);
    const netSalary = salary?.netSalary || (grossSalary - totalDeductions);

    return (
        <div ref={ref} className="print-template" dir="rtl">
            <style jsx>{`
                .print-template {
                    font-family: 'Tajawal', 'Cairo', 'Arial', sans-serif;
                    padding: 15mm 20mm;
                    background: white;
                    color: #1a1a1a;
                    font-size: 11pt;
                    line-height: 1.6;
                    max-width: 210mm;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #1d4ed8;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .header h1 {
                    color: #1d4ed8;
                    font-size: 22pt;
                    margin: 0 0 5px 0;
                }
                .header h2 {
                    color: #333;
                    font-size: 16pt;
                    margin: 0;
                }
                .header .subtitle {
                    color: #666;
                    font-size: 10pt;
                    margin-top: 5px;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding: 8px 12px;
                    background: #f8fafc;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .meta-item {
                    text-align: center;
                }
                .meta-label {
                    font-size: 9pt;
                    color: #64748b;
                }
                .meta-value {
                    font-weight: bold;
                    font-size: 10pt;
                    color: #1e293b;
                }
                .section {
                    margin-bottom: 20px;
                }
                .section-title {
                    background: #1d4ed8;
                    color: white;
                    padding: 6px 12px;
                    font-weight: bold;
                    font-size: 11pt;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }
                .info-item {
                    padding: 8px 10px;
                    background: #f8fafc;
                    border-radius: 4px;
                    border-right: 3px solid #1d4ed8;
                }
                .info-label {
                    font-size: 9pt;
                    color: #64748b;
                    margin-bottom: 2px;
                }
                .info-value {
                    font-weight: bold;
                    font-size: 10pt;
                    color: #1e293b;
                }
                .period-box {
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 6px;
                    padding: 10px 15px;
                    text-align: center;
                    margin-bottom: 15px;
                }
                .period-label {
                    color: #1d4ed8;
                    font-weight: bold;
                    font-size: 10pt;
                    margin-bottom: 5px;
                }
                .period-dates {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    font-size: 10pt;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 8px;
                }
                table th {
                    background: #1d4ed8;
                    color: white;
                    padding: 8px 10px;
                    text-align: right;
                    font-size: 10pt;
                    font-weight: bold;
                }
                table th:last-child {
                    text-align: left;
                }
                table td {
                    border: 1px solid #e2e8f0;
                    padding: 8px 10px;
                    font-size: 10pt;
                }
                table td:last-child {
                    text-align: left;
                    font-family: monospace;
                    width: 120px;
                }
                table tr:nth-child(even) {
                    background: #f8fafc;
                }
                .row-category {
                    background: #f1f5f9 !important;
                    font-weight: bold;
                    color: #475569;
                }
                .row-allowance td:last-child {
                    color: #16a34a;
                }
                .row-deduction td:last-child {
                    color: #dc2626;
                }
                .row-subtotal {
                    background: #f1f5f9 !important;
                    font-weight: bold;
                }
                .row-subtotal.allowance {
                    border-top: 2px solid #16a34a;
                }
                .row-subtotal.allowance td:last-child {
                    color: #16a34a;
                }
                .row-subtotal.deduction {
                    border-top: 2px solid #dc2626;
                }
                .row-subtotal.deduction td:last-child {
                    color: #dc2626;
                }
                .row-total {
                    background: #1d4ed8 !important;
                    color: white !important;
                    font-weight: bold;
                    font-size: 12pt;
                }
                .row-total td {
                    border-color: #1d4ed8;
                    color: white;
                }
                .signature-section {
                    margin-top: 40px;
                    page-break-inside: avoid;
                }
                .signature-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-top: 15px;
                }
                .signature-box {
                    text-align: center;
                    padding: 10px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                }
                .signature-title {
                    font-weight: bold;
                    font-size: 10pt;
                    margin-bottom: 40px;
                    color: #1e293b;
                }
                .signature-line {
                    border-top: 1px solid #64748b;
                    width: 80%;
                    margin: 0 auto;
                    padding-top: 5px;
                    font-size: 9pt;
                    color: #64748b;
                }
                .signature-name {
                    margin-top: 8px;
                    font-size: 9pt;
                    color: #475569;
                }
                .signature-date {
                    margin-top: 5px;
                    font-size: 8pt;
                    color: #94a3b8;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 2px solid #1d4ed8;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .qr-placeholder {
                    width: 60px;
                    height: 60px;
                    background: #f1f5f9;
                    border: 1px dashed #cbd5e1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 7pt;
                    color: #94a3b8;
                    border-radius: 4px;
                }
                .footer-text {
                    text-align: center;
                    font-size: 8pt;
                    color: #64748b;
                }
                @media print {
                    .print-template {
                        padding: 10mm 15mm;
                    }
                    .section {
                        page-break-inside: avoid;
                    }
                    .signature-section {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="header">
                <h1>منصة مسارات الموحدة</h1>
                <h2>{reportTypeInfo?.name || 'حصر رواتب ومستحقات موظف'}</h2>
                <div className="subtitle">Employee Payroll & Entitlements Report</div>
            </div>

            {/* Meta Info */}
            <div className="meta-row">
                <div className="meta-item">
                    <div className="meta-label">الرقم المرجعي</div>
                    <div className="meta-value">{referenceNumber}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">تاريخ الإصدار (ميلادي)</div>
                    <div className="meta-value">{formatDateArabic(generatedAt)}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">تاريخ الإصدار (هجري)</div>
                    <div className="meta-value">{formatHijriDate(generatedAt)}</div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="section">
                <div className="section-title">بيانات الموظف</div>
                <div className="info-grid">
                    <div className="info-item">
                        <div className="info-label">الاسم الكامل</div>
                        <div className="info-value">{employee?.nameAr || employee?.fullName || '-'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">الرقم الوظيفي</div>
                        <div className="info-value">{employee?.employeeNumber || '-'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">رقم الهوية</div>
                        <div className="info-value">{employee?.nationalId || '-'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">المسمى الوظيفي</div>
                        <div className="info-value">{employee?.position || '-'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">القسم / الإدارة</div>
                        <div className="info-value">{employee?.department || '-'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">تاريخ التعيين</div>
                        <div className="info-value">{formatDateArabic(employee?.hireDate)}</div>
                    </div>
                </div>
            </div>

            {/* Financial Period */}
            {financialPeriod && (
                <div className="period-box">
                    <div className="period-label">الفترة المالية</div>
                    <div className="period-dates">
                        <span>من: {formatDateArabic(financialPeriod.from)}</span>
                        <span>إلى: {formatDateArabic(financialPeriod.to)}</span>
                    </div>
                </div>
            )}

            {/* Salary Details */}
            <div className="section">
                <div className="section-title">تفاصيل الراتب والمستحقات</div>
                <table>
                    <thead>
                        <tr>
                            <th>البند</th>
                            <th>المبلغ (ر.س)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Basic Salary */}
                        <tr>
                            <td>الراتب الأساسي</td>
                            <td>{format(salary?.basic || 0)}</td>
                        </tr>

                        {/* Allowances */}
                        {salary?.allowances?.length > 0 && (
                            <>
                                <tr className="row-category">
                                    <td colSpan="2">البدلات والعلاوات</td>
                                </tr>
                                {salary.allowances.map((allowance, index) => (
                                    <tr key={`allowance-${index}`} className="row-allowance">
                                        <td style={{ paddingRight: '25px' }}>
                                            • {allowance.nameAr || allowance.name}
                                        </td>
                                        <td>+ {format(allowance.amount)}</td>
                                    </tr>
                                ))}
                                <tr className="row-subtotal allowance">
                                    <td>إجمالي البدلات</td>
                                    <td>+ {format(totalAllowances)}</td>
                                </tr>
                            </>
                        )}

                        {/* Gross Salary */}
                        <tr className="row-subtotal">
                            <td>إجمالي الراتب</td>
                            <td>{format(grossSalary)}</td>
                        </tr>

                        {/* Deductions */}
                        {salary?.deductions?.length > 0 && (
                            <>
                                <tr className="row-category">
                                    <td colSpan="2">الخصومات</td>
                                </tr>
                                {salary.deductions.map((deduction, index) => (
                                    <tr key={`deduction-${index}`} className="row-deduction">
                                        <td style={{ paddingRight: '25px' }}>
                                            • {deduction.nameAr || deduction.name}
                                        </td>
                                        <td>- {format(deduction.amount)}</td>
                                    </tr>
                                ))}
                                <tr className="row-subtotal deduction">
                                    <td>إجمالي الخصومات</td>
                                    <td>- {format(totalDeductions)}</td>
                                </tr>
                            </>
                        )}

                        {/* Net Salary */}
                        <tr className="row-total">
                            <td>صافي المستحقات</td>
                            <td>{format(netSalary)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Signatures */}
            <div className="signature-section">
                <div className="section-title">التوقيعات</div>
                <div className="signature-grid">
                    <div className="signature-box">
                        <div className="signature-title">الموظف المختص</div>
                        <div className="signature-line">التوقيع</div>
                        <div className="signature-name">
                            الاسم: {audit?.preparer?.name || settings?.preparer?.fullName || '_______________'}
                        </div>
                        <div className="signature-date">التاريخ: _______________</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-title">المدقق</div>
                        <div className="signature-line">التوقيع</div>
                        <div className="signature-name">
                            الاسم: {audit?.auditor?.name || settings?.auditor?.fullName || '_______________'}
                        </div>
                        <div className="signature-date">التاريخ: _______________</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-title">مدير الموارد البشرية</div>
                        <div className="signature-line">التوقيع</div>
                        <div className="signature-name">الاسم: _______________</div>
                        <div className="signature-date">التاريخ: _______________</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="footer">
                <div className="qr-placeholder">QR Code</div>
                <div className="footer-text">
                    <p>هذه الوثيقة صادرة إلكترونياً من منصة مسارات الموحدة</p>
                    <p>للتحقق من صحة الوثيقة: {referenceNumber}</p>
                </div>
                <div style={{ width: '60px' }}></div>
            </div>
        </div>
    );
});

PayrollReportPrintTemplate.displayName = 'PayrollReportPrintTemplate';

export default PayrollReportPrintTemplate;
