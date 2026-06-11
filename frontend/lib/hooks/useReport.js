/**
 * Hook موحد للتقارير
 * يوفر واجهة سهلة لإنشاء وتصدير التقارير
 */

import { useRef, useCallback, useMemo } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import {
    exportToPDF,
    exportToExcel,
    exportToCSV,
    printElement,
    printHTML,
    formatDateForExport,
    formatNumberForExport,
    formatCurrencyForExport,
} from '@/lib/exportUtils';

/**
 * Hook لإدارة التقارير
 */
export function useReport(options = {}) {
    const { organization } = useOrganization();
    const reportRef = useRef(null);

    const {
        title = '',
        subtitle = '',
        reportNumber = '',
        filename = 'report',
        orientation = 'portrait',
        paperSize = 'A4',
    } = options;

    // إعدادات التقرير
    const reportConfig = useMemo(() => ({
        organization,
        title,
        subtitle,
        reportNumber,
        orientation,
        paperSize,
        showHeader: organization?.reportSettings?.showLogo ?? true,
        showFooter: true,
        showWatermark: organization?.reportSettings?.showWatermark ?? false,
        showQRCode: organization?.reportSettings?.showQRCode ?? true,
    }), [organization, title, subtitle, reportNumber, orientation, paperSize]);

    // تصدير PDF
    const exportPDF = useCallback(async (customOptions = {}) => {
        const element = reportRef.current;
        if (!element) {
            console.error('Report element not found');
            return;
        }

        await exportToPDF(element, filename, {
            ...reportConfig,
            ...customOptions,
        });
    }, [filename, reportConfig]);

    // تصدير Excel
    const exportExcel = useCallback((data, columns, customOptions = {}) => {
        exportToExcel(data, columns, filename, {
            title,
            subtitle,
            includeOrganization: true,
            ...customOptions,
        });
    }, [filename, title, subtitle]);

    // تصدير CSV
    const exportCSV = useCallback((data, columns, customOptions = {}) => {
        exportToCSV(data, columns, filename, {
            title,
            includeHeader: true,
            ...customOptions,
        });
    }, [filename, title]);

    // طباعة
    const print = useCallback((customOptions = {}) => {
        const element = reportRef.current;
        if (!element) {
            console.error('Report element not found');
            return;
        }

        printElement(element, {
            ...reportConfig,
            ...customOptions,
        });
    }, [reportConfig]);

    // طباعة HTML مخصص
    const printCustomHTML = useCallback((htmlContent, customOptions = {}) => {
        printHTML(htmlContent, {
            ...reportConfig,
            ...customOptions,
        });
    }, [reportConfig]);

    // دوال التنسيق
    const formatters = useMemo(() => ({
        date: formatDateForExport,
        number: formatNumberForExport,
        currency: formatCurrencyForExport,
    }), []);

    return {
        // المرجع
        reportRef,

        // بيانات الجهة
        organization,

        // إعدادات التقرير
        reportConfig,

        // دوال التصدير
        exportPDF,
        exportExcel,
        exportCSV,

        // دوال الطباعة
        print,
        printCustomHTML,

        // دوال التنسيق
        formatters,
    };
}

/**
 * Hook لإنشاء أعمدة التقرير
 */
export function useReportColumns(columns) {
    return useMemo(() => {
        return columns.map(col => ({
            key: col.key,
            header: col.header || col.label || col.title || col.key,
            width: col.width || 100,
            type: col.type || 'string',
            align: col.align || (col.type === 'number' || col.type === 'currency' ? 'center' : 'right'),
            render: col.render || null,
        }));
    }, [columns]);
}

/**
 * Hook لإنشاء ملخص التقرير
 */
export function useReportSummary(data, summaryConfig = []) {
    return useMemo(() => {
        return summaryConfig.map(config => {
            let value = config.value;

            if (typeof config.calculate === 'function') {
                value = config.calculate(data);
            } else if (config.sum && data.length > 0) {
                value = data.reduce((acc, row) => acc + (Number(row[config.sum]) || 0), 0);
            } else if (config.count) {
                value = data.length;
            } else if (config.avg && data.length > 0) {
                const sum = data.reduce((acc, row) => acc + (Number(row[config.avg]) || 0), 0);
                value = sum / data.length;
            }

            return {
                label: config.label,
                value: config.format ? config.format(value) : value,
                type: config.type || 'string',
                color: config.color,
            };
        });
    }, [data, summaryConfig]);
}

export default useReport;
