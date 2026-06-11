/**
 * قالب طباعة قرار الترقية
 * Promotion Decision Print Template
 */

import React, { forwardRef } from 'react';
import { PROMOTION_TYPES, APPROVAL_LEVELS, getOrderedApprovalLevels } from '../../../constants/promotion-types';

import { fmtDate } from '../../../utils/hijriDate';

const PromotionPrintTemplate = forwardRef(({ promotion }, ref) => {
    if (!promotion) return null;

    const promotionType = PROMOTION_TYPES[promotion.promotionType];
    const approvalLevels = getOrderedApprovalLevels(promotion.promotionType);

    // Get Hijri date
    const formatHijriDate = (date) => {
        try {
            return new Date(date).toLocaleDateString('ar-SA-u-ca-islamic', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return fmtDate(date);
        }
    };

    const formatGregorianDate = (date) => {
        return fmtDate(date);
    };

    return (
        <div ref={ref} dir="rtl" style={{
            fontFamily: "'Tajawal', 'Segoe UI', Arial, sans-serif",
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
        }}>
            {/* Print Styles */}
            <style>
                {`
                    @media print {
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 20mm; }
                `}
            </style>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '30px',
                borderBottom: '3px solid #1d4ed8',
                paddingBottom: '20px',
            }}>
                {/* Right Side - Organization Logo */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        margin: '0 auto 10px',
                    }}>
                        م
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                        المملكة العربية السعودية
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        منصة مسارات الموحدة
                    </div>
                </div>

                {/* Center - Document Title */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#1d4ed8',
                        margin: '0 0 10px 0',
                    }}>
                        قرار ترقية موظف
                    </h1>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: '#eff6ff',
                        padding: '5px 15px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: '#1d4ed8',
                    }}>
                        {promotionType?.label || 'ترقية'}
                    </div>
                </div>

                {/* Left Side - Reference & Date */}
                <div style={{ textAlign: 'left', fontSize: '12px' }}>
                    <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#6b7280' }}>الرقم المرجعي: </span>
                        <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{promotion.referenceNumber}</span>
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#6b7280' }}>التاريخ الهجري: </span>
                        <span>{formatHijriDate(promotion.createdAt)}</span>
                    </div>
                    <div>
                        <span style={{ color: '#6b7280' }}>التاريخ الميلادي: </span>
                        <span>{formatGregorianDate(promotion.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Employee Info */}
            <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '25px',
            }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '15px',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '10px',
                }}>
                    بيانات الموظف
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <InfoItem label="الاسم" value={promotion.employeeName} />
                    <InfoItem label="الرقم الوظيفي" value={promotion.employeeNumber} />
                    <InfoItem label="المسمى الوظيفي" value={promotion.position} />
                    <InfoItem label="الإدارة/القسم" value={promotion.departmentName} />
                </div>
            </div>

            {/* Promotion Details */}
            <div style={{
                marginBottom: '25px',
            }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '15px',
                }}>
                    تفاصيل الترقية
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '20px',
                    alignItems: 'center',
                }}>
                    {/* Before */}
                    <div style={{
                        backgroundColor: '#f3f4f6',
                        borderRadius: '10px',
                        padding: '20px',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>الوضع السابق</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6b7280' }}>{promotion.currentRank}</div>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>المرتبة</div>
                        <div style={{ marginTop: '10px', fontSize: '14px' }}>
                            <span style={{ color: '#6b7280' }}>الدرجة: </span>
                            <span style={{ fontWeight: 'bold' }}>{promotion.currentStep}</span>
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            <span style={{ color: '#6b7280' }}>الراتب: </span>
                            <span style={{ fontWeight: 'bold' }}>{promotion.currentSalary?.toLocaleString()} ر.س</span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div style={{
                        fontSize: '40px',
                        color: '#10b981',
                    }}>
                        ←
                    </div>

                    {/* After */}
                    <div style={{
                        backgroundColor: '#ecfdf5',
                        borderRadius: '10px',
                        padding: '20px',
                        textAlign: 'center',
                        border: '2px solid #10b981',
                    }}>
                        <div style={{ fontSize: '12px', color: '#059669', marginBottom: '10px' }}>الوضع الجديد</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{promotion.targetRank}</div>
                        <div style={{ fontSize: '14px', color: '#10b981' }}>المرتبة</div>
                        <div style={{ marginTop: '10px', fontSize: '14px' }}>
                            <span style={{ color: '#059669' }}>المسمى: </span>
                            <span style={{ fontWeight: 'bold' }}>{promotion.targetPosition || '-'}</span>
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            <span style={{ color: '#059669' }}>الراتب: </span>
                            <span style={{ fontWeight: 'bold' }}>{promotion.newSalary?.toLocaleString()} ر.س</span>
                        </div>
                    </div>
                </div>

                {/* Effective Date */}
                <div style={{
                    marginTop: '20px',
                    textAlign: 'center',
                    backgroundColor: '#fef3c7',
                    padding: '10px',
                    borderRadius: '8px',
                }}>
                    <span style={{ color: '#92400e' }}>تاريخ نفاذ الترقية: </span>
                    <span style={{ fontWeight: 'bold', color: '#78350f' }}>
                        {formatGregorianDate(promotion.effectiveDate)}
                    </span>
                </div>
            </div>

            {/* Differentiation Points */}
            {promotion.differentiationPoints && (
                <div style={{
                    backgroundColor: '#eff6ff',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '25px',
                }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '15px',
                    }}>
                        نقاط المفاضلة
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                        <PointsBox label="تقييم الأداء" value={promotion.differentiationPoints.performance} max={30} />
                        <PointsBox label="اختبار المفاضلة" value={promotion.differentiationPoints.test} max={40} />
                        <PointsBox label="المبادرات" value={promotion.differentiationPoints.initiatives} max={20} />
                        <PointsBox label="التدريب" value={promotion.differentiationPoints.training} max={10} />
                    </div>
                    <div style={{
                        marginTop: '15px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#1d4ed8',
                    }}>
                        الإجمالي: {promotion.differentiationPoints.total} / 100
                    </div>
                </div>
            )}

            {/* Approvals */}
            <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '15px',
                }}>
                    الاعتمادات
                </h3>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>المستوى</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>الحالة</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>المعتمد</th>
                            <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvalLevels.map(level => {
                            const levelMap = {
                                'L01': 'hr_department',
                                'L02': 'promotion_committee',
                                'L03': 'authority',
                                'L04': 'ministry',
                            };
                            const approval = promotion.approvals?.find(a => a.level === levelMap[level.code]);

                            return (
                                <tr key={level.code}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{level.label}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '3px 10px',
                                            borderRadius: '15px',
                                            fontSize: '12px',
                                            backgroundColor: approval?.status === 'approved' ? '#d1fae5' : '#f3f4f6',
                                            color: approval?.status === 'approved' ? '#065f46' : '#6b7280',
                                        }}>
                                            {approval?.status === 'approved' ? 'معتمد' : 'قيد الانتظار'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{approval?.approvedBy || '-'}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                                        {approval?.approvedDate ? formatGregorianDate(approval.approvedDate) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Signatures */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                marginTop: '50px',
            }}>
                <SignatureBox title="مدير الموارد البشرية" />
                <SignatureBox title="صاحب الصلاحية" />
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
                fontSize: '11px',
                color: '#9ca3af',
            }}>
                <p>تم إنشاء هذه الوثيقة آلياً من منصة مسارات الموحدة</p>
                <p>رقم الوثيقة: {promotion.referenceNumber} | تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</p>
            </div>
        </div>
    );
});

PromotionPrintTemplate.displayName = 'PromotionPrintTemplate';

function InfoItem({ label, value }) {
    return (
        <div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}: </span>
            <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{value || '-'}</span>
        </div>
    );
}

function PointsBox({ label, value, max }) {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '8px',
        }}>
            <div style={{ fontSize: '11px', color: '#1e40af', marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1d4ed8' }}>{value}</div>
            <div style={{ fontSize: '10px', color: '#93c5fd' }}>/ {max}</div>
        </div>
    );
}

function SignatureBox({ title }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                borderBottom: '1px solid #374151',
                height: '60px',
                marginBottom: '10px',
            }} />
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{title}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>التوقيع والختم</div>
        </div>
    );
}

export default PromotionPrintTemplate;
