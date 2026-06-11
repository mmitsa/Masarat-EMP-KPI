/**
 * بطاقة تعريف الموظف - نمط حكومي سعودي
 * Employee ID Badge Card - Saudi Government Style
 */

import React, { forwardRef } from 'react';

const EmployeeBadgeCard = forwardRef(({ employee, orgSettings, orgLogo, orgName, orgNameEn }, ref) => {
    const authorityName = orgSettings?.authorityHolderName || '';
    const authorityPosition = orgSettings?.authorityHolderPosition || 'رئيس الجهة';
    const logo = orgLogo || orgSettings?.organizationLogo;
    const name = orgName || orgSettings?.organizationNameAr || 'الجهة الحكومية';
    const nameEn = orgNameEn || orgSettings?.organizationNameEn || '';

    return (
        <div ref={ref} className="badge-print-container">
            <style>{`
                .badge-print-container {
                    width: 340px;
                    font-family: 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', sans-serif;
                    direction: rtl;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .badge-header {
                    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%);
                    color: white;
                    padding: 16px 20px;
                    text-align: center;
                    position: relative;
                }
                .badge-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #f59e0b, #eab308, #f59e0b);
                }
                .badge-logo {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 8px;
                    border-radius: 8px;
                    object-fit: contain;
                    background: rgba(255,255,255,0.15);
                    padding: 4px;
                }
                .badge-org-name {
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1.4;
                    font-family: 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
                }
                .badge-org-name-en {
                    font-size: 10px;
                    opacity: 0.85;
                    direction: ltr;
                    margin-top: 2px;
                }
                .badge-type {
                    font-size: 11px;
                    margin-top: 6px;
                    padding: 2px 12px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 20px;
                    display: inline-block;
                    letter-spacing: 1px;
                }
                .badge-body {
                    padding: 20px;
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }
                .badge-avatar {
                    width: 80px;
                    height: 95px;
                    border-radius: 8px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    font-weight: 700;
                    color: white;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    border: 2px solid #e5e7eb;
                }
                .badge-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                }
                .badge-info {
                    flex: 1;
                    min-width: 0;
                }
                .badge-field {
                    margin-bottom: 6px;
                }
                .badge-field-label {
                    font-size: 9px;
                    color: #9ca3af;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .badge-field-value {
                    font-size: 12px;
                    color: #111827;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .badge-field-value.name {
                    font-size: 14px;
                    color: #1d4ed8;
                    font-family: 'Cairo', sans-serif;
                }
                .badge-footer {
                    padding: 12px 20px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .badge-authority {
                    font-size: 10px;
                    color: #6b7280;
                }
                .badge-authority-name {
                    font-size: 11px;
                    color: #374151;
                    font-weight: 600;
                    margin-top: 2px;
                }
                .badge-signature-line {
                    width: 100px;
                    border-top: 1px solid #9ca3af;
                    margin-top: 8px;
                    padding-top: 2px;
                    font-size: 9px;
                    color: #9ca3af;
                    text-align: center;
                }
                .badge-stamp {
                    width: 55px;
                    height: 55px;
                    border: 2px dashed #d1d5db;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #d1d5db;
                    font-size: 8px;
                    text-align: center;
                }
                @media print {
                    @page { size: 90mm 130mm; margin: 0; }
                    body { margin: 0; padding: 0; }
                    .badge-print-container {
                        width: 90mm !important;
                        border: none;
                        box-shadow: none;
                        border-radius: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* الترويسة */}
            <div className="badge-header">
                {logo && <img src={logo} alt="" className="badge-logo" />}
                <div className="badge-org-name">{name}</div>
                {nameEn && <div className="badge-org-name-en">{nameEn}</div>}
                <div className="badge-type">بطاقة تعريف موظف</div>
            </div>

            {/* الجسم */}
            <div className="badge-body">
                <div className="badge-avatar">
                    {employee?.photoUrl ? (
                        <img src={employee.photoUrl} alt={employee.name} />
                    ) : (
                        employee?.name?.charAt(0) || '؟'
                    )}
                </div>
                <div className="badge-info">
                    <div className="badge-field">
                        <div className="badge-field-label">الاسم</div>
                        <div className="badge-field-value name">{employee?.name || '-'}</div>
                    </div>
                    <div className="badge-field">
                        <div className="badge-field-label">الرقم الوظيفي</div>
                        <div className="badge-field-value">{employee?.employeeNumber || employee?.nationalId || '-'}</div>
                    </div>
                    <div className="badge-field">
                        <div className="badge-field-label">رقم الهوية</div>
                        <div className="badge-field-value">{employee?.nationalId || '-'}</div>
                    </div>
                    <div className="badge-field">
                        <div className="badge-field-label">القسم</div>
                        <div className="badge-field-value">{employee?.department_name || '-'}</div>
                    </div>
                    <div className="badge-field">
                        <div className="badge-field-label">المسمى الوظيفي</div>
                        <div className="badge-field-value">{employee?.position || '-'}</div>
                    </div>
                </div>
            </div>

            {/* التذييل */}
            <div className="badge-footer">
                <div>
                    <div className="badge-authority">{authorityPosition}</div>
                    <div className="badge-authority-name">{authorityName || '_______________'}</div>
                    <div className="badge-signature-line">التوقيع</div>
                </div>
                <div className="badge-stamp">
                    ختم<br />الجهة
                </div>
            </div>
        </div>
    );
});

EmployeeBadgeCard.displayName = 'EmployeeBadgeCard';

export default EmployeeBadgeCard;
