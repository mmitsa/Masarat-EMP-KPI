/**
 * Setup Service - خدمة معالجة بيانات تهيئة النظام
 * يتعامل مع قراءة ملفات Excel والتحقق من البيانات وحفظها في قاعدة البيانات
 */

import ExcelJS from 'exceljs';

// استيراد API Adapter
const db = typeof window !== 'undefined'
    ? require('./setup-api-adapter').default
    : require('./setup-api-adapter').default;

// ==========================================
// تعريف القوالب وحقولها
// ==========================================

const TEMPLATE_DEFINITIONS = {
    // الموارد البشرية
    departments: {
        tableName: 'Departments',
        keyField: 'department_code',
        fields: {
            department_code: { required: true, type: 'string', maxLength: 20 },
            department_name_ar: { required: true, type: 'string', maxLength: 100 },
            department_name_en: { required: false, type: 'string', maxLength: 100 },
            parent_code: { required: false, type: 'string', maxLength: 20, foreignKey: 'departments.department_code' },
            manager_national_id: { required: false, type: 'string', length: 10, foreignKey: 'employees.national_id' },
            cost_center: { required: false, type: 'string', maxLength: 20 },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 1,
    },
    positions: {
        tableName: 'Positions',
        keyField: 'position_code',
        fields: {
            position_code: { required: true, type: 'string', maxLength: 20 },
            position_name_ar: { required: true, type: 'string', maxLength: 100 },
            position_name_en: { required: false, type: 'string', maxLength: 100 },
            grade_level: { required: false, type: 'number', min: 1, max: 20 },
            min_salary: { required: false, type: 'number', min: 0 },
            max_salary: { required: false, type: 'number', min: 0 },
            job_family: { required: false, type: 'enum', values: ['إدارية', 'تقنية', 'مالية', 'هندسية', 'طبية', 'أخرى'] },
        },
        order: 2,
    },
    employees: {
        tableName: 'Employees',
        keyField: 'national_id',
        dependsOn: ['departments', 'positions'],
        fields: {
            national_id: { required: true, type: 'string', length: 10, pattern: /^\d{10}$/ },
            employee_number: { required: true, type: 'string', maxLength: 20 },
            first_name_ar: { required: true, type: 'string', maxLength: 50 },
            second_name_ar: { required: true, type: 'string', maxLength: 50 },
            third_name_ar: { required: false, type: 'string', maxLength: 50 },
            last_name_ar: { required: true, type: 'string', maxLength: 50 },
            first_name_en: { required: false, type: 'string', maxLength: 50 },
            last_name_en: { required: false, type: 'string', maxLength: 50 },
            gender: { required: true, type: 'enum', values: ['ذكر', 'أنثى'] },
            birth_date: { required: true, type: 'date' },
            nationality_code: { required: true, type: 'string', maxLength: 5 },
            marital_status: { required: false, type: 'enum', values: ['أعزب', 'متزوج', 'مطلق', 'أرمل'] },
            email: { required: true, type: 'email' },
            phone: { required: true, type: 'string', pattern: /^05\d{8}$/ },
            department_code: { required: true, type: 'string', foreignKey: 'departments.department_code' },
            position_code: { required: true, type: 'string', foreignKey: 'positions.position_code' },
            hire_date: { required: true, type: 'date' },
            contract_type: { required: true, type: 'enum', values: ['دائم', 'مؤقت', 'تمهير', 'تدريب'] },
            contract_end_date: { required: false, type: 'date' },
            basic_salary: { required: true, type: 'number', min: 0 },
            housing_allowance: { required: false, type: 'number', min: 0 },
            transport_allowance: { required: false, type: 'number', min: 0 },
            bank_code: { required: false, type: 'string', maxLength: 5 },
            iban: { required: false, type: 'string', pattern: /^SA\d{22}$/ },
            employment_status: { required: true, type: 'enum', values: ['على رأس العمل', 'في إجازة', 'معار', 'منتدب', 'موقوف', 'منتهي الخدمة'] },
        },
        order: 3,
    },
    leave_types: {
        tableName: 'LeaveTypes',
        keyField: 'leave_code',
        fields: {
            leave_code: { required: true, type: 'string', maxLength: 20 },
            leave_name_ar: { required: true, type: 'string', maxLength: 100 },
            leave_name_en: { required: false, type: 'string', maxLength: 100 },
            max_days_per_year: { required: true, type: 'number', min: 0 },
            is_paid: { required: true, type: 'boolean' },
            requires_attachment: { required: false, type: 'boolean', default: false },
            gender_specific: { required: false, type: 'enum', values: ['الكل', 'ذكر', 'أنثى'], default: 'الكل' },
        },
        order: 4,
    },
    leave_balances: {
        tableName: 'LeaveBalances',
        keyField: ['national_id', 'leave_code', 'year'],
        dependsOn: ['employees', 'leave_types'],
        fields: {
            national_id: { required: true, type: 'string', foreignKey: 'employees.national_id' },
            leave_code: { required: true, type: 'string', foreignKey: 'leave_types.leave_code' },
            balance_days: { required: true, type: 'number', min: 0 },
            year: { required: true, type: 'number', min: 2020, max: 2100 },
        },
        order: 5,
    },

    // المستودعات
    warehouses: {
        tableName: 'Warehouses',
        keyField: 'warehouse_code',
        fields: {
            warehouse_code: { required: true, type: 'string', maxLength: 20 },
            warehouse_name_ar: { required: true, type: 'string', maxLength: 100 },
            warehouse_name_en: { required: false, type: 'string', maxLength: 100 },
            location: { required: false, type: 'string', maxLength: 200 },
            warehouse_type: { required: true, type: 'enum', values: ['رئيسي', 'فرعي', 'عبور'] },
            responsible_national_id: { required: false, type: 'string', foreignKey: 'employees.national_id' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 1,
    },
    item_categories: {
        tableName: 'ItemCategories',
        keyField: 'category_code',
        fields: {
            category_code: { required: true, type: 'string', maxLength: 20 },
            category_name_ar: { required: true, type: 'string', maxLength: 100 },
            category_name_en: { required: false, type: 'string', maxLength: 100 },
            parent_code: { required: false, type: 'string', foreignKey: 'item_categories.category_code' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 2,
    },
    units_of_measure: {
        tableName: 'UnitsOfMeasure',
        keyField: 'unit_code',
        fields: {
            unit_code: { required: true, type: 'string', maxLength: 10 },
            unit_name_ar: { required: true, type: 'string', maxLength: 50 },
            unit_name_en: { required: false, type: 'string', maxLength: 50 },
            is_base_unit: { required: true, type: 'boolean', default: true },
        },
        order: 3,
    },
    items: {
        tableName: 'Items',
        keyField: 'item_code',
        dependsOn: ['item_categories', 'units_of_measure'],
        fields: {
            item_code: { required: true, type: 'string', maxLength: 20 },
            item_name_ar: { required: true, type: 'string', maxLength: 100 },
            item_name_en: { required: false, type: 'string', maxLength: 100 },
            category_code: { required: true, type: 'string', foreignKey: 'item_categories.category_code' },
            unit_code: { required: true, type: 'string', foreignKey: 'units_of_measure.unit_code' },
            description: { required: false, type: 'string', maxLength: 500 },
            min_stock: { required: false, type: 'number', min: 0, default: 0 },
            max_stock: { required: false, type: 'number', min: 0, default: 10000 },
            reorder_level: { required: false, type: 'number', min: 0 },
            unit_price: { required: false, type: 'number', min: 0 },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 4,
    },
    opening_balances: {
        tableName: 'InventoryOpeningBalances',
        keyField: ['item_code', 'warehouse_code'],
        dependsOn: ['items', 'warehouses'],
        fields: {
            item_code: { required: true, type: 'string', foreignKey: 'items.item_code' },
            warehouse_code: { required: true, type: 'string', foreignKey: 'warehouses.warehouse_code' },
            quantity: { required: true, type: 'number', min: 0 },
            unit_cost: { required: false, type: 'number', min: 0 },
            batch_number: { required: false, type: 'string', maxLength: 50 },
            expiry_date: { required: false, type: 'date' },
        },
        order: 5,
    },

    // الأصول الثابتة (IPSAS 45/46) - متكاملة مع المالية والعهد
    fixed_asset_categories: {
        tableName: 'FixedAssetCategories',
        keyField: 'category_code',
        dependsOn: ['chart_of_accounts'], // يعتمد على دليل الحسابات للربط المالي
        fields: {
            category_code: { required: true, type: 'string', maxLength: 20 },
            category_name_ar: { required: true, type: 'string', maxLength: 100 },
            category_name_en: { required: false, type: 'string', maxLength: 100 },
            parent_code: { required: false, type: 'string', foreignKey: 'fixed_asset_categories.category_code' },
            depreciation_method: { required: true, type: 'enum', values: ['قسط ثابت', 'قسط متناقص', 'وحدات الإنتاج'] },
            useful_life_years: { required: true, type: 'number', min: 1, max: 100 },
            residual_value_percent: { required: false, type: 'number', min: 0, max: 100, default: 0 },
            gl_asset_account: { required: false, type: 'string', foreignKey: 'chart_of_accounts.account_code' },
            gl_depreciation_account: { required: false, type: 'string', foreignKey: 'chart_of_accounts.account_code' },
            gl_expense_account: { required: false, type: 'string', foreignKey: 'chart_of_accounts.account_code' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 6,
    },
    fixed_assets: {
        tableName: 'FixedAssets',
        keyField: 'asset_code',
        dependsOn: ['fixed_asset_categories', 'departments', 'employees'], // ربط كامل مع الأقسام والموظفين
        fields: {
            asset_code: { required: true, type: 'string', maxLength: 20 },
            asset_name_ar: { required: true, type: 'string', maxLength: 200 },
            asset_name_en: { required: false, type: 'string', maxLength: 200 },
            category_code: { required: true, type: 'string', foreignKey: 'fixed_asset_categories.category_code' },
            description: { required: false, type: 'string', maxLength: 500 },
            serial_number: { required: false, type: 'string', maxLength: 50 },
            barcode: { required: false, type: 'string', maxLength: 50 },
            acquisition_date: { required: true, type: 'date' },
            acquisition_cost: { required: true, type: 'number', min: 0 },
            useful_life_years: { required: false, type: 'number', min: 1, max: 100 },
            residual_value: { required: false, type: 'number', min: 0, default: 0 },
            depreciation_start_date: { required: false, type: 'date' },
            current_value: { required: false, type: 'number', min: 0 },
            accumulated_depreciation: { required: false, type: 'number', min: 0, default: 0 },
            location: { required: false, type: 'string', maxLength: 200 },
            department_code: { required: false, type: 'string', foreignKey: 'departments.department_code' },
            custodian_national_id: { required: false, type: 'string', foreignKey: 'employees.national_id' },
            status: { required: true, type: 'enum', values: ['نشط', 'صيانة', 'معطل', 'مباع', 'مستبعد'] },
            warranty_expiry: { required: false, type: 'date' },
            supplier_name: { required: false, type: 'string', maxLength: 100 },
            purchase_order_number: { required: false, type: 'string', maxLength: 50 },
            invoice_number: { required: false, type: 'string', maxLength: 50 },
            notes: { required: false, type: 'string', maxLength: 1000 },
        },
        order: 7,
    },
    asset_custody: {
        tableName: 'AssetCustody',
        keyField: ['asset_code', 'custodian_national_id'],
        dependsOn: ['fixed_assets', 'employees'],
        fields: {
            asset_code: { required: true, type: 'string', foreignKey: 'fixed_assets.asset_code' },
            custodian_national_id: { required: true, type: 'string', foreignKey: 'employees.national_id' },
            assignment_date: { required: true, type: 'date' },
            return_date: { required: false, type: 'date' },
            condition_on_receipt: { required: true, type: 'enum', values: ['جديد', 'جيد', 'مستعمل', 'يحتاج صيانة', 'تالف'] },
            condition_on_return: { required: false, type: 'enum', values: ['جيد', 'مستعمل', 'يحتاج صيانة', 'تالف'] },
            location: { required: false, type: 'string', maxLength: 200 },
            notes: { required: false, type: 'string', maxLength: 500 },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 8,
    },

    // إدارة الحركة
    vehicles: {
        tableName: 'Vehicles',
        keyField: 'vehicle_code',
        fields: {
            vehicle_code: { required: true, type: 'string', maxLength: 20 },
            plate_number: { required: true, type: 'string', maxLength: 20 },
            plate_type: { required: true, type: 'enum', values: ['خصوصي', 'نقل', 'حافلة', 'دراجة نارية', 'أخرى'] },
            make: { required: true, type: 'string', maxLength: 50 },
            model: { required: true, type: 'string', maxLength: 50 },
            year: { required: true, type: 'number', min: 1990, max: 2100 },
            color: { required: false, type: 'string', maxLength: 30 },
            vin: { required: false, type: 'string', maxLength: 20 },
            vehicle_type: { required: true, type: 'enum', values: ['سيدان', 'دفع رباعي', 'فان', 'شاحنة صغيرة', 'شاحنة', 'حافلة'] },
            fuel_type: { required: true, type: 'enum', values: ['بنزين', 'ديزل', 'كهربائي', 'هجين'] },
            capacity: { required: false, type: 'number', min: 0 },
            current_mileage: { required: false, type: 'number', min: 0 },
            registration_expiry: { required: false, type: 'date' },
            insurance_expiry: { required: false, type: 'date' },
            assigned_department_code: { required: false, type: 'string', foreignKey: 'departments.department_code' },
            status: { required: true, type: 'enum', values: ['نشط', 'صيانة', 'معطل', 'محجوز'] },
        },
        order: 1,
    },
    drivers: {
        tableName: 'Drivers',
        keyField: 'national_id',
        dependsOn: ['employees'],
        fields: {
            national_id: { required: true, type: 'string', foreignKey: 'employees.national_id' },
            license_number: { required: true, type: 'string', maxLength: 20 },
            license_type: { required: true, type: 'enum', values: ['خصوصي', 'عام', 'نقل ثقيل', 'حافلات'] },
            license_expiry: { required: true, type: 'date' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 2,
    },

    // الإدارة المالية
    chart_of_accounts: {
        tableName: 'ChartOfAccounts',
        keyField: 'account_code',
        fields: {
            account_code: { required: true, type: 'string', maxLength: 20 },
            account_name_ar: { required: true, type: 'string', maxLength: 100 },
            account_name_en: { required: false, type: 'string', maxLength: 100 },
            parent_code: { required: false, type: 'string', foreignKey: 'chart_of_accounts.account_code' },
            account_type: { required: true, type: 'enum', values: ['أصول', 'خصوم', 'حقوق ملكية', 'إيرادات', 'مصروفات'] },
            account_nature: { required: true, type: 'enum', values: ['مدين', 'دائن'] },
            is_posting: { required: true, type: 'boolean' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 1,
    },
    cost_centers: {
        tableName: 'CostCenters',
        keyField: 'cost_center_code',
        fields: {
            cost_center_code: { required: true, type: 'string', maxLength: 20 },
            cost_center_name_ar: { required: true, type: 'string', maxLength: 100 },
            cost_center_name_en: { required: false, type: 'string', maxLength: 100 },
            parent_code: { required: false, type: 'string', foreignKey: 'cost_centers.cost_center_code' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 2,
    },
    banks: {
        tableName: 'BankAccounts',
        keyField: 'bank_account_code',
        fields: {
            bank_account_code: { required: true, type: 'string', maxLength: 20 },
            bank_name: { required: true, type: 'string', maxLength: 100 },
            account_number: { required: true, type: 'string', maxLength: 30 },
            iban: { required: true, type: 'string', pattern: /^SA\d{22}$/ },
            currency: { required: true, type: 'enum', values: ['SAR', 'USD', 'EUR'] },
            account_type: { required: false, type: 'enum', values: ['جاري', 'ادخار', 'وديعة'] },
            gl_account_code: { required: false, type: 'string', foreignKey: 'chart_of_accounts.account_code' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 3,
    },
    opening_balances_gl: {
        tableName: 'GLOpeningBalances',
        keyField: ['account_code', 'fiscal_year'],
        dependsOn: ['chart_of_accounts'],
        fields: {
            account_code: { required: true, type: 'string', foreignKey: 'chart_of_accounts.account_code' },
            debit_amount: { required: false, type: 'number', min: 0, default: 0 },
            credit_amount: { required: false, type: 'number', min: 0, default: 0 },
            cost_center_code: { required: false, type: 'string', foreignKey: 'cost_centers.cost_center_code' },
            fiscal_year: { required: true, type: 'number', min: 2020, max: 2100 },
        },
        order: 4,
    },

    // الأرشفة
    document_categories: {
        tableName: 'DocumentCategories',
        keyField: 'category_code',
        fields: {
            category_code: { required: true, type: 'string', maxLength: 20 },
            category_name_ar: { required: true, type: 'string', maxLength: 100 },
            category_name_en: { required: false, type: 'string', maxLength: 100 },
            parent_code: { required: false, type: 'string', foreignKey: 'document_categories.category_code' },
            retention_years: { required: false, type: 'number', min: 1, max: 100 },
            requires_approval: { required: false, type: 'boolean', default: false },
            is_confidential: { required: false, type: 'boolean', default: false },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 1,
    },

    // قياس الأداء
    kpi_definitions: {
        tableName: 'KPIDefinitions',
        keyField: 'kpi_code',
        fields: {
            kpi_code: { required: true, type: 'string', maxLength: 20 },
            kpi_name_ar: { required: true, type: 'string', maxLength: 100 },
            kpi_name_en: { required: false, type: 'string', maxLength: 100 },
            description: { required: false, type: 'string', maxLength: 500 },
            unit: { required: true, type: 'enum', values: ['نسبة مئوية', 'عدد', 'أيام', 'ساعات', 'ريال'] },
            target_value: { required: false, type: 'number' },
            weight: { required: false, type: 'number', min: 0, max: 100 },
            measurement_frequency: { required: false, type: 'enum', values: ['يومي', 'أسبوعي', 'شهري', 'ربع سنوي', 'سنوي'] },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 1,
    },
    evaluation_criteria: {
        tableName: 'EvaluationCriteria',
        keyField: 'criteria_code',
        fields: {
            criteria_code: { required: true, type: 'string', maxLength: 20 },
            criteria_name_ar: { required: true, type: 'string', maxLength: 100 },
            criteria_name_en: { required: false, type: 'string', maxLength: 100 },
            description: { required: false, type: 'string', maxLength: 500 },
            max_score: { required: true, type: 'number', min: 1 },
            weight: { required: true, type: 'number', min: 0, max: 100 },
            applies_to: { required: false, type: 'enum', values: ['الكل', 'إداري', 'فني', 'تنفيذي'], default: 'الكل' },
            is_active: { required: true, type: 'boolean', default: true },
        },
        order: 2,
    },
};

// ==========================================
// معالجة ملف Excel
// ==========================================

export async function processExcelFile(fileBuffer, templateId, categoryId) {
    const template = TEMPLATE_DEFINITIONS[templateId];

    if (!template) {
        return {
            success: false,
            error: `قالب غير معروف: ${templateId}`,
        };
    }

    try {
        // قراءة ملف Excel باستخدام ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);

        // الحصول على أول ورقة عمل
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return {
                success: false,
                error: 'الملف لا يحتوي على أي أوراق عمل',
            };
        }

        // تحويل إلى مصفوفة ثنائية الأبعاد
        const rawData = [];
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const rowValues = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                // التعامل مع أنواع البيانات المختلفة
                let value = cell.value;
                if (value && typeof value === 'object') {
                    if (value.result !== undefined) {
                        value = value.result; // للخلايا التي تحتوي على صيغ
                    } else if (value instanceof Date) {
                        value = value; // الاحتفاظ بالتاريخ كما هو
                    } else if (value.text) {
                        value = value.text; // للنصوص المنسقة
                    }
                }
                rowValues[colNumber - 1] = value;
            });
            rawData.push(rowValues);
        });

        if (rawData.length < 4) {
            return {
                success: false,
                error: 'الملف لا يحتوي على بيانات كافية',
            };
        }

        // استخراج أسماء الأعمدة (الصف الرابع عادة بعد العنوان والوصف والملاحظات)
        const headerRow = findHeaderRow(rawData, template.fields);

        if (headerRow === -1) {
            return {
                success: false,
                error: 'لم يتم العثور على صف العناوين في الملف. تأكد من استخدام القالب الصحيح.',
            };
        }

        const headers = rawData[headerRow];
        const fieldMap = mapHeadersToFields(headers, template.fields);

        if (Object.keys(fieldMap).length === 0) {
            return {
                success: false,
                error: 'لم يتم التعرف على أي أعمدة في الملف',
            };
        }

        // استخراج البيانات (بدءاً من صف الملاحظات + 2)
        const dataRows = rawData.slice(headerRow + 2).filter(row =>
            row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );

        if (dataRows.length === 0) {
            return {
                success: false,
                error: 'لا توجد بيانات للاستيراد في الملف',
            };
        }

        // تحويل البيانات إلى كائنات
        const data = [];
        const validationErrors = [];

        dataRows.forEach((row, rowIndex) => {
            const rowData = {};
            let hasData = false;

            Object.entries(fieldMap).forEach(([fieldName, colIndex]) => {
                const cellValue = row[colIndex];

                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    rowData[fieldName] = cellValue;
                    hasData = true;
                }
            });

            if (hasData) {
                rowData._rowNumber = headerRow + rowIndex + 3; // +3 للصفوف السابقة
                data.push(rowData);
            }
        });

        return {
            success: true,
            data,
            totalRows: data.length,
        };

    } catch (error) {
        console.error('Excel processing error:', error);
        return {
            success: false,
            error: 'فشل في قراءة ملف Excel: ' + error.message,
        };
    }
}

// البحث عن صف العناوين
function findHeaderRow(rawData, fields) {
    const fieldLabels = Object.values(fields).map(f => f.label || '').filter(Boolean);
    const fieldNames = Object.keys(fields);

    for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (!Array.isArray(row)) continue;

        const rowValues = row.map(cell => String(cell || '').trim());

        // التحقق مما إذا كان هذا الصف يحتوي على عناوين
        const matchCount = rowValues.filter(val =>
            fieldLabels.some(label => val.includes(label)) ||
            fieldNames.some(name => val.toLowerCase().includes(name.toLowerCase()))
        ).length;

        if (matchCount >= Math.min(3, Object.keys(fields).length / 2)) {
            return i;
        }
    }

    return -1;
}

// تعيين الأعمدة للحقول
function mapHeadersToFields(headers, fields) {
    const fieldMap = {};

    headers.forEach((header, index) => {
        if (!header) return;

        const headerStr = String(header).trim();

        // البحث عن تطابق
        for (const [fieldName, fieldDef] of Object.entries(fields)) {
            const fieldLabel = getFieldLabel(fieldName);

            if (headerStr === fieldLabel ||
                headerStr.includes(fieldLabel) ||
                fieldLabel.includes(headerStr) ||
                headerStr.toLowerCase() === fieldName.toLowerCase() ||
                headerStr.toLowerCase().replace(/[_\s]/g, '') === fieldName.toLowerCase().replace(/[_\s]/g, '')) {
                fieldMap[fieldName] = index;
                break;
            }
        }
    });

    return fieldMap;
}

// الحصول على التسمية العربية للحقل
function getFieldLabel(fieldName) {
    const labels = {
        department_code: 'كود القسم',
        department_name_ar: 'اسم القسم (عربي)',
        department_name_en: 'اسم القسم (إنجليزي)',
        parent_code: 'كود القسم الأب',
        manager_national_id: 'هوية مدير القسم',
        cost_center: 'مركز التكلفة',
        is_active: 'نشط',
        position_code: 'كود المسمى',
        position_name_ar: 'المسمى الوظيفي (عربي)',
        position_name_en: 'المسمى الوظيفي (إنجليزي)',
        grade_level: 'المستوى/الدرجة',
        min_salary: 'الحد الأدنى للراتب',
        max_salary: 'الحد الأعلى للراتب',
        job_family: 'عائلة الوظيفة',
        national_id: 'رقم الهوية',
        employee_number: 'الرقم الوظيفي',
        first_name_ar: 'الاسم الأول (عربي)',
        second_name_ar: 'اسم الأب (عربي)',
        third_name_ar: 'اسم الجد (عربي)',
        last_name_ar: 'اسم العائلة (عربي)',
        first_name_en: 'الاسم الأول (إنجليزي)',
        last_name_en: 'اسم العائلة (إنجليزي)',
        gender: 'الجنس',
        birth_date: 'تاريخ الميلاد',
        nationality_code: 'كود الجنسية',
        marital_status: 'الحالة الاجتماعية',
        email: 'البريد الإلكتروني',
        phone: 'رقم الجوال',
        hire_date: 'تاريخ التعيين',
        contract_type: 'نوع العقد',
        contract_end_date: 'تاريخ انتهاء العقد',
        basic_salary: 'الراتب الأساسي',
        housing_allowance: 'بدل السكن',
        transport_allowance: 'بدل النقل',
        bank_code: 'كود البنك',
        iban: 'رقم الآيبان',
        employment_status: 'الحالة الوظيفية',
        // ... يمكن إضافة المزيد
    };

    return labels[fieldName] || fieldName;
}

// ==========================================
// التحقق من البيانات
// ==========================================

export async function validateImportData(data, templateId, tenantId, session = null) {
    const template = TEMPLATE_DEFINITIONS[templateId];

    if (!template) {
        return { success: false, errors: [{ message: 'قالب غير معروف' }] };
    }

    const errors = [];
    const warnings = [];
    const validData = [];

    // تحميل البيانات الموجودة للتحقق من التكرار والمراجع
    const existingData = await loadExistingData(templateId, tenantId, session);
    const referencedData = await loadReferencedData(template, tenantId, session);

    for (const row of data) {
        const rowErrors = [];
        const rowWarnings = [];
        const processedRow = {};

        // التحقق من كل حقل
        for (const [fieldName, fieldDef] of Object.entries(template.fields)) {
            const value = row[fieldName];
            const validation = validateField(value, fieldDef, fieldName, row._rowNumber);

            if (validation.error) {
                rowErrors.push(validation.error);
            } else if (validation.warning) {
                rowWarnings.push(validation.warning);
            }

            processedRow[fieldName] = validation.value;
        }

        // التحقق من المفتاح الرئيسي
        const keyValue = getKeyValue(processedRow, template.keyField);

        if (keyValue) {
            // التحقق من التكرار في الملف
            const duplicateInFile = validData.find(d => getKeyValue(d, template.keyField) === keyValue);

            if (duplicateInFile) {
                rowErrors.push({
                    row: row._rowNumber,
                    field: Array.isArray(template.keyField) ? template.keyField.join('+') : template.keyField,
                    message: `قيمة مكررة في الملف: ${keyValue}`,
                });
            }

            // التحقق من وجوده في قاعدة البيانات
            if (existingData.has(keyValue)) {
                rowWarnings.push({
                    row: row._rowNumber,
                    message: `السجل موجود مسبقاً وسيتم تحديثه: ${keyValue}`,
                });
                processedRow._isUpdate = true;
            }
        }

        // التحقق من المراجع الخارجية
        for (const [fieldName, fieldDef] of Object.entries(template.fields)) {
            if (fieldDef.foreignKey && processedRow[fieldName]) {
                const [refTable, refField] = fieldDef.foreignKey.split('.');
                const refData = referencedData[refTable];

                if (refData && !refData.has(processedRow[fieldName])) {
                    rowErrors.push({
                        row: row._rowNumber,
                        field: fieldName,
                        message: `مرجع غير موجود: ${processedRow[fieldName]} (${getFieldLabel(fieldName)})`,
                    });
                }
            }
        }

        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
        } else {
            processedRow._rowNumber = row._rowNumber;
            validData.push(processedRow);
            warnings.push(...rowWarnings);
        }
    }

    return {
        success: errors.length === 0,
        errors,
        warnings,
        validData,
        totalValid: validData.length,
        totalErrors: errors.length,
    };
}

// التحقق من حقل واحد
function validateField(value, fieldDef, fieldName, rowNumber) {
    let processedValue = value;
    let error = null;
    let warning = null;

    // تحويل البيانات المنطقية
    if (fieldDef.type === 'boolean') {
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            processedValue = ['نعم', 'true', '1', 'yes', 'صحيح'].includes(lowerValue);
        } else {
            processedValue = Boolean(value);
        }
    }

    // التحقق من القيم المطلوبة
    if (fieldDef.required && (value === null || value === undefined || value === '')) {
        if (fieldDef.default !== undefined) {
            processedValue = fieldDef.default;
        } else {
            error = {
                row: rowNumber,
                field: fieldName,
                message: `الحقل مطلوب: ${getFieldLabel(fieldName)}`,
            };
            return { value: processedValue, error, warning };
        }
    }

    // إذا كانت القيمة فارغة وغير مطلوبة، استخدم القيمة الافتراضية
    if ((value === null || value === undefined || value === '') && fieldDef.default !== undefined) {
        processedValue = fieldDef.default;
    }

    if (value === null || value === undefined || value === '') {
        return { value: processedValue, error: null, warning: null };
    }

    // التحقق من النوع
    switch (fieldDef.type) {
        case 'number':
            processedValue = Number(value);
            if (isNaN(processedValue)) {
                error = {
                    row: rowNumber,
                    field: fieldName,
                    message: `قيمة رقمية غير صالحة: ${value}`,
                };
            } else {
                if (fieldDef.min !== undefined && processedValue < fieldDef.min) {
                    error = {
                        row: rowNumber,
                        field: fieldName,
                        message: `القيمة أقل من الحد الأدنى (${fieldDef.min}): ${value}`,
                    };
                }
                if (fieldDef.max !== undefined && processedValue > fieldDef.max) {
                    error = {
                        row: rowNumber,
                        field: fieldName,
                        message: `القيمة أكبر من الحد الأعلى (${fieldDef.max}): ${value}`,
                    };
                }
            }
            break;

        case 'string':
            processedValue = String(value).trim();
            if (fieldDef.length && processedValue.length !== fieldDef.length) {
                error = {
                    row: rowNumber,
                    field: fieldName,
                    message: `طول النص يجب أن يكون ${fieldDef.length} حرف: ${getFieldLabel(fieldName)}`,
                };
            }
            if (fieldDef.maxLength && processedValue.length > fieldDef.maxLength) {
                error = {
                    row: rowNumber,
                    field: fieldName,
                    message: `النص أطول من الحد المسموح (${fieldDef.maxLength}): ${getFieldLabel(fieldName)}`,
                };
            }
            if (fieldDef.pattern && !fieldDef.pattern.test(processedValue)) {
                error = {
                    row: rowNumber,
                    field: fieldName,
                    message: `تنسيق غير صالح: ${getFieldLabel(fieldName)}`,
                };
            }
            break;

        case 'email':
            processedValue = String(value).trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(processedValue)) {
                error = {
                    row: rowNumber,
                    field: fieldName,
                    message: `بريد إلكتروني غير صالح: ${value}`,
                };
            }
            break;

        case 'date':
            if (value instanceof Date) {
                processedValue = value;
            } else {
                const dateValue = new Date(value);
                if (isNaN(dateValue.getTime())) {
                    error = {
                        row: rowNumber,
                        field: fieldName,
                        message: `تاريخ غير صالح: ${value}`,
                    };
                } else {
                    processedValue = dateValue;
                }
            }
            break;

        case 'enum':
            processedValue = String(value).trim();
            if (!fieldDef.values.includes(processedValue)) {
                error = {
                    row: rowNumber,
                    field: fieldName,
                    message: `قيمة غير مسموحة: ${value}. القيم المتاحة: ${fieldDef.values.join('، ')}`,
                };
            }
            break;
    }

    return { value: processedValue, error, warning };
}

// الحصول على قيمة المفتاح
function getKeyValue(row, keyField) {
    if (Array.isArray(keyField)) {
        const values = keyField.map(k => row[k]).filter(v => v !== null && v !== undefined);
        return values.length === keyField.length ? values.join('|') : null;
    }
    return row[keyField] || null;
}

// ==========================================
// تحميل البيانات الموجودة
// ==========================================

async function loadExistingData(templateId, tenantId, session = null) {
    const existingKeys = new Set();
    const template = TEMPLATE_DEFINITIONS[templateId];

    try {
        // جلب البيانات الموجودة من قاعدة البيانات المحاكاة
        const records = await db.findAll(template.tableName, {}, tenantId, session);
        records.forEach(r => {
            const keyValue = getKeyValue(r, template.keyField);
            if (keyValue) existingKeys.add(keyValue);
        });
    } catch (error) {
        console.warn('Error loading existing data:', error);
    }

    return existingKeys;
}

async function loadReferencedData(template, tenantId, session = null) {
    const referencedData = {};

    // جمع كل المراجع الخارجية
    const foreignKeys = Object.values(template.fields)
        .filter(f => f.foreignKey)
        .map(f => f.foreignKey);

    // تحميل البيانات للتحقق من المراجع
    for (const fk of foreignKeys) {
        const [tableName, field] = fk.split('.');
        referencedData[tableName] = new Set();

        try {
            // جلب المفاتيح الموجودة من قاعدة البيانات المحاكاة
            const refTemplate = Object.values(TEMPLATE_DEFINITIONS).find(t => t.tableName === tableName);
            if (refTemplate) {
                const records = await db.findAll(tableName, {}, tenantId, session);
                records.forEach(r => {
                    if (r[field]) referencedData[tableName].add(r[field]);
                });
            }
        } catch (error) {
            console.warn(`Error loading referenced data for ${tableName}:`, error);
        }
    }

    return referencedData;
}

// ==========================================
// حفظ البيانات في قاعدة البيانات
// ==========================================

export async function saveImportedData(validData, templateId, categoryId, tenantId, userId, session = null) {
    const template = TEMPLATE_DEFINITIONS[templateId];

    if (!template) {
        return { success: false, error: 'قالب غير معروف' };
    }

    let recordsImported = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;

    try {
        // بدء المعاملة
        await db.beginTransaction();

        for (const row of validData) {
            // إزالة الحقول الداخلية
            const dataToSave = { ...row };
            const isUpdate = dataToSave._isUpdate;
            delete dataToSave._rowNumber;
            delete dataToSave._isUpdate;

            // إضافة البيانات الوصفية
            dataToSave.tenant_id = tenantId;
            dataToSave.created_by = userId;
            dataToSave.created_at = new Date().toISOString();

            // الحصول على المفتاح الرئيسي
            const keyField = Array.isArray(template.keyField) ? template.keyField[0] : template.keyField;
            const keyValue = dataToSave[keyField];

            if (isUpdate) {
                // البحث عن السجل الموجود وتحديثه
                const existingRecord = await db.findBy(template.tableName, keyField, keyValue, tenantId, session);
                if (existingRecord) {
                    dataToSave.updated_by = userId;
                    dataToSave.updated_at = new Date().toISOString();
                    await db.update(template.tableName, existingRecord.id, dataToSave, session);
                    recordsUpdated++;
                } else {
                    // إذا لم يوجد، أنشئه
                    await db.insert(template.tableName, dataToSave, session);
                    recordsImported++;
                }
            } else {
                // إدراج سجل جديد
                await db.insert(template.tableName, dataToSave, session);
                recordsImported++;
            }
        }

        // تأكيد المعاملة
        await db.commit();

        // تحديث الهيكل التنظيمي إذا لزم الأمر
        if (['departments', 'employees', 'positions'].includes(templateId)) {
            await updateOrganizationalStructure(templateId, validData, tenantId, session);
        }

        // تسجيل العملية في سجل النشاطات
        await logImportActivity(templateId, categoryId, tenantId, userId, {
            recordsImported,
            recordsUpdated,
            recordsSkipped,
        });

        return {
            success: true,
            recordsImported,
            recordsUpdated,
            recordsSkipped,
        };

    } catch (error) {
        // التراجع عن المعاملة
        await db.rollback(session);

        console.error('Save error:', error);
        return {
            success: false,
            error: 'فشل في حفظ البيانات: ' + error.message,
        };
    }
}

// ==========================================
// تحديث الهيكل التنظيمي
// ==========================================

async function updateOrganizationalStructure(templateId, data, tenantId, session = null) {
    try {
        // تحديث العلاقات الشجرية للأقسام
        if (templateId === 'departments') {
            // بناء شجرة الأقسام
            // إنشاء تسلسل هرمي (hierarchy_path) لكل قسم
            const deptMap = new Map();
            data.forEach(dept => deptMap.set(dept.department_code, dept));

            for (const dept of data) {
                let hierarchyPath = dept.department_code;
                let currentParent = dept.parent_code;
                const visited = new Set([dept.department_code]);

                while (currentParent && deptMap.has(currentParent) && !visited.has(currentParent)) {
                    visited.add(currentParent);
                    hierarchyPath = `${currentParent}/${hierarchyPath}`;
                    currentParent = deptMap.get(currentParent).parent_code;
                }

                // تحديث مسار التسلسل الهرمي
                const existingDept = await db.findBy('Departments', 'department_code', dept.department_code, tenantId, session);
                if (existingDept) {
                    await db.update('Departments', existingDept.id, {
                        hierarchy_path: hierarchyPath,
                        depth: hierarchyPath.split('/').length,
                    }, session);
                }
            }

            console.log(`تم تحديث الهيكل التنظيمي للأقسام (${data.length} قسم)`);
        }

        // تحديث انتماء الموظفين للأقسام
        if (templateId === 'employees') {
            // التحقق من وجود الأقسام المرتبطة
            for (const emp of data) {
                const dept = await db.findBy('Departments', 'department_code', emp.department_code, tenantId, session);
                if (dept) {
                    // ربط الموظف بالقسم
                    const existingEmp = await db.findBy('Employees', 'national_id', emp.national_id, tenantId, session);
                    if (existingEmp) {
                        await db.update('Employees', existingEmp.id, {
                            department_id: dept.id,
                            department_hierarchy: dept.hierarchy_path,
                        }, session);
                    }
                }
            }

            console.log(`تم تحديث انتماء الموظفين للأقسام (${data.length} موظف)`);
        }

        // تحديث التسلسل الوظيفي
        if (templateId === 'positions') {
            // في الإنتاج: تحديث مستويات المناصب
            console.log(`تم تحديث المناصب الوظيفية (${data.length} منصب)`);
        }
    } catch (error) {
        console.error('خطأ في تحديث الهيكل التنظيمي:', error);
        throw error;
    }
}

// تسجيل النشاط
async function logImportActivity(templateId, categoryId, tenantId, userId, stats) {
    const logEntry = {
        action: 'SYSTEM_SETUP_IMPORT',
        templateId,
        categoryId,
        tenantId,
        userId,
        stats,
        timestamp: new Date(),
    };

    // في الإنتاج: حفظ في جدول سجل النشاطات
    console.log('Import Activity Log:', logEntry);
}

// ==========================================
// تصدير الدوال
// ==========================================

export {
    TEMPLATE_DEFINITIONS,
    getFieldLabel,
};
