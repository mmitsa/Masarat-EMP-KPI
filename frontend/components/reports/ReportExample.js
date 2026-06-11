/**
 * مثال على استخدام قالب التقارير الموحد
 * يوضح كيفية إنشاء تقرير متكامل مع إعدادات الجهة
 */

import React from 'react';
import UnifiedReportTemplate, { ReportTable, ReportSummary } from './UnifiedReportTemplate';
import { useReport, useReportColumns, useReportSummary } from '@/lib/hooks/useReport';
import ExportButtons from '@/components/print/ExportButtons';

/**
 * مثال: تقرير الموظفين
 */
export function EmployeesReportExample({ employees = [] }) {
    const {
        reportRef,
        organization,
        exportPDF,
        exportExcel,
        print,
        formatters,
    } = useReport({
        title: 'تقرير بيانات الموظفين',
        subtitle: 'قائمة الموظفين النشطين',
        filename: 'employees-report',
    });

    // تعريف الأعمدة
    const columns = useReportColumns([
        { key: 'employeeNumber', header: 'الرقم الوظيفي', width: 100, align: 'center' },
        { key: 'name', header: 'الاسم', width: 180 },
        { key: 'department', header: 'القسم', width: 120 },
        { key: 'position', header: 'الوظيفة', width: 130 },
        { key: 'hireDate', header: 'تاريخ التعيين', width: 100, render: (val) => formatters.date(val) },
        { key: 'salary', header: 'الراتب', width: 100, type: 'currency', render: (val) => formatters.currency(val) },
        { key: 'status', header: 'الحالة', width: 80, align: 'center' },
    ]);

    // ملخص التقرير
    const summary = useReportSummary(employees, [
        { label: 'إجمالي الموظفين', count: true },
        { label: 'إجمالي الرواتب', sum: 'salary', format: formatters.currency, type: 'number' },
        { label: 'متوسط الراتب', avg: 'salary', format: formatters.currency, type: 'number' },
    ]);

    return (
        <div>
            {/* أزرار التصدير */}
            <div className="flex justify-end mb-4">
                <ExportButtons
                    data={employees}
                    columns={columns}
                    printRef={reportRef}
                    filename="employees-report"
                    title="تقرير بيانات الموظفين"
                    showPrint
                    showPDF
                    showExcel
                    includeSummary
                    summaryData={summary}
                />
            </div>

            {/* قالب التقرير */}
            <UnifiedReportTemplate
                ref={reportRef}
                title="تقرير بيانات الموظفين"
                subtitle="قائمة الموظفين النشطين في المنشأة"
                reportNumber={`EMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`}
                reportType="official"
            >
                {/* جدول البيانات */}
                <ReportTable
                    columns={columns}
                    data={employees}
                    showRowNumbers
                    striped
                />

                {/* ملخص التقرير */}
                <ReportSummary items={summary} />
            </UnifiedReportTemplate>
        </div>
    );
}

/**
 * مثال: تقرير مالي
 */
export function FinancialReportExample({ transactions = [] }) {
    const { reportRef, formatters } = useReport({
        title: 'التقرير المالي الشهري',
        filename: 'financial-report',
        orientation: 'landscape',
    });

    const columns = useReportColumns([
        { key: 'date', header: 'التاريخ', render: (val) => formatters.date(val) },
        { key: 'reference', header: 'المرجع', align: 'center' },
        { key: 'description', header: 'الوصف' },
        { key: 'category', header: 'التصنيف' },
        { key: 'debit', header: 'مدين', type: 'currency' },
        { key: 'credit', header: 'دائن', type: 'currency' },
        { key: 'balance', header: 'الرصيد', type: 'currency' },
    ]);

    const summary = useReportSummary(transactions, [
        { label: 'عدد العمليات', count: true },
        { label: 'إجمالي المدين', sum: 'debit', format: formatters.currency },
        { label: 'إجمالي الدائن', sum: 'credit', format: formatters.currency },
        {
            label: 'صافي الحركة',
            calculate: (data) => {
                const debit = data.reduce((acc, t) => acc + (t.debit || 0), 0);
                const credit = data.reduce((acc, t) => acc + (t.credit || 0), 0);
                return formatters.currency(credit - debit);
            }
        },
    ]);

    return (
        <div>
            <div className="flex justify-end mb-4">
                <ExportButtons
                    data={transactions}
                    columns={columns}
                    printRef={reportRef}
                    filename="financial-report"
                    title="التقرير المالي الشهري"
                    showPrint
                    showPDF
                    showExcel
                />
            </div>

            <UnifiedReportTemplate
                ref={reportRef}
                title="التقرير المالي الشهري"
                subtitle={`للفترة من ${formatters.date(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))} إلى ${formatters.date(new Date())}`}
                orientation="landscape"
                reportType="official"
                signatures={[
                    { name: 'المحاسب', title: 'قسم المحاسبة' },
                    { name: 'المدير المالي', title: 'الإدارة المالية' },
                    { name: 'المدير العام', title: 'الإدارة العليا' },
                ]}
            >
                <ReportTable columns={columns} data={transactions} />
                <ReportSummary items={summary} />
            </UnifiedReportTemplate>
        </div>
    );
}

/**
 * مثال: شهادة أو خطاب رسمي
 */
export function OfficialLetterExample({ letterData = {} }) {
    const { reportRef } = useReport({
        title: letterData.title || 'خطاب رسمي',
        filename: 'official-letter',
    });

    return (
        <UnifiedReportTemplate
            ref={reportRef}
            title={letterData.title || 'خطاب رسمي'}
            reportNumber={letterData.number}
            reportType="letter"
            signatures={letterData.signatures || []}
        >
            <div style={{ lineHeight: 2, fontSize: '14px' }}>
                {/* المستلم */}
                <div style={{ marginBottom: '30px' }}>
                    <p><strong>إلى:</strong> {letterData.to || 'سعادة المدير العام'}</p>
                    <p><strong>الموضوع:</strong> {letterData.subject || 'موضوع الخطاب'}</p>
                </div>

                {/* التحية */}
                <p style={{ marginBottom: '20px' }}>السلام عليكم ورحمة الله وبركاته،،</p>

                {/* المحتوى */}
                <div style={{ marginBottom: '30px', textAlign: 'justify' }}>
                    {letterData.content || 'نص الخطاب يكتب هنا...'}
                </div>

                {/* الختام */}
                <p>وتقبلوا وافر التحية والتقدير،،</p>
            </div>
        </UnifiedReportTemplate>
    );
}

export default {
    EmployeesReportExample,
    FinancialReportExample,
    OfficialLetterExample,
};
