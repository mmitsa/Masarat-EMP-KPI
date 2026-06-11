/**
 * Import Table Definitions
 * ═══════════════════════════════════════════════════════
 *
 * تعريف الجداول القابلة للاستيراد مع:
 *   - الاسم العربي والإنجليزي
 *   - أعمدة الجدول مع التسميات العربية
 *   - قواعد التحقق (required, type, min, max, enum)
 *   - الأعمدة المطلوبة والاختيارية
 *   - الأعمدة المستبعدة من الاستيراد (Id, CreatedAt, etc.)
 *
 * يُستخدم من:
 *   - /api/import/table-schema  (لإرسال التعريف للواجهة)
 *   - /api/import/execute       (للتحقق والإدراج)
 */

// ══════════════════════════════════════════════════════
// تعريف الجداول
// ══════════════════════════════════════════════════════

const IMPORT_TABLES = {

  // ─────────────────────────────────────────────────
  // 1. الموظفين
  // ─────────────────────────────────────────────────
  employees: {
    key: 'employees',
    nameAr: 'الموظفين',
    nameEn: 'Employees',
    icon: 'users',
    schema: 'dbo',
    table: 'Employees',
    description: 'بيانات الموظفين الأساسية والمالية',
    uniqueColumns: ['NationalId'],
    columns: [
      { field: 'NationalId',         labelAr: 'رقم الهوية',         labelEn: 'National ID',         type: 'string',  required: true,  maxLength: 10 },
      { field: 'EmployeeNumber',     labelAr: 'الرقم الوظيفي',     labelEn: 'Employee Number',     type: 'string',  required: false, maxLength: 30 },
      { field: 'ArName',             labelAr: 'الاسم بالعربي',     labelEn: 'Arabic Name',         type: 'string',  required: true,  maxLength: 100 },
      { field: 'EnName',             labelAr: 'الاسم بالإنجليزي',  labelEn: 'English Name',        type: 'string',  required: false, maxLength: 100 },
      { field: 'BirthDate',          labelAr: 'تاريخ الميلاد',     labelEn: 'Birth Date',          type: 'date',    required: false },
      { field: 'Gender',             labelAr: 'الجنس',             labelEn: 'Gender',              type: 'int',     required: false, enum: { 0: 'ذكر', 1: 'أنثى' } },
      { field: 'Nationality',        labelAr: 'الجنسية',           labelEn: 'Nationality',         type: 'string',  required: false, maxLength: 50 },
      { field: 'Religion',           labelAr: 'الديانة',           labelEn: 'Religion',            type: 'string',  required: false, maxLength: 10 },
      { field: 'MaritalStatus',      labelAr: 'الحالة الاجتماعية', labelEn: 'Marital Status',      type: 'string',  required: false, maxLength: 10 },
      { field: 'ChildrenCount',      labelAr: 'عدد الأبناء',       labelEn: 'Children Count',      type: 'int',     required: false },
      { field: 'Mobile',             labelAr: 'رقم الجوال',        labelEn: 'Mobile',              type: 'string',  required: false, maxLength: 20 },
      { field: 'Phone',              labelAr: 'رقم الهاتف',        labelEn: 'Phone',               type: 'string',  required: false, maxLength: 20 },
      { field: 'EmailNum',           labelAr: 'البريد الإلكتروني', labelEn: 'Email',               type: 'string',  required: false, maxLength: 100 },
      { field: 'Address',            labelAr: 'العنوان',           labelEn: 'Address',             type: 'string',  required: false, maxLength: 300 },
      { field: 'City',               labelAr: 'المدينة',           labelEn: 'City',                type: 'string',  required: false, maxLength: 50 },
      { field: 'PostalCode',         labelAr: 'الرمز البريدي',     labelEn: 'Postal Code',         type: 'string',  required: false, maxLength: 10 },
      { field: 'DepartmentId',       labelAr: 'رقم القسم',         labelEn: 'Department ID',       type: 'int',     required: false },
      { field: 'JobId',              labelAr: 'رقم الوظيفة',       labelEn: 'Job ID',              type: 'int',     required: false },
      { field: 'Rank',               labelAr: 'المرتبة',           labelEn: 'Rank',                type: 'string',  required: false, maxLength: 50 },
      { field: 'HireDate',           labelAr: 'تاريخ التعيين',     labelEn: 'Hire Date',           type: 'date',    required: false },
      { field: 'EmploymentType',     labelAr: 'نوع التوظيف',       labelEn: 'Employment Type',     type: 'int',     required: false, enum: { 0: 'دائم', 1: 'عقد', 2: 'مؤقت', 3: 'متعاون' } },
      { field: 'BasicSalary',        labelAr: 'الراتب الأساسي',    labelEn: 'Basic Salary',        type: 'decimal', required: false },
      { field: 'HousingAllowance',   labelAr: 'بدل السكن',         labelEn: 'Housing Allowance',   type: 'decimal', required: false },
      { field: 'TransportAllowance', labelAr: 'بدل النقل',         labelEn: 'Transport Allowance', type: 'decimal', required: false },
      { field: 'PhoneAllowance',     labelAr: 'بدل الهاتف',        labelEn: 'Phone Allowance',     type: 'decimal', required: false },
      { field: 'OtherAllowances',    labelAr: 'بدلات أخرى',        labelEn: 'Other Allowances',    type: 'decimal', required: false },
      { field: 'BankName',           labelAr: 'اسم البنك',         labelEn: 'Bank Name',           type: 'string',  required: false, maxLength: 100 },
      { field: 'BankAccountNumber',  labelAr: 'رقم الحساب البنكي', labelEn: 'Bank Account',        type: 'string',  required: false, maxLength: 50 },
      { field: 'GosiNumber',         labelAr: 'رقم التأمينات',     labelEn: 'GOSI Number',         type: 'string',  required: false, maxLength: 50 },
      { field: 'MedicalInsuranceNumber', labelAr: 'رقم التأمين الطبي', labelEn: 'Medical Insurance', type: 'string', required: false, maxLength: 50 },
      { field: 'Education',          labelAr: 'المؤهل العلمي',     labelEn: 'Education',           type: 'int',     required: false, enum: { 0: 'أقل من ثانوي', 1: 'ثانوي', 2: 'دبلوم', 3: 'بكالوريوس', 4: 'ماجستير', 5: 'دكتوراه' } },
      { field: 'Specialization',     labelAr: 'التخصص',            labelEn: 'Specialization',      type: 'string',  required: false, maxLength: 100 },
      { field: 'University',         labelAr: 'الجامعة',           labelEn: 'University',          type: 'string',  required: false, maxLength: 150 },
      { field: 'GraduationYear',     labelAr: 'سنة التخرج',        labelEn: 'Graduation Year',     type: 'int',     required: false },
      { field: 'ContractEndDate',    labelAr: 'نهاية العقد',       labelEn: 'Contract End Date',   type: 'date',    required: false },
      { field: 'EmergencyContact',   labelAr: 'جهة الطوارئ',       labelEn: 'Emergency Contact',   type: 'string',  required: false, maxLength: 100 },
      { field: 'EmergencyPhone',     labelAr: 'هاتف الطوارئ',      labelEn: 'Emergency Phone',     type: 'string',  required: false, maxLength: 20 },
      { field: 'Notes',              labelAr: 'ملاحظات',           labelEn: 'Notes',               type: 'string',  required: false, maxLength: 2000 },
    ],
  },

  // ─────────────────────────────────────────────────
  // 2. الإجازات
  // ─────────────────────────────────────────────────
  leaves: {
    key: 'leaves',
    nameAr: 'الإجازات',
    nameEn: 'Leaves',
    icon: 'calendar',
    schema: 'dbo',
    table: 'Leaves',
    description: 'طلبات الإجازات وقراراتها',
    uniqueColumns: [],
    columns: [
      { field: 'EmployeeId',           labelAr: 'رقم الموظف',         labelEn: 'Employee ID',         type: 'int',    required: true },
      { field: 'Type',                 labelAr: 'نوع الإجازة',        labelEn: 'Leave Type',          type: 'int',    required: true,  enum: { 0: 'عادية', 1: 'مرضية', 2: 'اضطرارية', 3: 'بدون راتب', 4: 'أمومة', 5: 'حج', 6: 'زواج', 7: 'وفاة', 8: 'استثنائية', 9: 'دراسية' } },
      { field: 'StartDate',            labelAr: 'تاريخ البداية',      labelEn: 'Start Date',          type: 'date',   required: true },
      { field: 'EndDate',              labelAr: 'تاريخ النهاية',      labelEn: 'End Date',            type: 'date',   required: true },
      { field: 'TotalDays',            labelAr: 'عدد الأيام',         labelEn: 'Total Days',          type: 'int',    required: true },
      { field: 'Reason',               labelAr: 'السبب',              labelEn: 'Reason',              type: 'string', required: false, maxLength: 500 },
      { field: 'Status',               labelAr: 'الحالة',             labelEn: 'Status',              type: 'int',    required: false, enum: { 0: 'مسودة', 1: 'بانتظار الموافقة', 2: 'معتمدة', 3: 'مرفوضة', 4: 'ملغاة' } },
      { field: 'SubstituteEmployeeId', labelAr: 'رقم البديل',         labelEn: 'Substitute Employee', type: 'int',    required: false },
      { field: 'Notes',                labelAr: 'ملاحظات',            labelEn: 'Notes',               type: 'string', required: false, maxLength: 500 },
    ],
  },

  // ─────────────────────────────────────────────────
  // 3. أرصدة الإجازات
  // ─────────────────────────────────────────────────
  leaveBalances: {
    key: 'leaveBalances',
    nameAr: 'أرصدة الإجازات',
    nameEn: 'Leave Balances',
    icon: 'clipboard-list',
    schema: 'HR',
    table: 'LeaveBalances',
    description: 'أرصدة الإجازات السنوية لكل موظف',
    uniqueColumns: ['EmployeeId', 'Year', 'LeaveType'],
    columns: [
      { field: 'EmployeeId',       labelAr: 'رقم الموظف',          labelEn: 'Employee ID',          type: 'int',     required: true },
      { field: 'Year',             labelAr: 'السنة',               labelEn: 'Year',                 type: 'int',     required: true },
      { field: 'LeaveType',        labelAr: 'نوع الإجازة',         labelEn: 'Leave Type',           type: 'int',     required: true },
      { field: 'AnnualEntitlement', labelAr: 'الاستحقاق السنوي',   labelEn: 'Annual Entitlement',   type: 'int',     required: false },
      { field: 'CarryForward',     labelAr: 'المرحّل',             labelEn: 'Carry Forward',        type: 'int',     required: false },
      { field: 'TotalBalance',     labelAr: 'الرصيد الإجمالي',     labelEn: 'Total Balance',        type: 'int',     required: false },
      { field: 'UsedBalance',      labelAr: 'المستخدم',            labelEn: 'Used Balance',         type: 'int',     required: false },
      { field: 'PendingBalance',   labelAr: 'المعلّق',             labelEn: 'Pending Balance',      type: 'int',     required: false },
      { field: 'RemainingBalance', labelAr: 'المتبقي',             labelEn: 'Remaining Balance',    type: 'int',     required: false },
    ],
  },

  // ─────────────────────────────────────────────────
  // 4. الحضور والانصراف
  // ─────────────────────────────────────────────────
  attendances: {
    key: 'attendances',
    nameAr: 'الحضور والانصراف',
    nameEn: 'Attendances',
    icon: 'clock',
    schema: 'dbo',
    table: 'Attendances',
    description: 'سجلات الحضور والانصراف اليومية',
    uniqueColumns: ['EmployeeId', 'Date'],
    columns: [
      { field: 'EmployeeId',       labelAr: 'رقم الموظف',          labelEn: 'Employee ID',      type: 'int',    required: true },
      { field: 'Date',             labelAr: 'التاريخ',             labelEn: 'Date',             type: 'date',   required: true },
      { field: 'CheckInTime',      labelAr: 'وقت الحضور',         labelEn: 'Check-In Time',    type: 'time',   required: false },
      { field: 'CheckOutTime',     labelAr: 'وقت الانصراف',       labelEn: 'Check-Out Time',   type: 'time',   required: false },
      { field: 'Status',           labelAr: 'الحالة',             labelEn: 'Status',           type: 'int',    required: false, enum: { 0: 'حاضر', 1: 'غائب', 2: 'إجازة', 3: 'مهمة عمل', 4: 'تأخر' } },
      { field: 'LateMinutes',      labelAr: 'دقائق التأخير',      labelEn: 'Late Minutes',     type: 'int',    required: false },
      { field: 'EarlyLeaveMinutes', labelAr: 'دقائق الخروج المبكر', labelEn: 'Early Leave Min', type: 'int',    required: false },
      { field: 'OvertimeHours',    labelAr: 'ساعات إضافية',       labelEn: 'Overtime Hours',   type: 'decimal', required: false },
      { field: 'Notes',            labelAr: 'ملاحظات',            labelEn: 'Notes',            type: 'string', required: false, maxLength: 500 },
      { field: 'Source',           labelAr: 'المصدر',             labelEn: 'Source',           type: 'int',    required: false, enum: { 0: 'يدوي', 1: 'بصمة', 2: 'تطبيق', 3: 'ملف مستورد' } },
    ],
  },

  // ─────────────────────────────────────────────────
  // 5. العمل الإضافي (خارج الدوام)
  // ─────────────────────────────────────────────────
  overtimeRecords: {
    key: 'overtimeRecords',
    nameAr: 'العمل الإضافي',
    nameEn: 'Overtime Records',
    icon: 'clock',
    schema: 'dbo',
    table: 'OvertimeRecords',
    description: 'سجلات العمل الإضافي خارج الدوام',
    uniqueColumns: [],
    columns: [
      { field: 'EmployeeId',     labelAr: 'رقم الموظف',       labelEn: 'Employee ID',     type: 'int',     required: true },
      { field: 'Date',           labelAr: 'التاريخ',          labelEn: 'Date',            type: 'date',    required: true },
      { field: 'Hours',          labelAr: 'عدد الساعات',      labelEn: 'Hours',           type: 'decimal', required: true },
      { field: 'Type',           labelAr: 'النوع',            labelEn: 'Type',            type: 'int',     required: false, enum: { 0: 'عادي', 1: 'عطلة', 2: 'إجازة رسمية' } },
      { field: 'Rate',           labelAr: 'معدل الاحتساب',    labelEn: 'Rate',            type: 'decimal', required: false },
      { field: 'Amount',         labelAr: 'المبلغ',           labelEn: 'Amount',          type: 'decimal', required: false },
      { field: 'Reason',         labelAr: 'السبب',            labelEn: 'Reason',          type: 'string',  required: false, maxLength: 500 },
      { field: 'Status',         labelAr: 'الحالة',           labelEn: 'Status',          type: 'int',     required: false, enum: { 0: 'مسودة', 1: 'معتمد', 2: 'مرفوض' } },
      { field: 'ApprovedById',   labelAr: 'معتمد بواسطة',     labelEn: 'Approved By',     type: 'int',     required: false },
      { field: 'Notes',          labelAr: 'ملاحظات',          labelEn: 'Notes',           type: 'string',  required: false, maxLength: 500 },
    ],
  },

  // ─────────────────────────────────────────────────
  // 6. كشوف الرواتب
  // ─────────────────────────────────────────────────
  payslips: {
    key: 'payslips',
    nameAr: 'كشوف الرواتب',
    nameEn: 'Payslips',
    icon: 'banknotes',
    schema: 'HR',
    table: 'Payslips',
    description: 'كشوف الرواتب الشهرية للموظفين',
    uniqueColumns: ['EmployeeId', 'Month', 'Year'],
    columns: [
      { field: 'EmployeeId',        labelAr: 'رقم الموظف',       labelEn: 'Employee ID',       type: 'int',     required: true },
      { field: 'Month',             labelAr: 'الشهر',            labelEn: 'Month',             type: 'int',     required: true },
      { field: 'Year',              labelAr: 'السنة',            labelEn: 'Year',              type: 'int',     required: true },
      { field: 'BasicSalary',       labelAr: 'الراتب الأساسي',   labelEn: 'Basic Salary',      type: 'decimal', required: false },
      { field: 'HousingAllowance',  labelAr: 'بدل السكن',        labelEn: 'Housing Allowance', type: 'decimal', required: false },
      { field: 'TransportAllowance', labelAr: 'بدل النقل',       labelEn: 'Transport Allow.',  type: 'decimal', required: false },
      { field: 'OtherAllowances',   labelAr: 'بدلات أخرى',       labelEn: 'Other Allowances',  type: 'decimal', required: false },
      { field: 'TotalEarnings',     labelAr: 'إجمالي المستحقات', labelEn: 'Total Earnings',    type: 'decimal', required: false },
      { field: 'GosiDeduction',     labelAr: 'خصم التأمينات',    labelEn: 'GOSI Deduction',    type: 'decimal', required: false },
      { field: 'TotalDeductions',   labelAr: 'إجمالي الخصومات',  labelEn: 'Total Deductions',  type: 'decimal', required: false },
      { field: 'NetSalary',         labelAr: 'صافي الراتب',      labelEn: 'Net Salary',        type: 'decimal', required: false },
      { field: 'Status',            labelAr: 'الحالة',           labelEn: 'Status',            type: 'int',     required: false, enum: { 0: 'مسودة', 1: 'محسوب', 2: 'معتمد', 3: 'مصروف' } },
    ],
  },

  // ─────────────────────────────────────────────────
  // 7. الأقسام
  // ─────────────────────────────────────────────────
  departments: {
    key: 'departments',
    nameAr: 'الأقسام',
    nameEn: 'Departments',
    icon: 'building-office',
    schema: 'dbo',
    table: 'Departments',
    description: 'الهيكل التنظيمي والأقسام الإدارية',
    uniqueColumns: ['Code'],
    columns: [
      { field: 'NameAr',     labelAr: 'اسم القسم (عربي)',    labelEn: 'Name (Arabic)',   type: 'string', required: true,  maxLength: 100 },
      { field: 'NameEn',     labelAr: 'اسم القسم (إنجليزي)', labelEn: 'Name (English)',  type: 'string', required: false, maxLength: 100 },
      { field: 'Code',       labelAr: 'رمز القسم',           labelEn: 'Code',            type: 'string', required: false, maxLength: 20 },
      { field: 'ParentId',   labelAr: 'القسم الأب',          labelEn: 'Parent Dept ID',  type: 'int',    required: false },
      { field: 'ManagerId',  labelAr: 'رقم المدير',          labelEn: 'Manager ID',      type: 'int',    required: false },
      { field: 'IsActive',   labelAr: 'نشط',                labelEn: 'Is Active',       type: 'bit',    required: false },
    ],
  },

  // ─────────────────────────────────────────────────
  // 8. الوظائف
  // ─────────────────────────────────────────────────
  jobs: {
    key: 'jobs',
    nameAr: 'المسميات الوظيفية',
    nameEn: 'Jobs',
    icon: 'briefcase',
    schema: 'dbo',
    table: 'Jobs',
    description: 'المسميات والوظائف المتاحة',
    uniqueColumns: ['Code'],
    columns: [
      { field: 'NameAr',       labelAr: 'اسم الوظيفة (عربي)',    labelEn: 'Name (Arabic)',   type: 'string',  required: true,  maxLength: 200 },
      { field: 'NameEn',       labelAr: 'اسم الوظيفة (إنجليزي)', labelEn: 'Name (English)',  type: 'string',  required: false, maxLength: 200 },
      { field: 'Code',         labelAr: 'رمز الوظيفة',           labelEn: 'Code',            type: 'string',  required: false, maxLength: 50 },
      { field: 'Grade',        labelAr: 'المرتبة',               labelEn: 'Grade',           type: 'string',  required: false, maxLength: 20 },
      { field: 'MinSalary',    labelAr: 'الحد الأدنى للراتب',    labelEn: 'Min Salary',      type: 'decimal', required: false },
      { field: 'MaxSalary',    labelAr: 'الحد الأعلى للراتب',    labelEn: 'Max Salary',      type: 'decimal', required: false },
      { field: 'CadreId',      labelAr: 'رقم الكادر',            labelEn: 'Cadre ID',        type: 'int',     required: false },
      { field: 'SalaryScaleId', labelAr: 'رقم سلم الرواتب',      labelEn: 'Salary Scale ID', type: 'int',     required: false },
      { field: 'IsActive',     labelAr: 'نشط',                  labelEn: 'Is Active',       type: 'bit',     required: false },
    ],
  },

  // ─────────────────────────────────────────────────
  // 9. الخصومات
  // ─────────────────────────────────────────────────
  deductions: {
    key: 'deductions',
    nameAr: 'الخصومات',
    nameEn: 'Deductions',
    icon: 'minus-circle',
    schema: 'dbo',
    table: 'Deductions',
    description: 'خصومات الموظفين (تأخير، غياب، سلف...)',
    uniqueColumns: [],
    columns: [
      { field: 'EmployeeId',      labelAr: 'رقم الموظف',       labelEn: 'Employee ID',     type: 'int',     required: true },
      { field: 'DeductionTypeId', labelAr: 'نوع الخصم',        labelEn: 'Deduction Type',  type: 'int',     required: true },
      { field: 'Amount',          labelAr: 'المبلغ',           labelEn: 'Amount',          type: 'decimal', required: true },
      { field: 'Percentage',      labelAr: 'النسبة',           labelEn: 'Percentage',      type: 'decimal', required: false },
      { field: 'EffectiveDate',   labelAr: 'تاريخ السريان',    labelEn: 'Effective Date',  type: 'date',    required: true },
      { field: 'EndDate',         labelAr: 'تاريخ الانتهاء',   labelEn: 'End Date',        type: 'date',    required: false },
      { field: 'Reason',          labelAr: 'السبب',            labelEn: 'Reason',          type: 'string',  required: false, maxLength: 500 },
      { field: 'IsRecurring',     labelAr: 'متكرر',            labelEn: 'Is Recurring',    type: 'bit',     required: false },
      { field: 'IsActive',        labelAr: 'نشط',              labelEn: 'Is Active',       type: 'bit',     required: false },
    ],
  },

  // ─────────────────────────────────────────────────
  // 10. الترقيات
  // ─────────────────────────────────────────────────
  promotions: {
    key: 'promotions',
    nameAr: 'الترقيات',
    nameEn: 'Promotions',
    icon: 'arrow-trending-up',
    schema: 'HR',
    table: 'Promotions',
    description: 'قرارات الترقية الوظيفية',
    uniqueColumns: [],
    columns: [
      { field: 'EmployeeId',      labelAr: 'رقم الموظف',        labelEn: 'Employee ID',       type: 'int',     required: true },
      { field: 'FromJobId',       labelAr: 'الوظيفة السابقة',   labelEn: 'From Job ID',       type: 'int',     required: false },
      { field: 'ToJobId',         labelAr: 'الوظيفة الجديدة',   labelEn: 'To Job ID',         type: 'int',     required: false },
      { field: 'FromRank',        labelAr: 'المرتبة السابقة',   labelEn: 'From Rank',         type: 'string',  required: false, maxLength: 50 },
      { field: 'ToRank',          labelAr: 'المرتبة الجديدة',   labelEn: 'To Rank',           type: 'string',  required: false, maxLength: 50 },
      { field: 'FromSalary',      labelAr: 'الراتب السابق',     labelEn: 'From Salary',       type: 'decimal', required: false },
      { field: 'ToSalary',        labelAr: 'الراتب الجديد',     labelEn: 'To Salary',         type: 'decimal', required: false },
      { field: 'PromotionDate',   labelAr: 'تاريخ الترقية',     labelEn: 'Promotion Date',    type: 'date',    required: true },
      { field: 'EffectiveDate',   labelAr: 'تاريخ السريان',     labelEn: 'Effective Date',    type: 'date',    required: false },
      { field: 'DecisionNumber',  labelAr: 'رقم القرار',        labelEn: 'Decision Number',   type: 'string',  required: false, maxLength: 50 },
      { field: 'Reason',          labelAr: 'السبب',             labelEn: 'Reason',            type: 'string',  required: false, maxLength: 500 },
      { field: 'Status',          labelAr: 'الحالة',            labelEn: 'Status',            type: 'int',     required: false, enum: { 0: 'مسودة', 1: 'معتمدة', 2: 'ملغاة' } },
    ],
  },

  // ─────────────────────────────────────────────────
  // 11. تغييرات الرواتب
  // ─────────────────────────────────────────────────
  salaryChanges: {
    key: 'salaryChanges',
    nameAr: 'تغييرات الرواتب',
    nameEn: 'Salary Changes',
    icon: 'currency-dollar',
    schema: 'HR',
    table: 'SalaryChanges',
    description: 'قرارات تعديل الرواتب والعلاوات',
    uniqueColumns: [],
    columns: [
      { field: 'EmployeeId',          labelAr: 'رقم الموظف',             labelEn: 'Employee ID',         type: 'int',     required: true },
      { field: 'ChangeType',          labelAr: 'نوع التغيير',           labelEn: 'Change Type',         type: 'int',     required: true, enum: { 0: 'علاوة', 1: 'تعديل', 2: 'ترقية', 3: 'تخفيض' } },
      { field: 'OldBasicSalary',      labelAr: 'الراتب الأساسي القديم', labelEn: 'Old Basic Salary',    type: 'decimal', required: false },
      { field: 'NewBasicSalary',      labelAr: 'الراتب الأساسي الجديد', labelEn: 'New Basic Salary',    type: 'decimal', required: true },
      { field: 'OldHousingAllowance', labelAr: 'بدل السكن القديم',      labelEn: 'Old Housing Allow.',  type: 'decimal', required: false },
      { field: 'NewHousingAllowance', labelAr: 'بدل السكن الجديد',      labelEn: 'New Housing Allow.',  type: 'decimal', required: false },
      { field: 'EffectiveDate',       labelAr: 'تاريخ السريان',         labelEn: 'Effective Date',      type: 'date',    required: true },
      { field: 'DecisionNumber',      labelAr: 'رقم القرار',            labelEn: 'Decision Number',     type: 'string',  required: false, maxLength: 50 },
      { field: 'Reason',              labelAr: 'السبب',                 labelEn: 'Reason',              type: 'string',  required: false, maxLength: 500 },
    ],
  },

  // ─────────────────────────────────────────────────
  // 12. الدورات التدريبية
  // ─────────────────────────────────────────────────
  trainingCourses: {
    key: 'trainingCourses',
    nameAr: 'الدورات التدريبية',
    nameEn: 'Training Courses',
    icon: 'academic-cap',
    schema: 'HR',
    table: 'TrainingCourses',
    description: 'الدورات التدريبية المتاحة',
    uniqueColumns: [],
    columns: [
      { field: 'TitleAr',          labelAr: 'اسم الدورة (عربي)',    labelEn: 'Title (Arabic)',     type: 'string',  required: true,  maxLength: 200 },
      { field: 'TitleEn',          labelAr: 'اسم الدورة (إنجليزي)', labelEn: 'Title (English)',    type: 'string',  required: false, maxLength: 200 },
      { field: 'Provider',         labelAr: 'الجهة المقدمة',        labelEn: 'Provider',           type: 'string',  required: false, maxLength: 200 },
      { field: 'Duration',         labelAr: 'المدة (ساعات)',        labelEn: 'Duration (hours)',   type: 'int',     required: false },
      { field: 'StartDate',        labelAr: 'تاريخ البداية',        labelEn: 'Start Date',         type: 'date',    required: false },
      { field: 'EndDate',          labelAr: 'تاريخ النهاية',        labelEn: 'End Date',           type: 'date',    required: false },
      { field: 'Type',             labelAr: 'النوع',               labelEn: 'Type',               type: 'int',     required: false, enum: { 0: 'داخلية', 1: 'خارجية', 2: 'إلكترونية' } },
      { field: 'MaxParticipants',  labelAr: 'الحد الأقصى للمشاركين', labelEn: 'Max Participants',  type: 'int',     required: false },
      { field: 'Location',         labelAr: 'المكان',              labelEn: 'Location',           type: 'string',  required: false, maxLength: 200 },
    ],
  },

  // ─────────────────────────────────────────────────
  // 13. تسجيل التدريب
  // ─────────────────────────────────────────────────
  trainingEnrollments: {
    key: 'trainingEnrollments',
    nameAr: 'تسجيل التدريب',
    nameEn: 'Training Enrollments',
    icon: 'user-plus',
    schema: 'HR',
    table: 'TrainingEnrollments',
    description: 'تسجيل الموظفين في الدورات التدريبية',
    uniqueColumns: ['CourseId', 'EmployeeId'],
    columns: [
      { field: 'CourseId',        labelAr: 'رقم الدورة',        labelEn: 'Course ID',       type: 'int',    required: true },
      { field: 'EmployeeId',     labelAr: 'رقم الموظف',        labelEn: 'Employee ID',     type: 'int',    required: true },
      { field: 'Status',         labelAr: 'الحالة',            labelEn: 'Status',          type: 'int',    required: false, enum: { 0: 'مسجل', 1: 'حاضر', 2: 'مكتمل', 3: 'ملغى' } },
      { field: 'Progress',       labelAr: 'نسبة الإنجاز',      labelEn: 'Progress %',      type: 'int',    required: false },
      { field: 'CompletionDate', labelAr: 'تاريخ الإكمال',     labelEn: 'Completion Date', type: 'date',   required: false },
    ],
  },

  // ─────────────────────────────────────────────────
  // 14. مواقع العمل
  // ─────────────────────────────────────────────────
  workLocations: {
    key: 'workLocations',
    nameAr: 'مواقع العمل',
    nameEn: 'Work Locations',
    icon: 'map-pin',
    schema: 'HR',
    table: 'WorkLocations',
    description: 'مواقع العمل والنطاق الجغرافي',
    uniqueColumns: [],
    columns: [
      { field: 'NameAr',         labelAr: 'اسم الموقع (عربي)',    labelEn: 'Name (Arabic)',   type: 'string',  required: true,  maxLength: 200 },
      { field: 'NameEn',         labelAr: 'اسم الموقع (إنجليزي)', labelEn: 'Name (English)',  type: 'string',  required: false, maxLength: 200 },
      { field: 'Latitude',       labelAr: 'خط العرض',            labelEn: 'Latitude',        type: 'decimal', required: false },
      { field: 'Longitude',      labelAr: 'خط الطول',            labelEn: 'Longitude',       type: 'decimal', required: false },
      { field: 'RadiusMeters',   labelAr: 'نطاق (متر)',          labelEn: 'Radius (meters)', type: 'int',     required: false },
      { field: 'Address',        labelAr: 'العنوان',             labelEn: 'Address',         type: 'string',  required: false, maxLength: 500 },
      { field: 'LocationType',   labelAr: 'نوع الموقع',          labelEn: 'Location Type',   type: 'int',     required: false },
      { field: 'DepartmentId',   labelAr: 'رقم القسم',           labelEn: 'Department ID',   type: 'int',     required: false },
      { field: 'IsDefault',      labelAr: 'افتراضي',             labelEn: 'Is Default',      type: 'bit',     required: false },
      { field: 'IsActive',       labelAr: 'نشط',                labelEn: 'Is Active',       type: 'bit',     required: false },
    ],
  },

  // ─────────────────────────────────────────────────
  // 15. التقييم الوظيفي
  // ─────────────────────────────────────────────────
  performanceReviews: {
    key: 'performanceReviews',
    nameAr: 'التقييم الوظيفي',
    nameEn: 'Performance Reviews',
    icon: 'star',
    schema: 'HR',
    table: 'PerformanceReviews',
    description: 'تقييم الأداء الوظيفي السنوي',
    uniqueColumns: ['EmployeeId', 'Year', 'Period'],
    columns: [
      { field: 'EmployeeId',          labelAr: 'رقم الموظف',       labelEn: 'Employee ID',       type: 'int',     required: true },
      { field: 'ReviewerId',          labelAr: 'رقم المُقيّم',     labelEn: 'Reviewer ID',       type: 'int',     required: false },
      { field: 'Year',                labelAr: 'السنة',            labelEn: 'Year',              type: 'int',     required: true },
      { field: 'Period',              labelAr: 'الفترة',           labelEn: 'Period',            type: 'int',     required: false, enum: { 1: 'الأول', 2: 'الثاني', 3: 'سنوي' } },
      { field: 'OverallRating',       labelAr: 'التقييم العام',    labelEn: 'Overall Rating',    type: 'decimal', required: false },
      { field: 'WorkQualityRating',   labelAr: 'جودة العمل',       labelEn: 'Work Quality',      type: 'decimal', required: false },
      { field: 'ProductivityRating',  labelAr: 'الإنتاجية',        labelEn: 'Productivity',      type: 'decimal', required: false },
      { field: 'InitiativeRating',    labelAr: 'المبادرة',         labelEn: 'Initiative',        type: 'decimal', required: false },
      { field: 'TeamworkRating',      labelAr: 'العمل الجماعي',    labelEn: 'Teamwork',          type: 'decimal', required: false },
      { field: 'AttendanceRating',    labelAr: 'الانضباط',         labelEn: 'Attendance',        type: 'decimal', required: false },
      { field: 'Type',                labelAr: 'النوع',            labelEn: 'Type',              type: 'int',     required: false, enum: { 0: 'دوري', 1: 'سنوي', 2: 'ترقية' } },
    ],
  },

  // ─────────────────────────────────────────────────
  // 16. نقل الموظفين
  // ─────────────────────────────────────────────────
  employeeTransfers: {
    key: 'employeeTransfers',
    nameAr: 'نقل الموظفين',
    nameEn: 'Employee Transfers',
    icon: 'arrows-right-left',
    schema: 'dbo',
    table: 'EmployeeTransfers',
    description: 'قرارات نقل الموظفين بين الأقسام',
    uniqueColumns: [],
    columns: [
      { field: 'EmployeeId',       labelAr: 'رقم الموظف',       labelEn: 'Employee ID',       type: 'int',    required: true },
      { field: 'FromDepartmentId', labelAr: 'القسم السابق',     labelEn: 'From Department',   type: 'int',    required: true },
      { field: 'ToDepartmentId',   labelAr: 'القسم الجديد',     labelEn: 'To Department',     type: 'int',    required: true },
      { field: 'TransferDate',     labelAr: 'تاريخ النقل',      labelEn: 'Transfer Date',     type: 'date',   required: true },
      { field: 'Reason',           labelAr: 'السبب',            labelEn: 'Reason',            type: 'string', required: true, maxLength: 500 },
      { field: 'Status',           labelAr: 'الحالة',           labelEn: 'Status',            type: 'int',    required: false, enum: { 0: 'معلق', 1: 'معتمد', 2: 'مرفوض' } },
    ],
  },

  // ─────────────────────────────────────────────────
  // 17. الإجازات الرسمية
  // ─────────────────────────────────────────────────
  officialHolidays: {
    key: 'officialHolidays',
    nameAr: 'الإجازات الرسمية',
    nameEn: 'Official Holidays',
    icon: 'flag',
    schema: 'HR',
    table: 'OfficialHolidays',
    description: 'الإجازات والعطل الرسمية',
    uniqueColumns: [],
    columns: [
      { field: 'NameAr',            labelAr: 'الاسم (عربي)',      labelEn: 'Name (Arabic)',    type: 'string', required: true,  maxLength: 200 },
      { field: 'NameEn',            labelAr: 'الاسم (إنجليزي)',   labelEn: 'Name (English)',   type: 'string', required: false, maxLength: 200 },
      { field: 'HolidayType',       labelAr: 'النوع',             labelEn: 'Holiday Type',     type: 'int',    required: false },
      { field: 'StartDate',         labelAr: 'تاريخ البداية',     labelEn: 'Start Date',       type: 'date',   required: true },
      { field: 'EndDate',           labelAr: 'تاريخ النهاية',     labelEn: 'End Date',         type: 'date',   required: true },
      { field: 'TotalDays',         labelAr: 'عدد الأيام',        labelEn: 'Total Days',       type: 'int',    required: false },
      { field: 'IsRecurring',       labelAr: 'متكرر سنوياً',     labelEn: 'Is Recurring',     type: 'bit',    required: false },
      { field: 'IsPaid',            labelAr: 'مدفوعة',            labelEn: 'Is Paid',          type: 'bit',    required: false },
      { field: 'AffectsAttendance', labelAr: 'يؤثر على الحضور',   labelEn: 'Affects Attendance', type: 'bit',  required: false },
    ],
  },
};

// ══════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════

/**
 * الحصول على قائمة الجداول المتاحة للاستيراد (بدون تفاصيل الأعمدة)
 */
export function getImportTableList() {
  return Object.values(IMPORT_TABLES).map(t => ({
    key: t.key,
    nameAr: t.nameAr,
    nameEn: t.nameEn,
    icon: t.icon,
    description: t.description,
    columnCount: t.columns.length,
    requiredCount: t.columns.filter(c => c.required).length,
  }));
}

/**
 * الحصول على تعريف جدول محدد بكامل تفاصيله
 */
export function getImportTableDef(tableKey) {
  return IMPORT_TABLES[tableKey] || null;
}

/**
 * الحصول على أعمدة جدول محدد
 */
export function getTableColumns(tableKey) {
  const table = IMPORT_TABLES[tableKey];
  if (!table) return [];
  return table.columns;
}

/**
 * الحصول على جميع التعريفات
 */
export function getAllImportTables() {
  return IMPORT_TABLES;
}

export default IMPORT_TABLES;
