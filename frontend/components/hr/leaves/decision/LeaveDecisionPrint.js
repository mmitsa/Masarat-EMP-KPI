/**
 * قالب طباعة قرار الإجازة - وفق نظام التصميم الحكومي
 * Leave Decision Print Template (gov-form design system)
 */

import React, { forwardRef } from 'react';
import { getLeaveTypeName } from '../../../../constants/leave-types';
import { formatDateArabic } from '../../../../utils/hr-helpers';
import { ARABIC_ORDINALS } from '../../../../constants/leave-decision-articles';

const LeaveDecisionPrint = forwardRef(({ decision }, ref) => {
    if (!decision) return null;

    const { leave, authority, articles = [], clauses = [], decisionNumber, decisionDate } = decision;

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

    // حساب تاريخ المباشرة
    const getReturnDate = (endDate) => {
        if (!endDate) return '';
        const date = new Date(endDate);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
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
                    <div className="gov-form-title">قرار إجازة</div>
                    <div className="gov-form-number">رقم: {decisionNumber}</div>
                    <div className="gov-form-subtitle">
                        التاريخ: {formatDateArabic(decisionDate)} | الموافق: {formatHijriDate(decisionDate)}
                    </div>
                </div>
                <div className="gov-form-header-left">
                    <div className="gov-form-entity">إدارة الموارد البشرية</div>
                    <div className="gov-form-subtitle">شؤون الإجازات</div>
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
                بناءً على الصلاحيات المخولة لنا، وبناءً على طلب الإجازة المقدم من الموظف/ـة المذكور أدناه،
                وبعد استيفاء جميع المتطلبات النظامية والموافقات اللازمة،
                <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '13px', color: '#1d4ed8', marginTop: '10px' }}>
                    تقرر ما يلي:
                </div>
            </div>

            {/* ═══════ بيانات الموظف ═══════ */}
            <div className="gov-form-meta">
                <div className="gov-form-meta-row">
                    <span className="gov-form-meta-label">الاسم الكامل:</span>
                    <span className="gov-form-meta-value">{leave?.employee?.fullName || leave?.employee?.nameAr || '-'}</span>
                </div>
                <div className="gov-form-meta-row">
                    <span className="gov-form-meta-label">الرقم الوظيفي:</span>
                    <span className="gov-form-meta-value">{leave?.employee?.employeeNumber || '-'}</span>
                </div>
                <div className="gov-form-meta-row">
                    <span className="gov-form-meta-label">رقم الهوية:</span>
                    <span className="gov-form-meta-value">{leave?.employee?.nationalId || '-'}</span>
                </div>
                <div className="gov-form-meta-row">
                    <span className="gov-form-meta-label">المسمى الوظيفي:</span>
                    <span className="gov-form-meta-value">{leave?.employee?.position || '-'}</span>
                </div>
                <div className="gov-form-meta-row gov-form-meta-full">
                    <span className="gov-form-meta-label">الإدارة / القسم:</span>
                    <span className="gov-form-meta-value">{leave?.employee?.department || '-'}</span>
                </div>
            </div>

            {/* ═══════ تفاصيل الإجازة - جدول ═══════ */}
            <table className="gov-form-table">
                <thead>
                    <tr>
                        <th>نوع الإجازة</th>
                        <th>عدد الأيام</th>
                        <th>تاريخ البداية</th>
                        <th>تاريخ النهاية</th>
                        <th>تاريخ المباشرة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{getLeaveTypeName(leave?.leave_type)}</td>
                        <td style={{ textAlign: 'center' }}>{leave?.days || 0} أيام</td>
                        <td style={{ textAlign: 'center' }}>
                            <div>{formatDateArabic(leave?.start_date)}</div>
                            <div style={{ fontSize: '9px', color: '#666' }}>{formatHijriDate(leave?.start_date)}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                            <div>{formatDateArabic(leave?.end_date)}</div>
                            <div style={{ fontSize: '9px', color: '#666' }}>{formatHijriDate(leave?.end_date)}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                            <div>{formatDateArabic(getReturnDate(leave?.end_date))}</div>
                            <div style={{ fontSize: '9px', color: '#666' }}>{formatHijriDate(getReturnDate(leave?.end_date))}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* البديل */}
            {leave?.substitute && (
                <div className="gov-form-meta" style={{ gridTemplateColumns: '1fr', marginBottom: '16px' }}>
                    <div className="gov-form-meta-row">
                        <span className="gov-form-meta-label">البديل أثناء الغياب:</span>
                        <span className="gov-form-meta-value">{leave.substitute.fullName || leave.substitute.nameAr}</span>
                    </div>
                </div>
            )}

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

            {/* ═══════ التوقيعات ═══════ */}
            <div className="gov-form-signatures gov-form-signatures-3col">
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

                <div className="gov-form-signature-block">
                    <div className="gov-form-signature-role">الموظف/ـة</div>
                    <div className="gov-form-signature-space"></div>
                    <div className="gov-form-signature-field">
                        <span className="gov-form-signature-label">الاسم:</span>
                        <span className="gov-form-signature-value">{leave?.employee?.fullName || leave?.employee?.nameAr || ''}</span>
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

LeaveDecisionPrint.displayName = 'LeaveDecisionPrint';

export default LeaveDecisionPrint;
