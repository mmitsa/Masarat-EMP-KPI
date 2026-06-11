/**
 * قالب طباعة قرار التكليف بالعمل خارج الدوام - وفق نظام التصميم الحكومي
 * Overtime Decision Print Template (gov-form design system)
 */

import React, { forwardRef } from 'react';
import { formatDateArabic } from '../../../../utils/hr-helpers';
import {
    OVERTIME_COMPENSATION_TYPES,
    ARABIC_ORDINALS,
} from '../../../../constants/secondment-decision-articles';

const OvertimeDecisionPrint = forwardRef(({ decision }, ref) => {
    if (!decision) return null;

    const {
        employees = [],
        authority,
        articles = [],
        clauses = [],
        decisionNumber,
        decisionDate,
        compensationType,
        startDate,
        endDate,
        dailyHours,
        reason,
    } = decision;

    const isMultipleEmployees = employees.length > 1;

    // تنسيق التاريخ الهجري
    const formatHijriDate = (date) => {
        try {
            return new Date(date).toLocaleDateString('ar-SA-u-ca-islamic', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return date;
        }
    };

    // الحصول على اسم نوع التعويض
    const getCompensationLabel = (type) => {
        return OVERTIME_COMPENSATION_TYPES[type]?.label || type;
    };

    return (
        <div ref={ref} className="gov-form" dir="rtl">
            {/* ═══════ Header ═══════ */}
            <div className="gov-form-header">
                <div className="gov-form-header-right">
                    <div className="gov-form-country">المملكة العربية السعودية</div>
                    <div className="gov-form-entity">الجهة الحكومية</div>
                </div>
                <div className="gov-form-header-center">
                    <div className="gov-form-title">قرار تكليف بالعمل خارج أوقات الدوام الرسمي</div>
                    <div className="gov-form-number">رقم: {decisionNumber}</div>
                    <div className="gov-form-subtitle">
                        التاريخ: {formatDateArabic(decisionDate)} | الموافق: {formatHijriDate(decisionDate)}
                    </div>
                </div>
                <div className="gov-form-header-left">
                    <div className="gov-form-entity">إدارة الموارد البشرية</div>
                    <div className="gov-form-subtitle">شؤون العمل الإضافي</div>
                </div>
            </div>

            {/* ═══════ مقدمة القرار ═══════ */}
            <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                borderRight: '4px solid #1d4ed8',
                background: '#f8fafc',
                borderRadius: '4px',
                fontSize: '11px',
                lineHeight: '1.8',
                textAlign: 'justify',
            }}>
                بناءً على الصلاحيات المخولة لنا، ونظراً لمتطلبات العمل ومصلحته،
                تقرر تكليف الموظف/الموظفين أدناه بالعمل خارج أوقات الدوام الرسمي وفقاً لما يلي:
                <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '13px', color: '#1d4ed8', marginTop: '10px' }}>
                    تقرر ما يلي:
                </div>
            </div>

            {/* ═══════ بيانات الموظف/الموظفين ═══════ */}
            {isMultipleEmployees ? (
                /* جدول الموظفين المتعددين */
                <table className="gov-form-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>م</th>
                            <th>الاسم</th>
                            <th>الرقم الوظيفي</th>
                            <th>الإدارة</th>
                            <th>المسمى الوظيفي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, idx) => (
                            <tr key={emp.id || idx}>
                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                <td style={{ fontWeight: '700' }}>{emp.fullName || emp.nameAr || '-'}</td>
                                <td style={{ textAlign: 'center' }}>{emp.employeeNumber || '-'}</td>
                                <td>{emp.department || '-'}</td>
                                <td>{emp.position || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                /* بيانات موظف واحد */
                <div className="gov-form-meta">
                    <div className="gov-form-meta-row">
                        <span className="gov-form-meta-label">الاسم الكامل:</span>
                        <span className="gov-form-meta-value">{employees[0]?.fullName || employees[0]?.nameAr || '-'}</span>
                    </div>
                    <div className="gov-form-meta-row">
                        <span className="gov-form-meta-label">الرقم الوظيفي:</span>
                        <span className="gov-form-meta-value">{employees[0]?.employeeNumber || '-'}</span>
                    </div>
                    <div className="gov-form-meta-row">
                        <span className="gov-form-meta-label">رقم الهوية:</span>
                        <span className="gov-form-meta-value">{employees[0]?.nationalId || '-'}</span>
                    </div>
                    <div className="gov-form-meta-row">
                        <span className="gov-form-meta-label">المسمى الوظيفي:</span>
                        <span className="gov-form-meta-value">{employees[0]?.position || '-'}</span>
                    </div>
                    <div className="gov-form-meta-row gov-form-meta-full">
                        <span className="gov-form-meta-label">الإدارة / القسم:</span>
                        <span className="gov-form-meta-value">{employees[0]?.department || '-'}</span>
                    </div>
                </div>
            )}

            {/* ═══════ تفاصيل التكليف ═══════ */}
            <div className="gov-form-meta">
                <div className="gov-form-meta-row">
                    <span className="gov-form-meta-label">الفترة:</span>
                    <span className="gov-form-meta-value">
                        من {startDate ? formatDateArabic(startDate) : '___'} إلى {endDate ? formatDateArabic(endDate) : '___'}
                    </span>
                </div>
                <div className="gov-form-meta-row">
                    <span className="gov-form-meta-label">عدد الساعات اليومية:</span>
                    <span className="gov-form-meta-value">{dailyHours || '-'} ساعات</span>
                </div>
                <div className="gov-form-meta-row gov-form-meta-full">
                    <span className="gov-form-meta-label">سبب التكليف:</span>
                    <span className="gov-form-meta-value">{reason || '-'}</span>
                </div>
                <div className="gov-form-meta-row gov-form-meta-full">
                    <span className="gov-form-meta-label">نوع التعويض:</span>
                    <span className="gov-form-meta-value">{getCompensationLabel(compensationType)}</span>
                </div>
            </div>

            {/* ═══════ بنود القرار ═══════ */}
            {clauses.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        background: '#1d4ed8',
                        color: '#fff',
                        padding: '6px 12px',
                        fontWeight: '700',
                        fontSize: '11px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                    }}>
                        بنود القرار
                    </div>
                    <table className="gov-form-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>البند</th>
                                <th>النص</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clauses.map((clause, idx) => (
                                <tr key={clause.id || idx}>
                                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#1d4ed8' }}>
                                        {ARABIC_ORDINALS[idx] || `${idx + 1}`}
                                    </td>
                                    <td>{clause.text}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══════ السند النظامي ═══════ */}
            {articles.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        background: '#1d4ed8',
                        color: '#fff',
                        padding: '6px 12px',
                        fontWeight: '700',
                        fontSize: '11px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                    }}>
                        السند النظامي
                    </div>
                    <div style={{ padding: '0 8px' }}>
                        {articles.map((article, idx) => (
                            <div key={article.id || idx} style={{
                                padding: '8px 0',
                                borderBottom: idx < articles.length - 1 ? '1px solid #e5e7eb' : 'none',
                                fontSize: '10px',
                                lineHeight: '1.6',
                            }}>
                                <span style={{ fontWeight: '700' }}>المادة ({article.number}): </span>
                                <span>{article.text}</span>
                                {article.reference && (
                                    <span style={{ color: '#666', fontSize: '9px' }}> — {article.reference}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════ الختام ═══════ */}
            <div style={{
                padding: '12px 16px',
                marginBottom: '20px',
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '11px',
            }}>
                يُعمل بهذا القرار اعتباراً من تاريخه، وعلى الجهات المعنية تنفيذ ما جاء فيه كل فيما يخصه.
            </div>

            {/* ═══════ التوقيعات (2 أعمدة) ═══════ */}
            <div className="gov-form-signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="gov-form-signature-block">
                    <div className="gov-form-signature-role">صاحب الصلاحية</div>
                    <div className="gov-form-signature-space"></div>
                    <div className="gov-form-signature-field">
                        <span className="gov-form-signature-label">الاسم:</span>
                        <span className="gov-form-signature-value">{authority?.fullName || authority?.nameAr || ''}</span>
                    </div>
                    {authority?.position && (
                        <div className="gov-form-signature-field">
                            <span className="gov-form-signature-label">المنصب:</span>
                            <span className="gov-form-signature-value">{authority.position}</span>
                        </div>
                    )}
                    <div className="gov-form-signature-field">
                        <span className="gov-form-signature-label">التاريخ:</span>
                        <span className="gov-form-signature-value"></span>
                    </div>
                </div>

                <div className="gov-form-signature-block">
                    <div className="gov-form-signature-role">مدير الموارد البشرية</div>
                    <div className="gov-form-signature-space"></div>
                    <div className="gov-form-signature-field">
                        <span className="gov-form-signature-label">الاسم:</span>
                        <span className="gov-form-signature-value"></span>
                    </div>
                    <div className="gov-form-signature-field">
                        <span className="gov-form-signature-label">التاريخ:</span>
                        <span className="gov-form-signature-value"></span>
                    </div>
                </div>
            </div>

            {/* ═══════ Footer ═══════ */}
            <div style={{
                marginTop: '30px',
                paddingTop: '12px',
                borderTop: '2px solid #1d4ed8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '8px',
                color: '#666',
            }}>
                <div style={{
                    width: '60px', height: '60px',
                    background: '#f1f5f9', border: '1px dashed #ccc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '4px', fontSize: '7px',
                }}>
                    QR Code
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div>هذه الوثيقة صادرة إلكترونياً من منصة مسارات الموحدة</div>
                    <div>للتحقق من صحة الوثيقة يرجى مسح رمز QR أو إدخال الرقم: {decisionNumber}</div>
                </div>
                <div style={{ width: '60px' }}></div>
            </div>
        </div>
    );
});

OvertimeDecisionPrint.displayName = 'OvertimeDecisionPrint';

export default OvertimeDecisionPrint;
