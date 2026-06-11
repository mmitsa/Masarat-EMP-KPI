/**
 * التقرير الشامل للموظف (قابل للطباعة)
 * Full Employee Report - Printable Component
 */

import React, { forwardRef } from 'react';
import { formatHijri, fmtDate } from '../../../utils/hijriDate';

const FullEmployeeReport = forwardRef(({ employee, tabData, orgSettings, orgName, orgLogo }, ref) => {
    const salary = tabData?.salary || employee;
    const attendance = tabData?.attendance || {};
    const leaves = tabData?.leaves || {};
    const custody = tabData?.custody || {};
    const documents = tabData?.documents || {};
    const performance = tabData?.performance || {};

    const currentDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const hijriDate = new Date().toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = orgName || orgSettings?.organizationNameAr || 'الجهة الحكومية';
    const logo = orgLogo || orgSettings?.organizationLogo;
    const authorityName = orgSettings?.authorityHolderName || '';
    const authorityPosition = orgSettings?.authorityHolderPosition || 'رئيس الجهة';

    const getStatusLabel = (status) => {
        const map = { Active: 'على رأس العمل', Suspended: 'موقوف', Draft: 'مسودة', OnLeave: 'في إجازة', Terminated: 'منتهي الخدمة' };
        return map[status] || status || '-';
    };

    const getGenderLabel = (g) => {
        if (g === 1 || ['M', 'male', 'ذكر'].includes(String(g))) return 'ذكر';
        if (g === 2 || ['F', 'female', 'أنثى'].includes(String(g))) return 'أنثى';
        return g || '-';
    };

    const formatDate = (d) => {
        if (!d) return '-';
        const hijri = formatHijri(d, 'short');
        const greg = fmtDate(d);
        return hijri ? `${hijri} هـ (${greg} م)` : greg;
    };
    const formatCurrency = (v) => v ? Number(v).toLocaleString('ar-SA') + ' ر.س' : '-';

    return (
        <div ref={ref} className="report-print" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Cairo', sans-serif", direction: 'rtl', background: 'white', padding: '20mm 15mm', minHeight: '297mm', width: '210mm' }}>
            <style>{`
                .report-print h2 { font-family: 'Cairo', sans-serif; font-size: 16px; font-weight: 700; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 6px; margin: 24px 0 12px; }
                .report-print .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
                .report-print .info-item { padding: 6px 0; }
                .report-print .info-label { font-size: 10px; color: #6b7280; display: block; margin-bottom: 2px; }
                .report-print .info-value { font-size: 12px; color: #111827; font-weight: 600; }
                .report-print table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
                .report-print th { background: #f3f4f6; padding: 6px 10px; text-align: right; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; }
                .report-print td { padding: 6px 10px; border: 1px solid #e5e7eb; color: #374151; }
                .report-print .stat-box { display: inline-block; padding: 8px 16px; background: #f3f4f6; border-radius: 8px; margin: 4px; text-align: center; }
                .report-print .stat-value { font-size: 18px; font-weight: 700; color: #1d4ed8; }
                .report-print .stat-label { font-size: 10px; color: #6b7280; }
                .report-print .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
                .report-print .sig-block { text-align: center; min-width: 180px; }
                .report-print .sig-title { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
                .report-print .sig-name { font-size: 12px; font-weight: 600; color: #111827; }
                .report-print .sig-line { width: 150px; border-top: 1px solid #9ca3af; margin: 30px auto 4px; }
                .report-print .sig-caption { font-size: 9px; color: #9ca3af; }
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    .report-print { padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>

            {/* الترويسة */}
            <header style={{ borderBottom: '3px solid #1d4ed8', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {logo && <img src={logo} alt="" style={{ height: '50px', objectFit: 'contain' }} />}
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Cairo, sans-serif' }}>{name}</div>
                        {orgSettings?.organizationNameEn && (
                            <div style={{ fontSize: '10px', color: '#6b7280', direction: 'ltr' }}>{orgSettings.organizationNameEn}</div>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'left', fontSize: '10px', color: '#6b7280' }}>
                    <div>{currentDate}</div>
                    <div>{hijriDate}</div>
                </div>
            </header>

            {/* عنوان التقرير */}
            <div style={{ textAlign: 'center', margin: '16px 0 24px', padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1d4ed8', fontFamily: 'Cairo, sans-serif' }}>التقرير الشامل للموظف</div>
                <div style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>{employee?.name}</div>
            </div>

            {/* 1. البيانات الشخصية */}
            <h2>البيانات الشخصية</h2>
            <div className="info-grid">
                <InfoItem label="الاسم الكامل" value={employee?.name} />
                <InfoItem label="رقم الهوية" value={employee?.nationalId} />
                <InfoItem label="الرقم الوظيفي" value={employee?.employeeNumber || employee?.nationalId} />
                <InfoItem label="البريد الإلكتروني" value={employee?.email} />
                <InfoItem label="رقم الجوال" value={employee?.phone} />
                <InfoItem label="الجنسية" value={employee?.nationalityName || employee?.nationality || 'سعودي'} />
                <InfoItem label="تاريخ الميلاد" value={formatDate(employee?.birthDate)} />
                <InfoItem label="الجنس" value={employee?.genderName || getGenderLabel(employee?.gender)} />
                <InfoItem label="الحالة الاجتماعية" value={employee?.maritalStatusName || {1:'أعزب',2:'متزوج',3:'مطلق',4:'أرمل'}[employee?.maritalStatus] || '-'} />
                <InfoItem label="العنوان" value={employee?.address || '-'} />
                <InfoItem label="المدينة" value={employee?.city || '-'} />
                <InfoItem label="جهة اتصال الطوارئ" value={employee?.emergencyContact || '-'} />
            </div>

            {/* 2. البيانات الوظيفية */}
            <h2>البيانات الوظيفية</h2>
            <div className="info-grid">
                <InfoItem label="المسمى الوظيفي" value={employee?.position} />
                <InfoItem label="القسم/الإدارة" value={employee?.department_name} />
                <InfoItem label="تاريخ التعيين" value={formatDate(employee?.hireDate)} />
                <InfoItem label="نوع العقد" value={employee?.contractType || 'دائم'} />
                <InfoItem label="المستوى الوظيفي" value={employee?.jobLevel || '-'} />
                <InfoItem label="المدير المباشر" value={employee?.managerName || '-'} />
                <InfoItem label="الحالة الوظيفية" value={getStatusLabel(employee?.status)} />
                <InfoItem label="رقم التأمينات" value={employee?.socialInsuranceNumber || '-'} />
                <InfoItem label="فرع العمل" value={employee?.workLocation || '-'} />
            </div>

            {/* 3. الراتب والبدلات */}
            <h2>الراتب والبدلات</h2>
            <div className="info-grid">
                <InfoItem label="الراتب الأساسي" value={formatCurrency(salary?.basicSalary || employee?.salary)} />
                <InfoItem label="بدل السكن" value={formatCurrency(salary?.housingAllowance || employee?.housingAllowance)} />
                <InfoItem label="بدل النقل" value={formatCurrency(salary?.transportAllowance || employee?.transportAllowance)} />
                <InfoItem label="بدل الهاتف" value={formatCurrency(salary?.phoneAllowance || employee?.phoneAllowance)} />
                <InfoItem label="بدلات أخرى" value={formatCurrency(salary?.otherAllowances || employee?.otherAllowances)} />
                <InfoItem label="صافي الراتب" value={formatCurrency(salary?.netSalary)} />
            </div>

            {/* 4. ملخص الحضور */}
            <h2>ملخص الحضور</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <StatBox label="أيام الحضور" value={attendance?.summary?.presentDays || 0} />
                <StatBox label="أيام التأخير" value={attendance?.summary?.lateDays || 0} />
                <StatBox label="أيام الغياب" value={attendance?.summary?.absentDays || 0} />
                <StatBox label="أيام الإجازة" value={attendance?.summary?.leaveDays || 0} />
                <StatBox label="نسبة الحضور" value={`${attendance?.summary?.attendanceRate || 0}%`} />
            </div>

            {/* 5. رصيد الإجازات */}
            <h2>رصيد الإجازات</h2>
            {leaves?.balances ? (
                <table>
                    <thead>
                        <tr>
                            <th>نوع الإجازة</th>
                            <th>الرصيد</th>
                            <th>المستخدم</th>
                            <th>المتبقي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(leaves.balances).map(([type, bal]) => (
                            <tr key={type}>
                                <td>{type === 'annual' ? 'سنوية' : type === 'sick' ? 'مرضية' : type === 'emergency' ? 'اضطرارية' : type}</td>
                                <td>{bal?.total || 0}</td>
                                <td>{bal?.used || 0}</td>
                                <td>{bal?.remaining || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>لا توجد بيانات إجازات متاحة</p>
            )}

            {/* 6. العهد */}
            <h2>العهد والمستلزمات</h2>
            {Array.isArray(custody?.items) && custody.items.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>الرقم التسلسلي</th>
                            <th>تاريخ الاستلام</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {custody.items.map((item, i) => (
                            <tr key={i}>
                                <td>{item.itemName || item.name}</td>
                                <td>{item.serialNumber || '-'}</td>
                                <td>{formatDate(item.receivedDate || item.date)}</td>
                                <td>{item.status || 'مستلم'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>لا توجد عهد مسجلة</p>
            )}

            {/* 7. المستندات */}
            <h2>المستندات</h2>
            {Array.isArray(documents?.items) && documents.items.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>اسم المستند</th>
                            <th>النوع</th>
                            <th>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.items.map((doc, i) => (
                            <tr key={i}>
                                <td>{doc.name || doc.title}</td>
                                <td>{doc.type || '-'}</td>
                                <td>{formatDate(doc.date || doc.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>لا توجد مستندات مرفقة</p>
            )}

            {/* 8. الأداء */}
            <h2>تقييم الأداء</h2>
            <div className="info-grid">
                <InfoItem label="التقييم الحالي" value={performance?.currentRating || performance?.rating || '-'} />
                <InfoItem label="فترة التقييم" value={performance?.evaluationPeriod || performance?.period || '-'} />
                <InfoItem label="ملاحظات" value={performance?.notes || '-'} />
            </div>

            {/* التوقيع الإلكتروني */}
            {employee?.signatureImageUrl && (
                <>
                    <h2>التوقيع الإلكتروني</h2>
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
                        <img src={employee.signatureImageUrl} alt="التوقيع" style={{ maxHeight: '50px' }} />
                    </div>
                </>
            )}

            {/* التوقيعات */}
            <div className="signatures">
                <div className="sig-block">
                    <div className="sig-title">مدير الموارد البشرية</div>
                    <div className="sig-line" />
                    <div className="sig-caption">التوقيع والتاريخ</div>
                </div>
                <div className="sig-block">
                    <div className="sig-title">المدير المباشر</div>
                    <div className="sig-line" />
                    <div className="sig-caption">التوقيع والتاريخ</div>
                </div>
                <div className="sig-block">
                    <div className="sig-title">{authorityPosition}</div>
                    <div className="sig-name">{authorityName}</div>
                    <div className="sig-line" />
                    <div className="sig-caption">التوقيع والتاريخ</div>
                </div>
            </div>

            {/* تذييل */}
            <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af' }}>
                تم إنشاء هذا التقرير من نظام مسارات - {currentDate}
            </div>
        </div>
    );
});

function InfoItem({ label, value }) {
    return (
        <div className="info-item">
            <span className="info-label">{label}</span>
            <span className="info-value">{value || '-'}</span>
        </div>
    );
}

function StatBox({ label, value }) {
    return (
        <div className="stat-box">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}

FullEmployeeReport.displayName = 'FullEmployeeReport';

export default FullEmployeeReport;
