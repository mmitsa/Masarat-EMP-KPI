/**
 * قالب طباعة إخلاء الطرف
 * Clearance Print Template Component
 */

import React, { forwardRef } from 'react';
import { CLEARANCE_DEPARTMENTS, TERMINATION_REASONS, calculateServiceDuration } from '../../../constants/clearance-types';

const ClearancePrintTemplate = forwardRef(({ clearance, settlement }, ref) => {
    if (!clearance) return null;

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'decimal',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    const serviceDuration = clearance.hireDate && clearance.terminationDate
        ? calculateServiceDuration(clearance.hireDate, clearance.terminationDate)
        : null;

    const terminationReason = TERMINATION_REASONS[clearance.terminationReason];

    return (
        <div ref={ref} className="print-template" dir="rtl">
            <style jsx>{`
                .print-template {
                    font-family: 'Tajawal', 'Arial', sans-serif;
                    padding: 20mm;
                    background: white;
                    color: #1a1a1a;
                    font-size: 12pt;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #1a5f2a;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #1a5f2a;
                    font-size: 28pt;
                    margin: 0 0 10px 0;
                }
                .header h2 {
                    color: #333;
                    font-size: 18pt;
                    margin: 0;
                }
                .header .subtitle {
                    color: #666;
                    font-size: 12pt;
                    margin-top: 5px;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }
                .meta-item {
                    text-align: center;
                }
                .meta-label {
                    font-size: 10pt;
                    color: #666;
                }
                .meta-value {
                    font-weight: bold;
                    font-size: 11pt;
                }
                .section {
                    margin-bottom: 25px;
                }
                .section-title {
                    background: #1a5f2a;
                    color: white;
                    padding: 8px 15px;
                    font-weight: bold;
                    font-size: 13pt;
                    margin-bottom: 15px;
                    border-radius: 5px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                .info-item {
                    padding: 10px;
                    background: #f9f9f9;
                    border-radius: 5px;
                    border-right: 4px solid #1a5f2a;
                }
                .info-label {
                    font-size: 10pt;
                    color: #666;
                    margin-bottom: 3px;
                }
                .info-value {
                    font-weight: bold;
                    font-size: 12pt;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                table th {
                    background: #1a5f2a;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    font-size: 11pt;
                }
                table td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: center;
                    font-size: 11pt;
                }
                table tr:nth-child(even) {
                    background: #f9f9f9;
                }
                .status-approved {
                    color: #059669;
                    font-weight: bold;
                }
                .status-pending {
                    color: #d97706;
                }
                .status-rejected {
                    color: #dc2626;
                    font-weight: bold;
                }
                .settlement-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 15px;
                }
                .settlement-box {
                    padding: 15px;
                    border-radius: 8px;
                }
                .settlement-box.entitlements {
                    background: #ecfdf5;
                    border: 2px solid #10b981;
                }
                .settlement-box.deductions {
                    background: #fef2f2;
                    border: 2px solid #ef4444;
                }
                .settlement-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    border-bottom: 1px dashed #ccc;
                }
                .settlement-total {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    margin-top: 10px;
                    background: white;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 14pt;
                }
                .net-amount {
                    text-align: center;
                    padding: 20px;
                    background: #1a5f2a;
                    color: white;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .net-amount .label {
                    font-size: 14pt;
                    margin-bottom: 5px;
                }
                .net-amount .value {
                    font-size: 24pt;
                    font-weight: bold;
                }
                .signature-section {
                    margin-top: 50px;
                    page-break-inside: avoid;
                }
                .signature-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                    margin-top: 20px;
                }
                .signature-box {
                    text-align: center;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                .signature-title {
                    font-weight: bold;
                    margin-bottom: 50px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    width: 80%;
                    margin: 0 auto;
                    padding-top: 5px;
                }
                .signature-date {
                    margin-top: 10px;
                    font-size: 10pt;
                    color: #666;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #1a5f2a;
                    text-align: center;
                    font-size: 10pt;
                    color: #666;
                }
                .qr-placeholder {
                    width: 80px;
                    height: 80px;
                    background: #f0f0f0;
                    border: 1px dashed #ccc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8pt;
                    color: #999;
                    margin: 0 auto;
                }
                @media print {
                    .print-template {
                        padding: 15mm;
                    }
                    .section {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="header">
                <h1>منصة مسارات الموحدة</h1>
                <h2>وثيقة إخلاء الطرف</h2>
                <div className="subtitle">Employee Clearance Certificate</div>
            </div>

            {/* Meta Info */}
            <div className="meta-row">
                <div className="meta-item">
                    <div className="meta-label">الرقم المرجعي</div>
                    <div className="meta-value">{clearance.referenceNumber}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">تاريخ الإصدار</div>
                    <div className="meta-value">{formatDate(new Date())}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">الحالة</div>
                    <div className="meta-value">{clearance.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}</div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="section">
                <div className="section-title">بيانات الموظف</div>
                <div className="info-grid">
                    <div className="info-item">
                        <div className="info-label">الاسم الكامل</div>
                        <div className="info-value">{clearance.employeeName}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">الرقم الوظيفي</div>
                        <div className="info-value">{clearance.employeeNumber}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">المسمى الوظيفي</div>
                        <div className="info-value">{clearance.position}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">القسم / الإدارة</div>
                        <div className="info-value">{clearance.departmentName}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">تاريخ التعيين</div>
                        <div className="info-value">{formatDate(clearance.hireDate)}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">آخر يوم عمل</div>
                        <div className="info-value">{formatDate(clearance.terminationDate)}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">مدة الخدمة</div>
                        <div className="info-value">
                            {serviceDuration
                                ? `${serviceDuration.years} سنة، ${serviceDuration.months} شهر، ${serviceDuration.days} يوم`
                                : '-'}
                        </div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">سبب إنهاء الخدمة</div>
                        <div className="info-value">{terminationReason?.label || clearance.terminationReason}</div>
                    </div>
                </div>
            </div>

            {/* Departments Status */}
            <div className="section">
                <div className="section-title">حالة إخلاء الطرف من الأقسام</div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>#</th>
                            <th style={{ width: '25%' }}>الإدارة / القسم</th>
                            <th style={{ width: '15%' }}>الحالة</th>
                            <th style={{ width: '20%' }}>المعتمد</th>
                            <th style={{ width: '15%' }}>التاريخ</th>
                            <th style={{ width: '20%' }}>التوقيع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clearance.departments?.map((dept, index) => {
                            const config = CLEARANCE_DEPARTMENTS[dept.id];
                            return (
                                <tr key={dept.id}>
                                    <td>{index + 1}</td>
                                    <td style={{ textAlign: 'right' }}>{config?.label || dept.name}</td>
                                    <td className={`status-${dept.status}`}>
                                        {dept.status === 'approved' ? 'تم الإخلاء' :
                                         dept.status === 'rejected' ? 'مرفوض' : 'معلق'}
                                    </td>
                                    <td>{dept.approvedBy || '-'}</td>
                                    <td>{dept.approvedDate ? formatDate(dept.approvedDate) : '-'}</td>
                                    <td></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Settlement */}
            {settlement && (
                <div className="section">
                    <div className="section-title">التسوية المالية</div>
                    <div className="settlement-section">
                        <div className="settlement-box entitlements">
                            <h4 style={{ color: '#059669', marginBottom: '10px' }}>المستحقات</h4>
                            <div className="settlement-row">
                                <span>راتب الشهر الأخير</span>
                                <span>{formatCurrency(settlement.final_salary)} ر.س</span>
                            </div>
                            <div className="settlement-row">
                                <span>بدل رصيد الإجازات ({settlement.leave_balance_days} يوم)</span>
                                <span>{formatCurrency(settlement.leave_balance_amount)} ر.س</span>
                            </div>
                            <div className="settlement-row">
                                <span>مكافأة نهاية الخدمة</span>
                                <span>{formatCurrency(settlement.end_of_service)} ر.س</span>
                            </div>
                            {settlement.other_allowances > 0 && (
                                <div className="settlement-row">
                                    <span>بدلات أخرى</span>
                                    <span>{formatCurrency(settlement.other_allowances)} ر.س</span>
                                </div>
                            )}
                            <div className="settlement-total" style={{ color: '#059669' }}>
                                <span>الإجمالي</span>
                                <span>{formatCurrency(settlement.total_entitlements)} ر.س</span>
                            </div>
                        </div>

                        <div className="settlement-box deductions">
                            <h4 style={{ color: '#dc2626', marginBottom: '10px' }}>الخصومات</h4>
                            <div className="settlement-row">
                                <span>رصيد السلف</span>
                                <span>{formatCurrency(settlement.loan_balance)} ر.س</span>
                            </div>
                            <div className="settlement-row">
                                <span>العهد النقدية</span>
                                <span>{formatCurrency(settlement.advance_balance)} ر.س</span>
                            </div>
                            {settlement.damages > 0 && (
                                <div className="settlement-row">
                                    <span>تلفيات / فقد</span>
                                    <span>{formatCurrency(settlement.damages)} ر.س</span>
                                </div>
                            )}
                            {settlement.other_deductions > 0 && (
                                <div className="settlement-row">
                                    <span>خصومات أخرى</span>
                                    <span>{formatCurrency(settlement.other_deductions)} ر.س</span>
                                </div>
                            )}
                            <div className="settlement-total" style={{ color: '#dc2626' }}>
                                <span>الإجمالي</span>
                                <span>{formatCurrency(settlement.total_deductions)} ر.س</span>
                            </div>
                        </div>
                    </div>

                    <div className="net-amount">
                        <div className="label">صافي المستحقات</div>
                        <div className="value">{formatCurrency(settlement.net_amount)} ريال سعودي</div>
                    </div>
                </div>
            )}

            {/* Declaration */}
            <div className="section" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                <p style={{ textAlign: 'justify' }}>
                    بناءً على ما ورد أعلاه، يُشهد بأن الموظف المذكور قد أتم إجراءات إخلاء الطرف من جميع
                    الإدارات والأقسام المعنية، وقام بتسليم كافة العهد والممتلكات التي كانت بحوزته،
                    وتمت تسوية جميع مستحقاته المالية وفقاً لنظام العمل السعودي.
                </p>
            </div>

            {/* Signatures */}
            <div className="signature-section">
                <div className="section-title">التوقيعات</div>
                <div className="signature-grid">
                    <div className="signature-box">
                        <div className="signature-title">الموظف</div>
                        <div className="signature-line">التوقيع</div>
                        <div className="signature-date">التاريخ: _______________</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-title">مدير الموارد البشرية</div>
                        <div className="signature-line">التوقيع</div>
                        <div className="signature-date">التاريخ: _______________</div>
                    </div>
                    <div className="signature-box">
                        <div className="signature-title">المدير العام</div>
                        <div className="signature-line">التوقيع</div>
                        <div className="signature-date">التاريخ: _______________</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="footer">
                <div className="qr-placeholder">QR Code</div>
                <p style={{ marginTop: '10px' }}>
                    هذه الوثيقة صادرة إلكترونياً من منصة مسارات الموحدة ولا تحتاج إلى توقيع
                </p>
                <p>
                    للتحقق من صحة الوثيقة: {clearance.referenceNumber}
                </p>
            </div>
        </div>
    );
});

ClearancePrintTemplate.displayName = 'ClearancePrintTemplate';

export default ClearancePrintTemplate;
