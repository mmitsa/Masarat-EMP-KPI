/**
 * ============================================
 * Zod Validation Schemas - مخططات التحقق من المدخلات
 * ============================================
 *
 * استخدم هذه المخططات في API endpoints للتحقق من البيانات
 * جميع رسائل الخطأ بالعربية لتجربة مستخدم أفضل
 */

import { z } from 'zod';

// ==========================================
// رسائل الخطأ بالعربية
// ==========================================
const arabicErrors = {
    required: 'هذا الحقل مطلوب',
    invalidType: 'نوع البيانات غير صحيح',
    tooShort: (min) => `يجب أن يكون على الأقل ${min} أحرف`,
    tooLong: (max) => `يجب أن لا يتجاوز ${max} حرف`,
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    invalidPhone: 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)',
    invalidNationalId: 'رقم الهوية غير صحيح (يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2)',
    invalidDate: 'التاريخ غير صحيح',
    invalidNumber: 'يجب أن يكون رقماً',
    positiveNumber: 'يجب أن يكون رقماً موجباً',
    invalidUUID: 'المعرف غير صحيح',
    invalidIBAN: 'رقم IBAN غير صحيح (يجب أن يبدأ بـ SA يليه 22 رقم)',
    invalidPassword: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وصغير ورقم ورمز خاص',
    invalidTime: 'صيغة الوقت غير صحيحة (HH:MM)',
    futureDateRequired: 'التاريخ يجب أن يكون في المستقبل',
    pastDateRequired: 'التاريخ يجب أن يكون في الماضي',
    endDateAfterStart: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
};

// ==========================================
// الأنماط الأساسية
// ==========================================

// رقم الهوية السعودية (10 أرقام تبدأ بـ 1 أو 2)
export const nationalIdSchema = z.string()
    .regex(/^[12]\d{9}$/, arabicErrors.invalidNationalId);

// البريد الإلكتروني
export const emailSchema = z.string()
    .email(arabicErrors.invalidEmail)
    .max(255, arabicErrors.tooLong(255));

// رقم الهاتف السعودي (يجب أن يبدأ بـ 05)
export const phoneSchema = z.string()
    .regex(/^(05|5)\d{8}$/, arabicErrors.invalidPhone)
    .transform(val => val.startsWith('5') ? '0' + val : val);

// رقم IBAN السعودي
export const ibanSchema = z.string()
    .regex(/^SA\d{22}$/, arabicErrors.invalidIBAN)
    .optional()
    .nullable();

// الوقت (HH:MM أو HH:MM:SS)
export const timeSchema = z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, arabicErrors.invalidTime);

// كلمة المرور القوية
export const strongPasswordSchema = z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل')
    .regex(/[@$!%*?&#]/, 'يجب أن تحتوي على رمز خاص واحد على الأقل (@$!%*?&#)');

// المبالغ المالية
export const moneySchema = z.coerce.number()
    .min(0, 'المبلغ لا يمكن أن يكون سالباً')
    .max(999999999, 'المبلغ كبير جداً');

// الاسم بالعربية فقط
export const arabicNameSchema = z.string()
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم طويل جداً')
    .regex(/^[\u0600-\u06FF\s]+$/, 'الاسم يجب أن يكون بالعربية فقط');

// التاريخ
export const dateSchema = z.string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

// UUID
export const uuidSchema = z.string().uuid(arabicErrors.invalidUUID);

// Pagination
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// مخططات الموظفين (HR)
// ==========================================

export const employeeCreateSchema = z.object({
    nationalId: nationalIdSchema,
    nameAr: z.string().min(2, arabicErrors.tooShort(2)).max(100, arabicErrors.tooLong(100)),
    nameEn: z.string().max(100, arabicErrors.tooLong(100)).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    departmentId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    positionId: z.coerce.number().int().positive(arabicErrors.positiveNumber).optional(),
    hireDate: dateSchema.optional(),
    salary: z.coerce.number().min(0).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

// ==========================================
// مخططات الإجازات (Leaves)
// ==========================================

export const leaveRequestSchema = z.object({
    employeeId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    leaveTypeId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    startDate: dateSchema,
    endDate: dateSchema,
    reason: z.string().max(500, arabicErrors.tooLong(500)).optional(),
    attachments: z.array(z.string()).optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
    path: ['endDate'],
});

export const leaveApprovalSchema = z.object({
    requestId: z.coerce.number().int().positive(),
    status: z.enum(['approved', 'rejected', 'pending']),
    comment: z.string().max(500, arabicErrors.tooLong(500)).optional(),
});

// ==========================================
// مخططات الأقسام (Departments)
// ==========================================

export const departmentCreateSchema = z.object({
    name: z.string().min(2, arabicErrors.tooShort(2)).max(100, arabicErrors.tooLong(100)),
    code: z.string()
        .min(2, 'رمز القسم يجب أن يكون حرفين على الأقل')
        .max(10, 'رمز القسم طويل جداً')
        .regex(/^[A-Z0-9]+$/, 'رمز القسم يجب أن يحتوي على أحرف إنجليزية كبيرة وأرقام فقط'),
    description: z.string().max(500, arabicErrors.tooLong(500)).optional(),
    managerId: z.coerce.number().int().positive().optional().nullable(),
    parentId: z.coerce.number().int().positive().optional().nullable(),
});

export const departmentUpdateSchema = departmentCreateSchema.partial();

// ==========================================
// مخططات الحضور (Attendance)
// ==========================================

export const attendanceStatusEnum = z.enum([
    'present', 'absent', 'late', 'early_leave', 'on_leave', 'holiday',
    'حاضر', 'غائب', 'متأخر', 'انصراف مبكر', 'في إجازة', 'عطلة'
]);

export const attendanceCreateSchema = z.object({
    employee_id: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    date: dateSchema,
    check_in: timeSchema.optional().nullable(),
    check_out: timeSchema.optional().nullable(),
    status: attendanceStatusEnum.optional(),
    is_overtime: z.boolean().optional(),
    overtime_hours: z.coerce.number().min(0).max(24).optional(),
    notes: z.string().max(500, arabicErrors.tooLong(500)).optional().nullable(),
});

export const attendanceCheckOutSchema = z.object({
    employee_id: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    check_out: timeSchema.optional(),
});

// ==========================================
// مخططات المستودعات (Warehouse)
// ==========================================

export const itemCreateSchema = z.object({
    code: z.string().min(1, arabicErrors.required).max(50, arabicErrors.tooLong(50)),
    nameAr: z.string().min(2, arabicErrors.tooShort(2)).max(200, arabicErrors.tooLong(200)),
    nameEn: z.string().max(200, arabicErrors.tooLong(200)).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    unitId: z.coerce.number().int().positive().optional(),
    minQuantity: z.coerce.number().min(0).default(0),
    maxQuantity: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).default(0),
    description: z.string().max(1000, arabicErrors.tooLong(1000)).optional(),
    barcode: z.string().max(50, arabicErrors.tooLong(50)).optional(),
});

export const inventoryMovementSchema = z.object({
    itemId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    warehouseId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
    type: z.enum(['in', 'out', 'transfer', 'adjustment']),
    referenceType: z.string().optional(),
    referenceId: z.coerce.number().int().optional(),
    notes: z.string().max(500, arabicErrors.tooLong(500)).optional(),
});

export const custodyRequestSchema = z.object({
    employeeId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    items: z.array(z.object({
        itemId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().positive(),
    })).min(1, 'يجب إضافة صنف واحد على الأقل'),
    reason: z.string().max(500, arabicErrors.tooLong(500)).optional(),
});

// ==========================================
// مخططات الحركة (Movement/Fleet)
// ==========================================

export const vehicleCreateSchema = z.object({
    plateNumber: z.string().min(1, arabicErrors.required).max(20, arabicErrors.tooLong(20)),
    type: z.string().min(1, arabicErrors.required).max(50, arabicErrors.tooLong(50)),
    make: z.string().max(50, arabicErrors.tooLong(50)).optional(),
    model: z.string().max(50, arabicErrors.tooLong(50)).optional(),
    year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
    status: z.enum(['available', 'in_use', 'maintenance', 'retired']).default('available'),
    driverId: z.coerce.number().int().positive().optional(),
});

export const tripRequestSchema = z.object({
    vehicleId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    driverId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    startLocation: z.string().min(1, arabicErrors.required).max(200, arabicErrors.tooLong(200)),
    endLocation: z.string().min(1, arabicErrors.required).max(200, arabicErrors.tooLong(200)),
    purpose: z.string().max(500, arabicErrors.tooLong(500)).optional(),
    scheduledDate: dateSchema,
    passengers: z.array(z.coerce.number().int().positive()).optional(),
});

// ==========================================
// مخططات المستخدمين (Admin)
// ==========================================

export const userCreateSchema = z.object({
    nationalId: nationalIdSchema,
    name: z.string().min(2, arabicErrors.tooShort(2)).max(100, arabicErrors.tooLong(100)),
    email: emailSchema,
    phone: phoneSchema.optional(),
    roles: z.array(z.string()).min(1, 'يجب تحديد دور واحد على الأقل'),
    departmentId: z.coerce.number().int().positive().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ nationalId: true });

export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, arabicErrors.required),
    newPassword: z.string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
        .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
        .regex(/[0-9]/, 'يجب أن تحتوي على رقم')
        .regex(/[^A-Za-z0-9]/, 'يجب أن تحتوي على رمز خاص'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

// ==========================================
// مخططات الأرشفة (Archiving)
// ==========================================

export const documentCreateSchema = z.object({
    title: z.string().min(1, arabicErrors.required).max(200, arabicErrors.tooLong(200)),
    description: z.string().max(1000, arabicErrors.tooLong(1000)).optional(),
    cabinetId: z.coerce.number().int().positive(arabicErrors.positiveNumber),
    classificationId: z.coerce.number().int().positive().optional(),
    confidentialityLevel: z.enum(['public', 'internal', 'confidential', 'secret']).default('internal'),
    tags: z.array(z.string().max(50)).optional(),
    expiryDate: dateSchema.optional(),
});

// ==========================================
// مخططات المحادثات (Chat)
// ==========================================

export const chatMessageSchema = z.object({
    content: z.string()
        .min(1, arabicErrors.required)
        .max(2000, arabicErrors.tooLong(2000)),
    conversationId: z.string().optional(),
});

// ==========================================
// دوال مساعدة للتحقق
// ==========================================

/**
 * التحقق من البيانات وإرجاع الأخطاء بصيغة موحدة
 * @param {z.ZodSchema} schema - مخطط Zod
 * @param {object} data - البيانات للتحقق منها
 * @returns {{ success: boolean, data?: object, errors?: object[] }}
 */
export function validate(schema, data) {
    const result = schema.safeParse(data);

    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }

    const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
    }));

    return {
        success: false,
        errors,
    };
}

/**
 * Middleware للتحقق من body الطلب
 * @param {z.ZodSchema} schema - مخطط Zod
 * @returns {function} - Middleware function
 */
export function validateBody(schema) {
    return (req, res, next) => {
        const result = validate(schema, req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: 'بيانات غير صالحة',
                code: 'VALIDATION_ERROR',
                validationErrors: result.errors,
            });
        }

        req.validatedBody = result.data;
        return next ? next() : result.data;
    };
}

/**
 * Middleware للتحقق من query parameters
 * @param {z.ZodSchema} schema - مخطط Zod
 * @returns {function} - Middleware function
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = validate(schema, req.query);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: 'معاملات غير صالحة',
                code: 'VALIDATION_ERROR',
                validationErrors: result.errors,
            });
        }

        req.validatedQuery = result.data;
        return next ? next() : result.data;
    };
}

export default {
    // Common Schemas
    nationalIdSchema,
    emailSchema,
    phoneSchema,
    dateSchema,
    uuidSchema,
    ibanSchema,
    timeSchema,
    strongPasswordSchema,
    moneySchema,
    arabicNameSchema,

    // Pagination
    paginationSchema,

    // Employee Schemas
    employeeCreateSchema,
    employeeUpdateSchema,

    // Department Schemas
    departmentCreateSchema,
    departmentUpdateSchema,

    // Leave Schemas
    leaveRequestSchema,
    leaveApprovalSchema,

    // Attendance Schemas
    attendanceStatusEnum,
    attendanceCreateSchema,
    attendanceCheckOutSchema,

    // Warehouse Schemas
    itemCreateSchema,
    inventoryMovementSchema,
    custodyRequestSchema,

    // Movement/Fleet Schemas
    vehicleCreateSchema,
    tripRequestSchema,

    // User/Admin Schemas
    userCreateSchema,
    userUpdateSchema,
    passwordChangeSchema,

    // Archiving Schemas
    documentCreateSchema,

    // Chat Schemas
    chatMessageSchema,

    // Helper Functions
    validate,
    validateBody,
    validateQuery,
};
