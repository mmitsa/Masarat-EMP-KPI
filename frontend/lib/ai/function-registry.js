/**
 * Function Registry
 * سجل الدوال المتاحة للمساعد الذكي
 */

/**
 * الدوال المتاحة للمساعد حسب الوحدة
 */
export const ASSISTANT_FUNCTIONS = {
    // ========================================
    // دوال الموارد البشرية (HR)
    // ========================================
    hr: {
        get_leave_balance: {
            name: 'get_leave_balance',
            description: 'عرض رصيد إجازات الموظف الحالي أو موظف محدد',
            parameters: {
                type: 'object',
                properties: {
                    employeeId: {
                        type: 'string',
                        description: 'رقم الموظف (اختياري - يستخدم المستخدم الحالي إذا لم يحدد)'
                    }
                },
                required: []
            },
            requiredPermission: 'hr.leaves.view',
            handler: 'HRActionHandler.getLeaveBalance'
        },

        create_leave_request: {
            name: 'create_leave_request',
            description: 'إنشاء طلب إجازة جديد',
            parameters: {
                type: 'object',
                properties: {
                    leaveType: {
                        type: 'string',
                        enum: ['annual', 'sick', 'emergency', 'marriage', 'death', 'maternity', 'paternity', 'hajj'],
                        description: 'نوع الإجازة'
                    },
                    startDate: {
                        type: 'string',
                        description: 'تاريخ بداية الإجازة (YYYY-MM-DD)'
                    },
                    endDate: {
                        type: 'string',
                        description: 'تاريخ نهاية الإجازة (YYYY-MM-DD)'
                    },
                    reason: {
                        type: 'string',
                        description: 'سبب الإجازة'
                    },
                    substituteEmployeeId: {
                        type: 'string',
                        description: 'رقم الموظف البديل (اختياري)'
                    }
                },
                required: ['leaveType', 'startDate', 'endDate']
            },
            requiredPermission: 'hr.leaves.create',
            requiresConfirmation: true,
            handler: 'HRActionHandler.createLeaveRequest'
        },

        search_employees: {
            name: 'search_employees',
            description: 'البحث عن موظف بالاسم أو الرقم',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'نص البحث (اسم أو رقم الموظف)'
                    },
                    department: {
                        type: 'string',
                        description: 'القسم (اختياري)'
                    }
                },
                required: ['query']
            },
            requiredPermission: 'hr.employees.view',
            handler: 'HRActionHandler.searchEmployees'
        },

        get_attendance_report: {
            name: 'get_attendance_report',
            description: 'عرض سجل الحضور والانصراف',
            parameters: {
                type: 'object',
                properties: {
                    employeeId: {
                        type: 'string',
                        description: 'رقم الموظف (اختياري)'
                    },
                    fromDate: {
                        type: 'string',
                        description: 'من تاريخ (YYYY-MM-DD)'
                    },
                    toDate: {
                        type: 'string',
                        description: 'إلى تاريخ (YYYY-MM-DD)'
                    }
                },
                required: []
            },
            requiredPermission: 'hr.attendance.view',
            handler: 'HRActionHandler.getAttendanceReport'
        },

        get_leave_requests: {
            name: 'get_leave_requests',
            description: 'عرض طلبات الإجازة المقدمة',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['pending', 'approved', 'rejected', 'all'],
                        description: 'حالة الطلب'
                    }
                },
                required: []
            },
            requiredPermission: 'hr.leaves.view',
            handler: 'HRActionHandler.getLeaveRequests'
        },
    },

    // ========================================
    // دوال المستودعات (Warehouse)
    // ========================================
    warehouse: {
        create_exchange_request: {
            name: 'create_exchange_request',
            description: 'إنشاء طلب صرف من المستودع',
            parameters: {
                type: 'object',
                properties: {
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                itemCode: { type: 'string', description: 'رمز الصنف' },
                                itemName: { type: 'string', description: 'اسم الصنف' },
                                quantity: { type: 'number', description: 'الكمية المطلوبة' }
                            },
                            required: ['itemCode', 'quantity']
                        },
                        description: 'الأصناف المطلوبة'
                    },
                    reason: {
                        type: 'string',
                        description: 'سبب الطلب'
                    },
                    urgency: {
                        type: 'string',
                        enum: ['normal', 'urgent'],
                        description: 'درجة الاستعجال'
                    }
                },
                required: ['items']
            },
            requiredPermission: 'warehouse.exchange.create',
            requiresConfirmation: true,
            handler: 'WarehouseActionHandler.createExchangeRequest'
        },

        get_my_custodies: {
            name: 'get_my_custodies',
            description: 'عرض العهد الشخصية للموظف',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            },
            requiredPermission: 'warehouse.custody.view',
            handler: 'WarehouseActionHandler.getMyCustodies'
        },

        search_items: {
            name: 'search_items',
            description: 'البحث عن صنف في المستودع',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'اسم أو رمز الصنف'
                    },
                    category: {
                        type: 'string',
                        description: 'التصنيف (اختياري)'
                    }
                },
                required: ['query']
            },
            requiredPermission: 'warehouse.items.view',
            handler: 'WarehouseActionHandler.searchItems'
        },

        get_item_stock: {
            name: 'get_item_stock',
            description: 'عرض كمية صنف معين في المخزون',
            parameters: {
                type: 'object',
                properties: {
                    itemCode: {
                        type: 'string',
                        description: 'رمز الصنف'
                    }
                },
                required: ['itemCode']
            },
            requiredPermission: 'warehouse.items.view',
            handler: 'WarehouseActionHandler.getItemStock'
        },

        get_exchange_request_status: {
            name: 'get_exchange_request_status',
            description: 'متابعة حالة طلب صرف',
            parameters: {
                type: 'object',
                properties: {
                    requestId: {
                        type: 'string',
                        description: 'رقم طلب الصرف'
                    }
                },
                required: ['requestId']
            },
            requiredPermission: 'warehouse.exchange.view',
            handler: 'WarehouseActionHandler.getExchangeRequestStatus'
        },
    },

    // ========================================
    // دوال حركة الأسطول (Movement)
    // ========================================
    movement: {
        book_vehicle: {
            name: 'book_vehicle',
            description: 'حجز مركبة لمهمة',
            parameters: {
                type: 'object',
                properties: {
                    date: {
                        type: 'string',
                        description: 'تاريخ المهمة (YYYY-MM-DD)'
                    },
                    startTime: {
                        type: 'string',
                        description: 'وقت البداية (HH:MM)'
                    },
                    endTime: {
                        type: 'string',
                        description: 'وقت النهاية (HH:MM)'
                    },
                    destination: {
                        type: 'string',
                        description: 'الوجهة'
                    },
                    purpose: {
                        type: 'string',
                        description: 'الغرض من المهمة'
                    },
                    passengers: {
                        type: 'number',
                        description: 'عدد الركاب'
                    }
                },
                required: ['date', 'destination', 'purpose']
            },
            requiredPermission: 'movement.missions.create',
            requiresConfirmation: true,
            handler: 'MovementActionHandler.bookVehicle'
        },

        get_available_vehicles: {
            name: 'get_available_vehicles',
            description: 'عرض المركبات المتاحة',
            parameters: {
                type: 'object',
                properties: {
                    date: {
                        type: 'string',
                        description: 'التاريخ (YYYY-MM-DD)'
                    },
                    vehicleType: {
                        type: 'string',
                        description: 'نوع المركبة (اختياري)'
                    }
                },
                required: []
            },
            requiredPermission: 'movement.vehicles.view',
            handler: 'MovementActionHandler.getAvailableVehicles'
        },

        get_my_trips: {
            name: 'get_my_trips',
            description: 'عرض رحلاتي',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['upcoming', 'completed', 'cancelled', 'all'],
                        description: 'حالة الرحلة'
                    }
                },
                required: []
            },
            requiredPermission: 'movement.trips.view',
            handler: 'MovementActionHandler.getMyTrips'
        },

        get_vehicle_info: {
            name: 'get_vehicle_info',
            description: 'عرض معلومات مركبة',
            parameters: {
                type: 'object',
                properties: {
                    vehicleId: {
                        type: 'string',
                        description: 'رقم المركبة أو رقم اللوحة'
                    }
                },
                required: ['vehicleId']
            },
            requiredPermission: 'movement.vehicles.view',
            handler: 'MovementActionHandler.getVehicleInfo'
        },
    },

    // ========================================
    // دوال الأرشفة (Archiving)
    // ========================================
    archiving: {
        search_documents: {
            name: 'search_documents',
            description: 'البحث عن معاملة أو وثيقة',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'نص البحث (باركود، رقم، موضوع)'
                    },
                    type: {
                        type: 'string',
                        description: 'نوع المعاملة (اختياري)'
                    },
                    fromDate: {
                        type: 'string',
                        description: 'من تاريخ (اختياري)'
                    },
                    toDate: {
                        type: 'string',
                        description: 'إلى تاريخ (اختياري)'
                    }
                },
                required: ['query']
            },
            requiredPermission: 'archiving.documents.view',
            handler: 'ArchivingActionHandler.searchDocuments'
        },

        get_document_status: {
            name: 'get_document_status',
            description: 'متابعة حالة معاملة',
            parameters: {
                type: 'object',
                properties: {
                    documentId: {
                        type: 'string',
                        description: 'رقم المعاملة أو الباركود'
                    }
                },
                required: ['documentId']
            },
            requiredPermission: 'archiving.documents.view',
            handler: 'ArchivingActionHandler.getDocumentStatus'
        },

        create_document: {
            name: 'create_document',
            description: 'إنشاء معاملة جديدة',
            parameters: {
                type: 'object',
                properties: {
                    subject: {
                        type: 'string',
                        description: 'موضوع المعاملة'
                    },
                    type: {
                        type: 'string',
                        enum: ['incoming', 'outgoing', 'internal'],
                        description: 'نوع المعاملة'
                    },
                    classification: {
                        type: 'string',
                        description: 'التصنيف'
                    },
                    description: {
                        type: 'string',
                        description: 'وصف المعاملة'
                    }
                },
                required: ['subject']
            },
            requiredPermission: 'archiving.documents.create',
            requiresConfirmation: true,
            handler: 'ArchivingActionHandler.createDocument'
        },

        get_classifications: {
            name: 'get_classifications',
            description: 'عرض تصنيفات المعاملات المتاحة',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            },
            requiredPermission: 'archiving.documents.view',
            handler: 'ArchivingActionHandler.getClassifications'
        },
    },

    // ========================================
    // دوال سداد (Sadad)
    // ========================================
    sadad: {
        get_invoices: {
            name: 'get_invoices',
            description: 'عرض الفواتير',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['pending', 'paid', 'overdue', 'all'],
                        description: 'حالة الفاتورة'
                    }
                },
                required: []
            },
            requiredPermission: 'sadad.invoices.view',
            handler: 'SadadActionHandler.getInvoices'
        },

        get_invoice_details: {
            name: 'get_invoice_details',
            description: 'عرض تفاصيل فاتورة',
            parameters: {
                type: 'object',
                properties: {
                    invoiceId: {
                        type: 'string',
                        description: 'رقم الفاتورة'
                    }
                },
                required: ['invoiceId']
            },
            requiredPermission: 'sadad.invoices.view',
            handler: 'SadadActionHandler.getInvoiceDetails'
        },

        record_payment: {
            name: 'record_payment',
            description: 'تسجيل دفعة لفاتورة',
            parameters: {
                type: 'object',
                properties: {
                    invoiceId: {
                        type: 'string',
                        description: 'رقم الفاتورة'
                    },
                    amount: {
                        type: 'number',
                        description: 'المبلغ (اختياري - يستخدم كامل مبلغ الفاتورة إذا لم يحدد)'
                    },
                    paymentMethod: {
                        type: 'string',
                        enum: ['cash', 'transfer', 'check'],
                        description: 'طريقة الدفع'
                    },
                    reference: {
                        type: 'string',
                        description: 'رقم مرجعي (اختياري)'
                    }
                },
                required: ['invoiceId']
            },
            requiredPermission: 'sadad.payments.create',
            requiresConfirmation: true,
            handler: 'SadadActionHandler.recordPayment'
        },

        get_payments: {
            name: 'get_payments',
            description: 'عرض سجل المدفوعات',
            parameters: {
                type: 'object',
                properties: {
                    fromDate: {
                        type: 'string',
                        description: 'من تاريخ (YYYY-MM-DD)'
                    },
                    toDate: {
                        type: 'string',
                        description: 'إلى تاريخ (YYYY-MM-DD)'
                    }
                },
                required: []
            },
            requiredPermission: 'sadad.payments.view',
            handler: 'SadadActionHandler.getPayments'
        },
    },

    // ========================================
    // دوال قياس الأداء (EPM)
    // ========================================
    epm: {
        get_my_goals: {
            name: 'get_my_goals',
            description: 'عرض أهدافي',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['active', 'completed', 'all'],
                        description: 'حالة الهدف'
                    }
                },
                required: []
            },
            requiredPermission: 'epm.goals.view',
            handler: 'EPMActionHandler.getMyGoals'
        },

        update_goal_progress: {
            name: 'update_goal_progress',
            description: 'تحديث نسبة إنجاز هدف',
            parameters: {
                type: 'object',
                properties: {
                    goalId: {
                        type: 'string',
                        description: 'رقم الهدف'
                    },
                    progress: {
                        type: 'number',
                        description: 'نسبة الإنجاز (0-100)'
                    },
                    notes: {
                        type: 'string',
                        description: 'ملاحظات (اختياري)'
                    }
                },
                required: ['goalId', 'progress']
            },
            requiredPermission: 'epm.goals.update',
            requiresConfirmation: true,
            handler: 'EPMActionHandler.updateGoalProgress'
        },

        create_goal: {
            name: 'create_goal',
            description: 'إنشاء هدف جديد',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'عنوان الهدف'
                    },
                    description: {
                        type: 'string',
                        description: 'وصف الهدف'
                    },
                    targetDate: {
                        type: 'string',
                        description: 'تاريخ الإنجاز المستهدف (YYYY-MM-DD)'
                    },
                    weight: {
                        type: 'number',
                        description: 'وزن الهدف (1-5)'
                    },
                    kpiId: {
                        type: 'string',
                        description: 'رقم مؤشر الأداء المرتبط (اختياري)'
                    }
                },
                required: ['title', 'targetDate']
            },
            requiredPermission: 'epm.goals.create',
            requiresConfirmation: true,
            handler: 'EPMActionHandler.createGoal'
        },

        get_evaluations: {
            name: 'get_evaluations',
            description: 'عرض تقييمات الأداء',
            parameters: {
                type: 'object',
                properties: {
                    period: {
                        type: 'string',
                        description: 'فترة التقييم (مثل: Q1-2026)'
                    }
                },
                required: []
            },
            requiredPermission: 'epm.evaluations.view',
            handler: 'EPMActionHandler.getEvaluations'
        },

        get_kpis: {
            name: 'get_kpis',
            description: 'عرض مؤشرات الأداء الرئيسية',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            },
            requiredPermission: 'epm.kpis.view',
            handler: 'EPMActionHandler.getKPIs'
        },
    },

    // ========================================
    // دوال التنقل (Navigation) - متاحة للجميع
    // ========================================
    navigation: {
        navigate_to: {
            name: 'navigate_to',
            description: 'التنقل إلى صفحة في النظام',
            parameters: {
                type: 'object',
                properties: {
                    destination: {
                        type: 'string',
                        description: 'الوجهة (مثل: الإجازات، المستودع، الحضور)'
                    }
                },
                required: ['destination']
            },
            requiredPermission: null,
            handler: 'NavigationHandler.navigateTo'
        },

        get_help: {
            name: 'get_help',
            description: 'عرض المساعدة حول موضوع معين',
            parameters: {
                type: 'object',
                properties: {
                    topic: {
                        type: 'string',
                        description: 'الموضوع المطلوب المساعدة فيه'
                    }
                },
                required: ['topic']
            },
            requiredPermission: null,
            handler: 'NavigationHandler.getHelp'
        },
    },
};

/**
 * الحصول على الدوال المتاحة للمستخدم بناءً على الوحدة والصلاحيات
 * @param {string} module - الوحدة الحالية
 * @param {Array} userRoles - صلاحيات المستخدم
 * @returns {Array} - قائمة الدوال المتاحة
 */
export function getAvailableFunctions(module, userRoles = []) {
    const functions = [];

    // إضافة دوال الوحدة الحالية
    const moduleFunctions = ASSISTANT_FUNCTIONS[module] || {};
    for (const func of Object.values(moduleFunctions)) {
        if (!func.requiredPermission || hasPermission(userRoles, func.requiredPermission)) {
            functions.push(func);
        }
    }

    // إضافة دوال التنقل (متاحة دائماً)
    for (const func of Object.values(ASSISTANT_FUNCTIONS.navigation)) {
        functions.push(func);
    }

    return functions;
}

/**
 * التحقق من الصلاحية
 */
function hasPermission(userRoles, requiredPermission) {
    if (!requiredPermission) return true;
    if (userRoles.includes('super_admin')) return true;

    // تبسيط: التحقق من وجود الدور المناسب
    const [system] = requiredPermission.split('.');
    const systemRoles = {
        hr: ['hr_manager', 'hr_employee'],
        warehouse: ['warehouse_admin', 'warehouse_keeper'],
        movement: ['fleet_manager', 'driver'],
        archiving: ['archive_admin', 'archive_clerk'],
        sadad: ['finance_admin'],
        epm: ['epm_admin', 'epm_viewer'],
    };

    const allowedRoles = systemRoles[system] || [];
    return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * تحويل الدوال لتنسيق Claude Tools
 */
export function buildClaudeTools(functions) {
    return functions.map(func => ({
        name: func.name,
        description: func.description,
        input_schema: {
            type: 'object',
            properties: func.parameters?.properties || {},
            required: func.parameters?.required || [],
        },
    }));
}

/**
 * الحصول على دالة حسب الاسم
 */
export function getFunctionByName(name) {
    for (const moduleFunctions of Object.values(ASSISTANT_FUNCTIONS)) {
        for (const func of Object.values(moduleFunctions)) {
            if (func.name === name) {
                return func;
            }
        }
    }
    return null;
}

export default {
    ASSISTANT_FUNCTIONS,
    getAvailableFunctions,
    buildClaudeTools,
    getFunctionByName,
};
