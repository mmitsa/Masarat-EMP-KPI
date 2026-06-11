/**
 * استيراد وتصدير بيانات الموظفين من/إلى Excel
 * يستخدم مكتبة exceljs المثبتة مسبقاً
 */
import { calculateFormCompliance } from './employeeValidation';

// أعمدة القالب مع الرؤوس العربية
export const TEMPLATE_COLUMNS = [
    { key: 'nationalId', header: 'رقم الهوية', width: 15, required: true },
    { key: 'firstNameAr', header: 'الاسم الأول (عربي)', width: 15, required: true },
    { key: 'fatherNameAr', header: 'اسم الأب (عربي)', width: 15, required: true },
    { key: 'grandfatherNameAr', header: 'اسم الجد (عربي)', width: 15 },
    { key: 'familyNameAr', header: 'اسم العائلة (عربي)', width: 15, required: true },
    { key: 'firstNameEn', header: 'First Name', width: 15 },
    { key: 'fatherNameEn', header: 'Father Name', width: 15 },
    { key: 'grandfatherNameEn', header: 'Grandfather', width: 15 },
    { key: 'familyNameEn', header: 'Family Name', width: 15 },
    { key: 'gender', header: 'الجنس (M/F)', width: 12, required: true },
    { key: 'birthDate', header: 'تاريخ الميلاد (YYYY-MM-DD)', width: 20 },
    { key: 'nationality', header: 'كود الجنسية', width: 12 },
    { key: 'maritalStatus', header: 'الحالة الاجتماعية', width: 15 },
    { key: 'mobile', header: 'الجوال', width: 15, required: true },
    { key: 'email', header: 'البريد الإلكتروني', width: 25 },
    { key: 'employeeNumber', header: 'الرقم الوظيفي', width: 15, required: true },
    { key: 'departmentId', header: 'اسم الإدارة', width: 20, required: true },
    { key: 'position', header: 'المسمى الوظيفي', width: 20, required: true },
    { key: 'hireDate', header: 'تاريخ التعيين (YYYY-MM-DD)', width: 22, required: true },
    { key: 'contractType', header: 'نوع العقد (01=دائم)', width: 18 },
    { key: 'basicSalary', header: 'الراتب الأساسي', width: 15, required: true },
    { key: 'housingAllowance', header: 'بدل السكن', width: 12 },
    { key: 'transportAllowance', header: 'بدل النقل', width: 12 },
    { key: 'bankName', header: 'البنك', width: 15 },
    { key: 'iban', header: 'رقم IBAN', width: 28 },
    { key: 'educationLevel', header: 'المستوى التعليمي', width: 15 },
];

// توليد قالب Excel للتحميل
export async function generateTemplate() {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'منصة مسارات';
    workbook.created = new Date();

    // ورقة البيانات الرئيسية
    const ws = workbook.addWorksheet('بيانات الموظفين', {
        views: [{ rightToLeft: true }],
    });

    ws.columns = TEMPLATE_COLUMNS.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width,
    }));

    // تنسيق رؤوس الأعمدة
    const headerRow = ws.getRow(1);
    headerRow.height = 30;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Cairo' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // تمييز الأعمدة الإلزامية
    TEMPLATE_COLUMNS.forEach((col, idx) => {
        if (col.required) {
            const cell = headerRow.getCell(idx + 1);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
        }
    });

    // سطر مثال
    ws.addRow({
        nationalId: '1012345678',
        firstNameAr: 'محمد',
        fatherNameAr: 'عبدالله',
        grandfatherNameAr: 'سعود',
        familyNameAr: 'الشهري',
        firstNameEn: 'Mohammed',
        fatherNameEn: 'Abdullah',
        grandfatherNameEn: 'Saud',
        familyNameEn: 'Al-Shahri',
        gender: 'M',
        birthDate: '1990-05-15',
        nationality: '001',
        maritalStatus: '01',
        mobile: '0512345678',
        email: 'mohammed@example.sa',
        employeeNumber: 'EMP-001',
        departmentId: 'تقنية المعلومات',
        position: 'مهندس برمجيات',
        hireDate: '2024-01-15',
        contractType: '01',
        basicSalary: '12000',
        housingAllowance: '3000',
        transportAllowance: '1500',
        bankName: 'الراجحي',
        iban: 'SA1234567890123456789012',
        educationLevel: 'بكالوريوس',
    });

    // تنسيق سطر المثال
    const exampleRow = ws.getRow(2);
    exampleRow.font = { color: { argb: 'FF6B7280' }, italic: true };

    // ورقة المراجع
    const refWs = workbook.addWorksheet('الأكواد المرجعية', {
        views: [{ rightToLeft: true }],
    });

    refWs.columns = [
        { header: 'الحقل', key: 'field', width: 20 },
        { header: 'الكود', key: 'code', width: 12 },
        { header: 'الوصف', key: 'desc', width: 30 },
    ];

    const refHeader = refWs.getRow(1);
    refHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    refHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A38F5' } };

    const refs = [
        { field: 'الجنس', code: 'M', desc: 'ذكر' },
        { field: 'الجنس', code: 'F', desc: 'أنثى' },
        { field: 'الجنسية', code: '001', desc: 'سعودي' },
        { field: 'الحالة الاجتماعية', code: '01', desc: 'أعزب' },
        { field: 'الحالة الاجتماعية', code: '02', desc: 'متزوج' },
        { field: 'الحالة الاجتماعية', code: '03', desc: 'مطلق' },
        { field: 'الحالة الاجتماعية', code: '04', desc: 'أرمل' },
        { field: 'نوع العقد', code: '01', desc: 'دائم' },
        { field: 'نوع العقد', code: '02', desc: 'مؤقت' },
        { field: 'نوع العقد', code: '03', desc: 'جزئي' },
    ];
    refs.forEach(ref => refWs.addRow(ref));

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

// قراءة ملف Excel المرفوع
export async function parseImportFile(file) {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const ws = workbook.getWorksheet(1);
    if (!ws) throw new Error('لم يتم العثور على ورقة البيانات');

    const rows = [];
    const headerMap = {};

    // ربط رؤوس الأعمدة بالمفاتيح
    ws.getRow(1).eachCell((cell, colNumber) => {
        const headerText = cell.value?.toString()?.trim();
        if (!headerText) return;
        const col = TEMPLATE_COLUMNS.find(c =>
            c.header === headerText ||
            c.header.replace(/\s+/g, '') === headerText.replace(/\s+/g, '')
        );
        if (col) headerMap[colNumber] = col.key;
    });

    if (Object.keys(headerMap).length === 0) {
        throw new Error('لم يتم التعرف على أعمدة القالب. تأكد من استخدام القالب الصحيح');
    }

    // قراءة البيانات
    ws.eachRow((row, rowNumber) => {
        if (rowNumber <= 1) return; // تخطي الهيدر

        const record = {};
        let hasData = false;
        row.eachCell((cell, colNumber) => {
            const key = headerMap[colNumber];
            if (key) {
                let value = cell.value;
                // معالجة التواريخ
                if (value instanceof Date) {
                    value = value.toISOString().split('T')[0];
                }
                record[key] = value?.toString()?.trim() || '';
                if (record[key]) hasData = true;
            }
        });

        if (hasData) {
            rows.push({ rowNumber, data: record });
        }
    });

    return rows;
}

// التحقق من صحة البيانات المستوردة
export function validateImportRows(rows, existingEmployees = [], departments = []) {
    const results = {
        total: rows.length,
        valid: 0,
        invalid: 0,
        errors: [],
        warnings: [],
        records: [],
    };

    const seenNationalIds = new Set();

    for (const row of rows) {
        const rowErrors = [];
        const rowWarnings = [];
        const data = row.data;

        // التحقق من التكرار في الملف نفسه
        if (data.nationalId) {
            if (seenNationalIds.has(data.nationalId)) {
                rowErrors.push({ field: 'nationalId', message: 'رقم الهوية مكرر في الملف', severity: 'error' });
            }
            seenNationalIds.add(data.nationalId);
        }

        // التحقق من التكرار مع الموظفين الحاليين
        if (data.nationalId && existingEmployees.some(e => e.nationalId === data.nationalId)) {
            rowErrors.push({ field: 'nationalId', message: 'رقم الهوية موجود مسبقاً في النظام', severity: 'error' });
        }

        // الحقول الإلزامية
        if (!data.nationalId || !/^[12]\d{9}$/.test(data.nationalId)) {
            rowErrors.push({ field: 'nationalId', message: 'رقم الهوية غير صحيح', severity: 'error' });
        }
        if (!data.firstNameAr?.trim()) {
            rowErrors.push({ field: 'firstNameAr', message: 'الاسم الأول مطلوب', severity: 'error' });
        }
        if (!data.familyNameAr?.trim()) {
            rowErrors.push({ field: 'familyNameAr', message: 'اسم العائلة مطلوب', severity: 'error' });
        }
        if (!data.employeeNumber?.trim()) {
            rowErrors.push({ field: 'employeeNumber', message: 'الرقم الوظيفي مطلوب', severity: 'error' });
        }
        if (!data.basicSalary || Number(data.basicSalary) <= 0) {
            rowErrors.push({ field: 'basicSalary', message: 'الراتب الأساسي مطلوب', severity: 'error' });
        }

        // التحقق من الإدارة
        if (data.departmentId) {
            const deptMatch = departments.find(d =>
                d.id?.toString() === data.departmentId || d.name === data.departmentId
            );
            if (!deptMatch) {
                rowWarnings.push({ field: 'departmentId', message: `الإدارة "${data.departmentId}" غير موجودة`, severity: 'warning' });
            } else {
                data._resolvedDepartmentId = deptMatch.id;
            }
        }

        // حساب التطابق
        const compliance = calculateFormCompliance(data);
        const isValid = rowErrors.length === 0;
        if (isValid) results.valid++;
        else results.invalid++;

        results.records.push({
            rowNumber: row.rowNumber,
            data: data,
            compliance: compliance.percentage,
            isValid,
            errors: rowErrors,
            warnings: rowWarnings,
        });

        results.errors.push(...rowErrors.map(e => ({
            ...e,
            rowNumber: row.rowNumber,
            recordName: `${data.firstNameAr || ''} ${data.familyNameAr || ''}`.trim() || `سطر ${row.rowNumber}`,
        })));
        results.warnings.push(...rowWarnings.map(w => ({
            ...w,
            rowNumber: row.rowNumber,
            recordName: `${data.firstNameAr || ''} ${data.familyNameAr || ''}`.trim() || `سطر ${row.rowNumber}`,
        })));
    }

    return results;
}
