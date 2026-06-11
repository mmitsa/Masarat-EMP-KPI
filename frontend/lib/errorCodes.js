/**
 * نظام ترميز الأخطاء المركزي لمنصة مسارات
 * Masarat Platform Error Codes System
 * 
 * هذا الملف يحتوي على جميع أكواد الأخطاء المستخدمة في المنصة
 * مع وصف تفصيلي لكل خطأ وحلوله المقترحة
 */

// تنسيق كود الخطأ: [نوع النظام][رقم الوحدة][رقم الخطأ]
// Format: [SYSTEM_TYPE][MODULE_NUMBER][ERROR_NUMBER]
// مثال: AUTH-001-001 = Authentication System, Module 1, Error 1

export const ERROR_CATEGORIES = {
    // أخطاء المصادقة والتفويض
    AUTH: {
        code: 'AUTH',
        name_ar: 'المصادقة والتفويض',
        name_en: 'Authentication & Authorization',
        color: '#DC2626' // red-600
    },
    
    // أخطاء واجهة برمجة التطبيقات
    API: {
        code: 'API',
        name_ar: 'واجهة برمجة التطبيقات',
        name_en: 'API',
        color: '#EA580C' // orange-600
    },
    
    // أخطاء قاعدة البيانات
    DB: {
        code: 'DB',
        name_ar: 'قاعدة البيانات',
        name_en: 'Database',
        color: '#D97706' // amber-600
    },
    
    // أخطاء التحقق من البيانات
    VALIDATION: {
        code: 'VAL',
        name_ar: 'التحقق من البيانات',
        name_en: 'Validation',
        color: '#CA8A04' // yellow-600
    },
    
    // أخطاء الشبكة
    NETWORK: {
        code: 'NET',
        name_ar: 'الشبكة',
        name_en: 'Network',
        color: '#65A30D' // lime-600
    },
    
    // أخطاء المكونات
    COMPONENT: {
        code: 'CMP',
        name_ar: 'المكونات',
        name_en: 'Component',
        color: '#16A34A' // green-600
    },
    
    // أخطاء الموارد البشرية
    HR: {
        code: 'HR',
        name_ar: 'الموارد البشرية',
        name_en: 'Human Resources',
        color: '#0891B2' // cyan-600
    },
    
    // أخطاء المستودعات
    WAREHOUSE: {
        code: 'WH',
        name_ar: 'المستودعات',
        name_en: 'Warehouse',
        color: '#0284C7' // sky-600
    },
    
    // أخطاء الحركة
    MOVEMENT: {
        code: 'MOV',
        name_ar: 'الحركة',
        name_en: 'Movement',
        color: '#2563EB' // blue-600
    },
    
    // أخطاء الأرشفة
    ARCHIVING: {
        code: 'ARC',
        name_ar: 'الأرشفة',
        name_en: 'Archiving',
        color: '#7C3AED' // violet-600
    },
    
    // أخطاء EPM
    EPM: {
        code: 'EPM',
        name_ar: 'إدارة أداء الموظفين',
        name_en: 'Employee Performance',
        color: '#9333EA' // purple-600
    },
    
    // أخطاء النظام العامة
    SYSTEM: {
        code: 'SYS',
        name_ar: 'النظام',
        name_en: 'System',
        color: '#DC2626' // red-600
    }
};

// تعريف جميع أكواد الأخطاء
export const ERROR_CODES = {
    
    // ============================================
    // أخطاء المصادقة والتفويض (AUTH)
    // ============================================
    
    'AUTH-001-001': {
        code: 'AUTH-001-001',
        category: 'AUTH',
        severity: 'high',
        title_ar: 'فشل تسجيل الدخول',
        title_en: 'Login Failed',
        message_ar: 'بيانات الدخول غير صحيحة',
        message_en: 'Invalid credentials',
        description_ar: 'اسم المستخدم أو كلمة المرور غير صحيحة',
        description_en: 'Username or password is incorrect',
        solution_ar: 'تحقق من اسم المستخدم وكلمة المرور وحاول مرة أخرى',
        solution_en: 'Verify your username and password and try again',
        technical_details: 'Authentication failed - credentials mismatch'
    },
    
    'AUTH-001-002': {
        code: 'AUTH-001-002',
        category: 'AUTH',
        severity: 'high',
        title_ar: 'انتهت صلاحية الجلسة',
        title_en: 'Session Expired',
        message_ar: 'انتهت صلاحية جلستك',
        message_en: 'Your session has expired',
        description_ar: 'انتهت صلاحية جلسة المستخدم بسبب عدم النشاط',
        description_en: 'User session expired due to inactivity',
        solution_ar: 'الرجاء تسجيل الدخول مرة أخرى',
        solution_en: 'Please log in again',
        technical_details: 'JWT token expired or invalid'
    },
    
    'AUTH-002-001': {
        code: 'AUTH-002-001',
        category: 'AUTH',
        severity: 'medium',
        title_ar: 'غير مصرح',
        title_en: 'Unauthorized',
        message_ar: 'ليس لديك صلاحية للوصول',
        message_en: 'You are not authorized to access this resource',
        description_ar: 'المستخدم ليس لديه الصلاحيات المطلوبة',
        description_en: 'User does not have required permissions',
        solution_ar: 'اتصل بالمسؤول للحصول على الصلاحيات المطلوبة',
        solution_en: 'Contact administrator for required permissions',
        technical_details: 'Permission check failed - user lacks required role/permission'
    },
    
    'AUTH-003-001': {
        code: 'AUTH-003-001',
        category: 'AUTH',
        severity: 'high',
        title_ar: 'رمز التحقق غير صحيح',
        title_en: 'Invalid Verification Token',
        message_ar: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
        message_en: 'Verification token is invalid or expired',
        description_ar: 'رمز التحقق المرسل غير صحيح',
        description_en: 'The verification token provided is invalid',
        solution_ar: 'طلب رمز تحقق جديد',
        solution_en: 'Request a new verification token',
        technical_details: 'Token validation failed'
    },
    
    // ============================================
    // أخطاء واجهة برمجة التطبيقات (API)
    // ============================================
    
    'API-001-001': {
        code: 'API-001-001',
        category: 'API',
        severity: 'high',
        title_ar: 'خطأ في الاتصال بالخادم',
        title_en: 'Server Connection Error',
        message_ar: 'فشل الاتصال بالخادم',
        message_en: 'Failed to connect to server',
        description_ar: 'تعذر الاتصال بالخادم',
        description_en: 'Unable to establish connection with the server',
        solution_ar: 'تحقق من اتصال الإنترنت وحاول مرة أخرى',
        solution_en: 'Check your internet connection and try again',
        technical_details: 'Network request failed - server unreachable'
    },
    
    'API-001-002': {
        code: 'API-001-002',
        category: 'API',
        severity: 'medium',
        title_ar: 'انتهى وقت الطلب',
        title_en: 'Request Timeout',
        message_ar: 'انتهى وقت الانتظار للرد من الخادم',
        message_en: 'Server response timeout',
        description_ar: 'استغرق الخادم وقتاً طويلاً للرد',
        description_en: 'Server took too long to respond',
        solution_ar: 'حاول مرة أخرى بعد قليل',
        solution_en: 'Please try again in a moment',
        technical_details: 'Request timeout exceeded configured threshold'
    },
    
    'API-002-001': {
        code: 'API-002-001',
        category: 'API',
        severity: 'high',
        title_ar: 'خطأ داخلي في الخادم',
        title_en: 'Internal Server Error',
        message_ar: 'حدث خطأ غير متوقع في الخادم',
        message_en: 'An unexpected error occurred on the server',
        description_ar: 'خطأ داخلي في الخادم (500)',
        description_en: 'Internal server error (500)',
        solution_ar: 'يتم العمل على حل المشكلة، الرجاء المحاولة لاحقاً',
        solution_en: 'We are working on fixing this issue, please try later',
        technical_details: 'Server returned 500 Internal Server Error'
    },
    
    'API-003-001': {
        code: 'API-003-001',
        category: 'API',
        severity: 'low',
        title_ar: 'المورد غير موجود',
        title_en: 'Resource Not Found',
        message_ar: 'المورد المطلوب غير موجود',
        message_en: 'The requested resource was not found',
        description_ar: 'خطأ 404 - المورد غير موجود',
        description_en: '404 Error - Resource not found',
        solution_ar: 'تحقق من صحة الرابط',
        solution_en: 'Verify the URL is correct',
        technical_details: 'HTTP 404 - endpoint or resource not found'
    },
    
    'API-004-001': {
        code: 'API-004-001',
        category: 'API',
        severity: 'medium',
        title_ar: 'طلب غير صالح',
        title_en: 'Bad Request',
        message_ar: 'البيانات المرسلة غير صحيحة',
        message_en: 'The data sent is invalid',
        description_ar: 'خطأ 400 - طلب غير صالح',
        description_en: '400 Error - Bad request',
        solution_ar: 'تحقق من البيانات المدخلة',
        solution_en: 'Check the entered data',
        technical_details: 'HTTP 400 - request validation failed'
    },
    
    // ============================================
    // أخطاء قاعدة البيانات (DB)
    // ============================================
    
    'DB-001-001': {
        code: 'DB-001-001',
        category: 'DB',
        severity: 'critical',
        title_ar: 'فشل الاتصال بقاعدة البيانات',
        title_en: 'Database Connection Failed',
        message_ar: 'تعذر الاتصال بقاعدة البيانات',
        message_en: 'Failed to connect to database',
        description_ar: 'لا يمكن إنشاء اتصال مع قاعدة البيانات',
        description_en: 'Unable to establish database connection',
        solution_ar: 'تحقق من إعدادات قاعدة البيانات',
        solution_en: 'Check database configuration',
        technical_details: 'SQL Server connection failed - check connection string'
    },
    
    'DB-001-002': {
        code: 'DB-001-002',
        category: 'DB',
        severity: 'high',
        title_ar: 'انتهى وقت الاتصال بقاعدة البيانات',
        title_en: 'Database Connection Timeout',
        message_ar: 'انتهى وقت الانتظار للاتصال بقاعدة البيانات',
        message_en: 'Database connection timeout',
        description_ar: 'استغرق الاتصال بقاعدة البيانات وقتاً طويلاً',
        description_en: 'Database connection took too long',
        solution_ar: 'تحقق من أداء قاعدة البيانات',
        solution_en: 'Check database performance',
        technical_details: 'SQL connection timeout exceeded'
    },
    
    'DB-002-001': {
        code: 'DB-002-001',
        category: 'DB',
        severity: 'medium',
        title_ar: 'خطأ في الاستعلام',
        title_en: 'Query Error',
        message_ar: 'حدث خطأ في تنفيذ الاستعلام',
        message_en: 'Query execution failed',
        description_ar: 'فشل تنفيذ استعلام SQL',
        description_en: 'SQL query execution failed',
        solution_ar: 'تحقق من صحة البيانات المدخلة',
        solution_en: 'Verify input data validity',
        technical_details: 'SQL query execution error - check query syntax and parameters'
    },
    
    'DB-003-001': {
        code: 'DB-003-001',
        category: 'DB',
        severity: 'medium',
        title_ar: 'قيد فريد مكرر',
        title_en: 'Duplicate Key Violation',
        message_ar: 'البيانات موجودة مسبقاً',
        message_en: 'Data already exists',
        description_ar: 'محاولة إدراج بيانات مكررة',
        description_en: 'Attempting to insert duplicate data',
        solution_ar: 'استخدم قيماً فريدة للحقول المطلوبة',
        solution_en: 'Use unique values for required fields',
        technical_details: 'SQL unique constraint violation'
    },
    
    'DB-004-001': {
        code: 'DB-004-001',
        category: 'DB',
        severity: 'medium',
        title_ar: 'قيد المفتاح الأجنبي',
        title_en: 'Foreign Key Constraint',
        message_ar: 'لا يمكن حذف أو تعديل السجل',
        message_en: 'Cannot delete or modify record',
        description_ar: 'السجل مرتبط ببيانات أخرى',
        description_en: 'Record is referenced by other data',
        solution_ar: 'احذف البيانات المرتبطة أولاً',
        solution_en: 'Delete related data first',
        technical_details: 'SQL foreign key constraint violation'
    },
    
    // ============================================
    // أخطاء التحقق من البيانات (VALIDATION)
    // ============================================
    
    'VAL-001-001': {
        code: 'VAL-001-001',
        category: 'VALIDATION',
        severity: 'low',
        title_ar: 'حقل مطلوب',
        title_en: 'Required Field',
        message_ar: 'الحقل مطلوب',
        message_en: 'Field is required',
        description_ar: 'حقل مطلوب لم يتم ملؤه',
        description_en: 'Required field was not filled',
        solution_ar: 'املأ جميع الحقول المطلوبة',
        solution_en: 'Fill all required fields',
        technical_details: 'Required field validation failed'
    },
    
    'VAL-001-002': {
        code: 'VAL-001-002',
        category: 'VALIDATION',
        severity: 'low',
        title_ar: 'تنسيق غير صحيح',
        title_en: 'Invalid Format',
        message_ar: 'تنسيق البيانات غير صحيح',
        message_en: 'Data format is invalid',
        description_ar: 'البيانات المدخلة لا تتطابق مع التنسيق المطلوب',
        description_en: 'Input data does not match required format',
        solution_ar: 'تحقق من تنسيق البيانات المدخلة',
        solution_en: 'Check input data format',
        technical_details: 'Format validation failed - regex mismatch'
    },
    
    'VAL-002-001': {
        code: 'VAL-002-001',
        category: 'VALIDATION',
        severity: 'low',
        title_ar: 'رقم الهوية الوطنية غير صحيح',
        title_en: 'Invalid National ID',
        message_ar: 'رقم الهوية الوطنية غير صحيح',
        message_en: 'National ID number is invalid',
        description_ar: 'رقم الهوية الوطنية لا يتطابق مع المعايير السعودية',
        description_en: 'National ID does not match Saudi standards',
        solution_ar: 'أدخل رقم هوية وطنية صحيح مكون من 10 أرقام',
        solution_en: 'Enter a valid 10-digit national ID',
        technical_details: 'Saudi National ID validation failed - format or checksum error'
    },
    
    'VAL-002-002': {
        code: 'VAL-002-002',
        category: 'VALIDATION',
        severity: 'low',
        title_ar: 'البريد الإلكتروني غير صحيح',
        title_en: 'Invalid Email',
        message_ar: 'عنوان البريد الإلكتروني غير صحيح',
        message_en: 'Email address is invalid',
        description_ar: 'تنسيق البريد الإلكتروني غير صحيح',
        description_en: 'Email format is invalid',
        solution_ar: 'أدخل بريد إلكتروني صحيح',
        solution_en: 'Enter a valid email address',
        technical_details: 'Email format validation failed'
    },
    
    'VAL-003-001': {
        code: 'VAL-003-001',
        category: 'VALIDATION',
        severity: 'low',
        title_ar: 'رقم الهاتف غير صحيح',
        title_en: 'Invalid Phone Number',
        message_ar: 'رقم الهاتف غير صحيح',
        message_en: 'Phone number is invalid',
        description_ar: 'رقم الهاتف لا يتطابق مع التنسيق السعودي',
        description_en: 'Phone number does not match Saudi format',
        solution_ar: 'أدخل رقم هاتف صحيح (05xxxxxxxx)',
        solution_en: 'Enter a valid phone number (05xxxxxxxx)',
        technical_details: 'Saudi phone number validation failed'
    },
    
    // ============================================
    // أخطاء الشبكة (NETWORK)
    // ============================================
    
    'NET-001-001': {
        code: 'NET-001-001',
        category: 'NETWORK',
        severity: 'high',
        title_ar: 'لا يوجد اتصال بالإنترنت',
        title_en: 'No Internet Connection',
        message_ar: 'فقدان الاتصال بالإنترنت',
        message_en: 'Lost internet connection',
        description_ar: 'الجهاز غير متصل بالإنترنت',
        description_en: 'Device is not connected to the internet',
        solution_ar: 'تحقق من اتصال الإنترنت',
        solution_en: 'Check your internet connection',
        technical_details: 'Network offline - no connectivity'
    },
    
    'NET-002-001': {
        code: 'NET-002-001',
        category: 'NETWORK',
        severity: 'medium',
        title_ar: 'اتصال ضعيف',
        title_en: 'Weak Connection',
        message_ar: 'اتصال الإنترنت ضعيف',
        message_en: 'Internet connection is weak',
        description_ar: 'سرعة الإنترنت منخفضة جداً',
        description_en: 'Internet speed is very low',
        solution_ar: 'حاول الاتصال بشبكة أفضل',
        solution_en: 'Try connecting to a better network',
        technical_details: 'Network latency high or bandwidth low'
    },
    
    // ============================================
    // أخطاء المكونات (COMPONENT)
    // ============================================
    
    'CMP-001-001': {
        code: 'CMP-001-001',
        category: 'COMPONENT',
        severity: 'medium',
        title_ar: 'خطأ في تحميل المكون',
        title_en: 'Component Load Error',
        message_ar: 'فشل تحميل المكون',
        message_en: 'Failed to load component',
        description_ar: 'لا يمكن تحميل المكون المطلوب',
        description_en: 'Unable to load required component',
        solution_ar: 'أعد تحميل الصفحة',
        solution_en: 'Reload the page',
        technical_details: 'React component failed to mount or render'
    },
    
    'CMP-002-001': {
        code: 'CMP-002-001',
        category: 'COMPONENT',
        severity: 'high',
        title_ar: 'خطأ في عرض المكون',
        title_en: 'Component Render Error',
        message_ar: 'حدث خطأ أثناء عرض المكون',
        message_en: 'Error occurred while rendering component',
        description_ar: 'فشل عرض المكون بسبب خطأ برمجي',
        description_en: 'Component rendering failed due to programming error',
        solution_ar: 'أعد تحميل الصفحة أو اتصل بالدعم الفني',
        solution_en: 'Reload page or contact technical support',
        technical_details: 'React component render error - check console for stack trace'
    },
    
    // ============================================
    // أخطاء الموارد البشرية (HR)
    // ============================================
    
    'HR-001-001': {
        code: 'HR-001-001',
        category: 'HR',
        severity: 'medium',
        title_ar: 'الموظف غير موجود',
        title_en: 'Employee Not Found',
        message_ar: 'لم يتم العثور على الموظف',
        message_en: 'Employee not found',
        description_ar: 'الموظف المطلوب غير موجود في النظام',
        description_en: 'Requested employee does not exist in system',
        solution_ar: 'تحقق من رقم الهوية أو معرف الموظف',
        solution_en: 'Verify employee ID or national ID',
        technical_details: 'Employee record not found in HR database'
    },
    
    'HR-001-002': {
        code: 'HR-001-002',
        category: 'HR',
        severity: 'low',
        title_ar: 'الموظف موجود مسبقاً',
        title_en: 'Employee Already Exists',
        message_ar: 'الموظف مسجل في النظام مسبقاً',
        message_en: 'Employee is already registered',
        description_ar: 'رقم الهوية الوطنية مسجل مسبقاً',
        description_en: 'National ID is already registered',
        solution_ar: 'استخدم رقم هوية مختلف أو حدّث بيانات الموظف الحالي',
        solution_en: 'Use different national ID or update existing employee',
        technical_details: 'Duplicate employee record - national ID already exists'
    },
    
    'HR-002-001': {
        code: 'HR-002-001',
        category: 'HR',
        severity: 'medium',
        title_ar: 'القسم غير موجود',
        title_en: 'Department Not Found',
        message_ar: 'القسم المحدد غير موجود',
        message_en: 'Specified department does not exist',
        description_ar: 'القسم المطلوب غير موجود في النظام',
        description_en: 'Requested department does not exist in system',
        solution_ar: 'اختر قسماً صحيحاً من القائمة',
        solution_en: 'Select a valid department from the list',
        technical_details: 'Department ID not found in HR database'
    },
    
    'HR-003-001': {
        code: 'HR-003-001',
        category: 'HR',
        severity: 'low',
        title_ar: 'فشل تحميل بيانات التزام',
        title_en: 'Failed to Load Eltizam Data',
        message_ar: 'تعذر تحميل بيانات نظام التزام',
        message_en: 'Failed to load Eltizam system data',
        description_ar: 'لا يمكن الاتصال بنظام التزام لجلب البيانات',
        description_en: 'Cannot connect to Eltizam system to fetch data',
        solution_ar: 'تحقق من الاتصال بنظام التزام',
        solution_en: 'Check Eltizam system connection',
        technical_details: 'Eltizam API connection failed or returned error'
    },
    
    // ============================================
    // أخطاء المستودعات (WAREHOUSE)
    // ============================================
    
    'WH-001-001': {
        code: 'WH-001-001',
        category: 'WAREHOUSE',
        severity: 'medium',
        title_ar: 'المنتج غير متوفر',
        title_en: 'Product Not Available',
        message_ar: 'المنتج غير متوفر في المخزون',
        message_en: 'Product is out of stock',
        description_ar: 'الكمية المطلوبة غير متوفرة',
        description_en: 'Requested quantity not available',
        solution_ar: 'اختر كمية أقل أو انتظر التوريد',
        solution_en: 'Choose lower quantity or wait for restocking',
        technical_details: 'Inventory quantity insufficient for request'
    },
    
    // ============================================
    // أخطاء النظام العامة (SYSTEM)
    // ============================================
    
    'SYS-001-001': {
        code: 'SYS-001-001',
        category: 'SYSTEM',
        severity: 'critical',
        title_ar: 'خطأ غير متوقع',
        title_en: 'Unexpected Error',
        message_ar: 'حدث خطأ غير متوقع',
        message_en: 'An unexpected error occurred',
        description_ar: 'خطأ غير معروف حدث في النظام',
        description_en: 'Unknown error occurred in system',
        solution_ar: 'أعد تحميل الصفحة أو اتصل بالدعم الفني',
        solution_en: 'Reload page or contact technical support',
        technical_details: 'Uncaught exception - check error logs'
    },
    
    'SYS-002-001': {
        code: 'SYS-002-001',
        category: 'SYSTEM',
        severity: 'high',
        title_ar: 'صيانة النظام',
        title_en: 'System Maintenance',
        message_ar: 'النظام قيد الصيانة حالياً',
        message_en: 'System is currently under maintenance',
        description_ar: 'النظام غير متاح مؤقتاً للصيانة',
        description_en: 'System temporarily unavailable for maintenance',
        solution_ar: 'حاول لاحقاً بعد انتهاء الصيانة',
        solution_en: 'Try again after maintenance is complete',
        technical_details: 'System in maintenance mode'
    }
};

/**
 * الحصول على معلومات كود الخطأ
 * Get error code information
 */
export function getErrorInfo(errorCode) {
    const error = ERROR_CODES[errorCode || 'SYS-001-001'];
    if (!error) {
        return ERROR_CODES['SYS-001-001'] || { title_ar: 'خطأ غير معروف', message_ar: 'حدث خطأ غير متوقع', severity: 'medium' };
    }
    
    const category = ERROR_CATEGORIES[error.category];
    
    return {
        ...error,
        categoryInfo: category
    };
}

/**
 * الحصول على لون الخطأ بناءً على الخطورة
 * Get error color based on severity
 */
export function getSeverityColor(severity) {
    const colors = {
        critical: '#7F1D1D', // red-900
        high: '#DC2626',     // red-600
        medium: '#F59E0B',   // amber-500
        low: '#3B82F6'       // blue-500
    };
    
    return colors[severity] || colors.low;
}

/**
 * تنسيق كود الخطأ للعرض
 * Format error code for display
 */
export function formatErrorCode(errorCode) {
    if (!errorCode) return 'SYS-001-001';
    const parts = errorCode.split('-');
    if (parts.length !== 3) return errorCode;

    const [category, module, error] = parts;
    return `${category}-${module.padStart(3, '0')}-${error.padStart(3, '0')}`;
}

/**
 * البحث عن أخطاء حسب الفئة
 * Search errors by category
 */
export function getErrorsByCategory(categoryCode) {
    return Object.values(ERROR_CODES).filter(
        error => error.category === categoryCode
    );
}

/**
 * البحث عن أخطاء حسب الخطورة
 * Search errors by severity
 */
export function getErrorsBySeverity(severity) {
    return Object.values(ERROR_CODES).filter(
        error => error.severity === severity
    );
}

export default {
    ERROR_CATEGORIES,
    ERROR_CODES,
    getErrorInfo,
    getSeverityColor,
    formatErrorCode,
    getErrorsByCategory,
    getErrorsBySeverity
};
