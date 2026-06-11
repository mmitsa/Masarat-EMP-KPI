/**
 * التكامل مع النظام المالي - النظام المحاسبي للجهات الحكومية
 * Finance Integration - Government Accounting System
 *
 * متوافق مع:
 * - النظام المحاسبي الحكومي السعودي
 * - معايير المحاسبة الحكومية الدولية (IPSAS)
 * - دليل الحسابات الموحد للجهات الحكومية
 */

// ==================== أنواع العمليات المالية ====================
export const FINANCIAL_TRANSACTION_TYPES = {
    INVENTORY_ISSUE: 'inventory_issue',           // صرف من المخزون
    INVENTORY_RECEIVE: 'inventory_receive',       // استلام للمخزون
    INVENTORY_RETURN: 'inventory_return',         // إرجاع للمخزون
    INVENTORY_ADJUSTMENT: 'inventory_adjustment', // تسوية مخزون
    INVENTORY_TRANSFER: 'inventory_transfer',     // نقل بين مستودعات
    INVENTORY_DISPOSAL: 'inventory_disposal',     // إتلاف مخزون
    CUSTODY_ISSUE: 'custody_issue',               // صرف عهدة
    CUSTODY_RETURN: 'custody_return',             // استرداد عهدة
    PURCHASE_ORDER: 'purchase_order',             // أمر شراء
    PURCHASE_RECEIVE: 'purchase_receive',         // استلام مشتريات
};

// ==================== دليل الحسابات الموحد للجهات الحكومية ====================
export const CHART_OF_ACCOUNTS = {
    // الأصول (1xxx)
    ASSETS: {
        code: '1000',
        nameAr: 'الأصول',
        nameEn: 'Assets',
        children: {
            CURRENT_ASSETS: {
                code: '1100',
                nameAr: 'الأصول المتداولة',
                nameEn: 'Current Assets',
                children: {
                    INVENTORY: {
                        code: '1140',
                        nameAr: 'المخزون',
                        nameEn: 'Inventory',
                        children: {
                            CONSUMABLES: { code: '1141', nameAr: 'المستهلكات', nameEn: 'Consumables' },
                            SPARE_PARTS: { code: '1142', nameAr: 'قطع الغيار', nameEn: 'Spare Parts' },
                            STATIONERY: { code: '1143', nameAr: 'القرطاسية', nameEn: 'Stationery' },
                            FUEL: { code: '1144', nameAr: 'الوقود', nameEn: 'Fuel' },
                            CLEANING: { code: '1145', nameAr: 'مواد النظافة', nameEn: 'Cleaning Supplies' },
                            ELECTRICAL: { code: '1146', nameAr: 'المواد الكهربائية', nameEn: 'Electrical Supplies' },
                            FURNITURE: { code: '1147', nameAr: 'الأثاث', nameEn: 'Furniture' },
                            EQUIPMENT: { code: '1148', nameAr: 'المعدات', nameEn: 'Equipment' },
                            OTHER: { code: '1149', nameAr: 'مخزون آخر', nameEn: 'Other Inventory' },
                        }
                    },
                    CUSTODY: {
                        code: '1150',
                        nameAr: 'العهد',
                        nameEn: 'Custody Items',
                        children: {
                            PERMANENT: { code: '1151', nameAr: 'عهد دائمة', nameEn: 'Permanent Custody' },
                            TEMPORARY: { code: '1152', nameAr: 'عهد مؤقتة', nameEn: 'Temporary Custody' },
                        }
                    }
                }
            },
            FIXED_ASSETS: {
                code: '1200',
                nameAr: 'الأصول الثابتة',
                nameEn: 'Fixed Assets',
                children: {
                    VEHICLES: { code: '1210', nameAr: 'المركبات', nameEn: 'Vehicles' },
                    MACHINERY: { code: '1220', nameAr: 'الآلات والمعدات', nameEn: 'Machinery & Equipment' },
                    IT_EQUIPMENT: { code: '1230', nameAr: 'أجهزة الحاسب', nameEn: 'IT Equipment' },
                    FURNITURE_FIXED: { code: '1240', nameAr: 'الأثاث والتجهيزات', nameEn: 'Furniture & Fixtures' },
                }
            }
        }
    },

    // المصروفات (4xxx)
    EXPENSES: {
        code: '4000',
        nameAr: 'المصروفات',
        nameEn: 'Expenses',
        children: {
            OPERATING_EXPENSES: {
                code: '4100',
                nameAr: 'مصروفات التشغيل',
                nameEn: 'Operating Expenses',
                children: {
                    SUPPLIES_EXPENSE: { code: '4110', nameAr: 'مصروف المستهلكات', nameEn: 'Supplies Expense' },
                    MAINTENANCE_EXPENSE: { code: '4120', nameAr: 'مصروف الصيانة', nameEn: 'Maintenance Expense' },
                    FUEL_EXPENSE: { code: '4130', nameAr: 'مصروف الوقود', nameEn: 'Fuel Expense' },
                    CLEANING_EXPENSE: { code: '4140', nameAr: 'مصروف النظافة', nameEn: 'Cleaning Expense' },
                    STATIONERY_EXPENSE: { code: '4150', nameAr: 'مصروف القرطاسية', nameEn: 'Stationery Expense' },
                }
            },
            DEPRECIATION: {
                code: '4200',
                nameAr: 'الإهلاك',
                nameEn: 'Depreciation',
                children: {
                    VEHICLES_DEP: { code: '4210', nameAr: 'إهلاك المركبات', nameEn: 'Vehicles Depreciation' },
                    EQUIPMENT_DEP: { code: '4220', nameAr: 'إهلاك المعدات', nameEn: 'Equipment Depreciation' },
                    IT_DEP: { code: '4230', nameAr: 'إهلاك أجهزة الحاسب', nameEn: 'IT Depreciation' },
                }
            }
        }
    },

    // الالتزامات (2xxx)
    LIABILITIES: {
        code: '2000',
        nameAr: 'الالتزامات',
        nameEn: 'Liabilities',
        children: {
            ACCOUNTS_PAYABLE: {
                code: '2100',
                nameAr: 'الذمم الدائنة',
                nameEn: 'Accounts Payable',
                children: {
                    SUPPLIERS: { code: '2110', nameAr: 'الموردين', nameEn: 'Suppliers' },
                }
            },
            VAT_PAYABLE: {
                code: '2200',
                nameAr: 'ضريبة القيمة المضافة المستحقة',
                nameEn: 'VAT Payable'
            }
        }
    }
};

// ==================== بنود الميزانية الحكومية ====================
export const BUDGET_ITEMS = {
    // الباب الأول - الرواتب والأجور
    CHAPTER_1: {
        code: '1',
        nameAr: 'الرواتب والأجور والبدلات',
        nameEn: 'Salaries, Wages and Allowances'
    },
    // الباب الثاني - المصروفات التشغيلية
    CHAPTER_2: {
        code: '2',
        nameAr: 'المصروفات التشغيلية',
        nameEn: 'Operating Expenses',
        items: {
            SUPPLIES: { code: '201', nameAr: 'مستلزمات تشغيلية', nameEn: 'Operating Supplies' },
            SERVICES: { code: '202', nameAr: 'خدمات تشغيلية', nameEn: 'Operating Services' },
            MAINTENANCE: { code: '203', nameAr: 'صيانة وتشغيل', nameEn: 'Maintenance' },
            FUEL: { code: '204', nameAr: 'وقود ومحروقات', nameEn: 'Fuel' },
            STATIONERY: { code: '205', nameAr: 'قرطاسية ومطبوعات', nameEn: 'Stationery' },
        }
    },
    // الباب الثالث - المصروفات الرأسمالية
    CHAPTER_3: {
        code: '3',
        nameAr: 'المصروفات الرأسمالية',
        nameEn: 'Capital Expenses',
        items: {
            EQUIPMENT: { code: '301', nameAr: 'آلات ومعدات', nameEn: 'Equipment' },
            VEHICLES: { code: '302', nameAr: 'سيارات ومركبات', nameEn: 'Vehicles' },
            IT: { code: '303', nameAr: 'أجهزة حاسب آلي', nameEn: 'IT Equipment' },
            FURNITURE: { code: '304', nameAr: 'أثاث ومفروشات', nameEn: 'Furniture' },
        }
    }
};

// ==================== نسبة ضريبة القيمة المضافة ====================
export const VAT_RATE = 0.15; // 15%

// ==================== فئات المخزون وحساباتها ====================
export const INVENTORY_CATEGORIES = {
    CONSUMABLES: {
        id: 1,
        nameAr: 'مستهلكات',
        nameEn: 'Consumables',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.CONSUMABLES,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.SUPPLIES_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_2.items.SUPPLIES
    },
    SPARE_PARTS: {
        id: 2,
        nameAr: 'قطع غيار',
        nameEn: 'Spare Parts',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.SPARE_PARTS,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.MAINTENANCE_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_2.items.MAINTENANCE
    },
    STATIONERY: {
        id: 3,
        nameAr: 'قرطاسية',
        nameEn: 'Stationery',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.STATIONERY,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.STATIONERY_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_2.items.STATIONERY
    },
    FUEL: {
        id: 4,
        nameAr: 'وقود',
        nameEn: 'Fuel',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.FUEL,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.FUEL_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_2.items.FUEL
    },
    CLEANING: {
        id: 5,
        nameAr: 'مواد نظافة',
        nameEn: 'Cleaning Supplies',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.CLEANING,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.CLEANING_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_2.items.SERVICES
    },
    ELECTRICAL: {
        id: 6,
        nameAr: 'مواد كهربائية',
        nameEn: 'Electrical Supplies',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.ELECTRICAL,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.MAINTENANCE_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_2.items.MAINTENANCE
    },
    EQUIPMENT: {
        id: 7,
        nameAr: 'معدات',
        nameEn: 'Equipment',
        inventoryAccount: CHART_OF_ACCOUNTS.ASSETS.children.CURRENT_ASSETS.children.INVENTORY.children.EQUIPMENT,
        expenseAccount: CHART_OF_ACCOUNTS.EXPENSES.children.OPERATING_EXPENSES.children.SUPPLIES_EXPENSE,
        budgetItem: BUDGET_ITEMS.CHAPTER_3.items.EQUIPMENT,
        isCapital: true
    },
};

// ==================== فئة التأثير المالي ====================
export class FinancialImpactCalculator {
    constructor() {
        this.vatRate = VAT_RATE;
    }

    /**
     * حساب التأثير المالي لطلب صرف من المخزون
     * @param {Array} items - قائمة الأصناف المطلوب صرفها
     * @param {Object} options - خيارات إضافية
     */
    calculateExchangeImpact(items, options = {}) {
        const impact = {
            items: [],
            summary: {
                subtotal: 0,
                vatAmount: 0,
                totalWithVat: 0,
                byCategory: {},
                byBudgetItem: {},
                byAccount: {
                    debit: [],
                    credit: []
                }
            },
            journalEntry: null,
            budgetImpact: null
        };

        // حساب كل صنف
        items.forEach(item => {
            const category = this.getCategoryForItem(item);
            const itemTotal = item.quantity * item.unitPrice;
            const itemVat = itemTotal * this.vatRate;
            const itemTotalWithVat = itemTotal + itemVat;

            const itemImpact = {
                itemId: item.id,
                itemName: item.name,
                itemCode: item.code,
                category: category.nameAr,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: itemTotal,
                vatAmount: itemVat,
                totalWithVat: itemTotalWithVat,
                inventoryAccount: category.inventoryAccount.code,
                expenseAccount: category.expenseAccount.code,
                budgetItem: category.budgetItem.code
            };

            impact.items.push(itemImpact);

            // تجميع حسب الفئة
            if (!impact.summary.byCategory[category.nameAr]) {
                impact.summary.byCategory[category.nameAr] = {
                    subtotal: 0,
                    vatAmount: 0,
                    totalWithVat: 0,
                    itemCount: 0
                };
            }
            impact.summary.byCategory[category.nameAr].subtotal += itemTotal;
            impact.summary.byCategory[category.nameAr].vatAmount += itemVat;
            impact.summary.byCategory[category.nameAr].totalWithVat += itemTotalWithVat;
            impact.summary.byCategory[category.nameAr].itemCount++;

            // تجميع حسب بند الميزانية
            const budgetCode = category.budgetItem.code;
            if (!impact.summary.byBudgetItem[budgetCode]) {
                impact.summary.byBudgetItem[budgetCode] = {
                    name: category.budgetItem.nameAr,
                    amount: 0
                };
            }
            impact.summary.byBudgetItem[budgetCode].amount += itemTotal;

            // تحديث الإجماليات
            impact.summary.subtotal += itemTotal;
            impact.summary.vatAmount += itemVat;
            impact.summary.totalWithVat += itemTotalWithVat;
        });

        // إنشاء قيد اليومية
        impact.journalEntry = this.generateJournalEntry(impact, FINANCIAL_TRANSACTION_TYPES.INVENTORY_ISSUE);

        // حساب تأثير الميزانية
        impact.budgetImpact = this.calculateBudgetImpact(impact);

        return impact;
    }

    /**
     * الحصول على فئة الصنف
     */
    getCategoryForItem(item) {
        const categoryId = item.categoryId || item.category_id || 1;
        const category = Object.values(INVENTORY_CATEGORIES).find(c => c.id === categoryId);
        return category || INVENTORY_CATEGORIES.CONSUMABLES;
    }

    /**
     * إنشاء قيد اليومية
     * @param {Object} impact - التأثير المالي
     * @param {String} transactionType - نوع العملية
     */
    generateJournalEntry(impact, transactionType) {
        const entry = {
            date: new Date().toISOString().split('T')[0],
            reference: `EXR-${Date.now()}`,
            description: '',
            entries: []
        };

        switch (transactionType) {
            case FINANCIAL_TRANSACTION_TYPES.INVENTORY_ISSUE:
                entry.description = 'صرف مواد من المخزون';

                // تجميع حسب الحسابات
                const expensesByAccount = {};
                const inventoryByAccount = {};

                impact.items.forEach(item => {
                    // حساب المصروفات (مدين)
                    if (!expensesByAccount[item.expenseAccount]) {
                        expensesByAccount[item.expenseAccount] = 0;
                    }
                    expensesByAccount[item.expenseAccount] += item.subtotal;

                    // حساب المخزون (دائن)
                    if (!inventoryByAccount[item.inventoryAccount]) {
                        inventoryByAccount[item.inventoryAccount] = 0;
                    }
                    inventoryByAccount[item.inventoryAccount] += item.subtotal;
                });

                // قيود المصروفات (مدين)
                Object.entries(expensesByAccount).forEach(([account, amount]) => {
                    entry.entries.push({
                        account,
                        accountName: this.getAccountName(account),
                        debit: amount,
                        credit: 0
                    });
                });

                // قيود المخزون (دائن)
                Object.entries(inventoryByAccount).forEach(([account, amount]) => {
                    entry.entries.push({
                        account,
                        accountName: this.getAccountName(account),
                        debit: 0,
                        credit: amount
                    });
                });
                break;

            case FINANCIAL_TRANSACTION_TYPES.INVENTORY_RECEIVE:
                entry.description = 'استلام مواد للمخزون';
                // قيد معاكس
                break;
        }

        // التحقق من توازن القيد
        const totalDebit = entry.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entry.entries.reduce((sum, e) => sum + e.credit, 0);
        entry.isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
        entry.totalDebit = totalDebit;
        entry.totalCredit = totalCredit;

        return entry;
    }

    /**
     * الحصول على اسم الحساب
     */
    getAccountName(accountCode) {
        const accountNames = {
            '1141': 'المستهلكات',
            '1142': 'قطع الغيار',
            '1143': 'القرطاسية',
            '1144': 'الوقود',
            '1145': 'مواد النظافة',
            '1146': 'المواد الكهربائية',
            '1147': 'الأثاث',
            '1148': 'المعدات',
            '1149': 'مخزون آخر',
            '4110': 'مصروف المستهلكات',
            '4120': 'مصروف الصيانة',
            '4130': 'مصروف الوقود',
            '4140': 'مصروف النظافة',
            '4150': 'مصروف القرطاسية',
        };
        return accountNames[accountCode] || `حساب ${accountCode}`;
    }

    /**
     * حساب تأثير الميزانية
     */
    calculateBudgetImpact(impact) {
        // في الإنتاج: جلب بيانات الميزانية الفعلية من API
        const mockBudgetData = {
            '201': { allocated: 500000, spent: 320000, available: 180000 },
            '203': { allocated: 200000, spent: 150000, available: 50000 },
            '204': { allocated: 100000, spent: 75000, available: 25000 },
            '205': { allocated: 80000, spent: 45000, available: 35000 },
            '301': { allocated: 300000, spent: 200000, available: 100000 },
        };

        const budgetImpact = {
            items: [],
            warnings: [],
            canProceed: true
        };

        Object.entries(impact.summary.byBudgetItem).forEach(([code, data]) => {
            const budget = mockBudgetData[code] || { allocated: 0, spent: 0, available: 0 };

            const item = {
                budgetCode: code,
                budgetName: data.name,
                requestedAmount: data.amount,
                allocated: budget.allocated,
                previouslySpent: budget.spent,
                availableBefore: budget.available,
                availableAfter: budget.available - data.amount,
                utilizationBefore: budget.allocated > 0 ? (budget.spent / budget.allocated * 100).toFixed(1) : 0,
                utilizationAfter: budget.allocated > 0 ? ((budget.spent + data.amount) / budget.allocated * 100).toFixed(1) : 0,
                exceedsAvailable: data.amount > budget.available,
                exceedsAllocated: (budget.spent + data.amount) > budget.allocated
            };

            budgetImpact.items.push(item);

            // تحذيرات
            if (item.exceedsAvailable) {
                budgetImpact.warnings.push({
                    type: 'error',
                    message: `المبلغ المطلوب (${data.amount.toLocaleString()} ريال) يتجاوز المتاح في بند ${data.name} (${budget.available.toLocaleString()} ريال)`
                });
                budgetImpact.canProceed = false;
            } else if (parseFloat(item.utilizationAfter) > 90) {
                budgetImpact.warnings.push({
                    type: 'warning',
                    message: `نسبة الصرف من بند ${data.name} ستصل إلى ${item.utilizationAfter}% بعد هذا الطلب`
                });
            }
        });

        return budgetImpact;
    }

    /**
     * التحقق من توفر الميزانية
     */
    async checkBudgetAvailability(amount, budgetItemCode) {
        // في الإنتاج: التحقق من API المالية
        const mockBudget = {
            '201': { available: 180000 },
            '203': { available: 50000 },
            '204': { available: 25000 },
            '205': { available: 35000 },
        };

        const budget = mockBudget[budgetItemCode] || { available: 0 };

        return {
            available: budget.available,
            requested: amount,
            isAvailable: amount <= budget.available,
            shortfall: amount > budget.available ? amount - budget.available : 0
        };
    }

    /**
     * تنسيق المبلغ بالريال السعودي
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 2
        }).format(amount);
    }
}

// ==================== API Functions ====================

// Import API client if available
let api = null;
if (typeof window !== 'undefined') {
    import('./api').then(module => {
        api = module.default;
    }).catch(() => {
        console.warn('API client not available, using mock data');
    });
}

/**
 * جلب بيانات الميزانية من النظام المالي
 * @param {number} fiscalYear - السنة المالية
 */
export async function fetchBudgetData(fiscalYear = null) {
    const currentYear = fiscalYear || new Date().getFullYear();

    // محاولة جلب البيانات من API
    if (api?.finance?.warehouseIntegration?.getBudgetItems) {
        try {
            const response = await api.finance.warehouseIntegration.getBudgetItems({ fiscalYear: currentYear });
            if (response && !response.error) {
                return response;
            }
        } catch (error) {
            console.warn('Failed to fetch budget data from API, using fallback:', error);
        }
    }

    // بيانات افتراضية للتطوير
    return {
        fiscalYear: currentYear,
        chapters: [
            {
                code: '2',
                name: 'المصروفات التشغيلية',
                allocated: 1500000,
                spent: 980000,
                available: 520000,
                items: [
                    { code: '201', name: 'مستلزمات تشغيلية', allocated: 500000, spent: 320000, available: 180000 },
                    { code: '202', name: 'خدمات تشغيلية', allocated: 300000, spent: 200000, available: 100000 },
                    { code: '203', name: 'صيانة وتشغيل', allocated: 200000, spent: 150000, available: 50000 },
                    { code: '204', name: 'وقود ومحروقات', allocated: 100000, spent: 75000, available: 25000 },
                    { code: '205', name: 'قرطاسية ومطبوعات', allocated: 80000, spent: 45000, available: 35000 },
                ]
            },
            {
                code: '3',
                name: 'المصروفات الرأسمالية',
                allocated: 800000,
                spent: 450000,
                available: 350000,
                items: [
                    { code: '301', name: 'آلات ومعدات', allocated: 300000, spent: 200000, available: 100000 },
                    { code: '302', name: 'سيارات ومركبات', allocated: 200000, spent: 100000, available: 100000 },
                    { code: '303', name: 'أجهزة حاسب آلي', allocated: 150000, spent: 100000, available: 50000 },
                    { code: '304', name: 'أثاث ومفروشات', allocated: 150000, spent: 50000, available: 100000 },
                ]
            }
        ]
    };
}

/**
 * تسجيل قيد محاسبي
 * @param {Object} journalEntry - بيانات القيد المحاسبي
 */
export async function postJournalEntry(journalEntry) {
    // محاولة إرسال للنظام المالي
    if (api?.finance?.warehouseIntegration?.createJournalFromExchange) {
        try {
            const response = await api.finance.gl.createJournal(journalEntry);
            if (response && !response.error) {
                return {
                    success: true,
                    entryNumber: response.journalNumber || response.id,
                    postedAt: response.postedAt || new Date().toISOString(),
                    ...response
                };
            }
        } catch (error) {
            console.warn('Failed to post journal entry to API:', error);
        }
    }

    // محاكاة للتطوير
    console.log('Posting journal entry (mock):', journalEntry);
    return {
        success: true,
        entryNumber: `JE-${Date.now()}`,
        postedAt: new Date().toISOString()
    };
}

/**
 * جلب حركات المخزون مع التأثير المالي
 * @param {string} warehouseId - معرف المستودع
 * @param {string} startDate - تاريخ البداية
 * @param {string} endDate - تاريخ النهاية
 */
export async function getInventoryTransactions(warehouseId = null, startDate = null, endDate = null) {
    // محاولة جلب من API
    if (api?.finance?.warehouseIntegration?.getInventoryMovementReport) {
        try {
            const params = {};
            if (warehouseId) params.warehouseId = warehouseId;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.finance.warehouseIntegration.getInventoryMovementReport(params);
            if (response && !response.error) {
                return response;
            }
        } catch (error) {
            console.warn('Failed to fetch inventory transactions from API:', error);
        }
    }

    // بيانات افتراضية للتطوير
    return {
        transactions: [],
        summary: {
            totalIssued: 0,
            totalReceived: 0,
            netChange: 0
        }
    };
}

/**
 * فحص توفر الميزانية - تكامل مباشر مع API
 * @param {Object} data - بيانات الفحص
 */
export async function checkBudgetAvailabilityAPI(data) {
    if (api?.finance?.warehouseIntegration?.checkBudgetAvailability) {
        try {
            const response = await api.finance.warehouseIntegration.checkBudgetAvailability(data);
            if (response && !response.error) {
                // تحويل الاستجابة للصيغة المطلوبة
                return {
                    canProceed: response.isAvailable !== false,
                    isAvailable: response.isAvailable,
                    requested: response.requested || data.totalAmount,
                    available: response.available,
                    shortfall: response.shortfall || 0,
                    warnings: response.warnings || [],
                    items: response.items || [],
                };
            }
        } catch (error) {
            console.warn('Failed to check budget availability from API:', error);
        }
    }

    // محاكاة للتطوير - فحص المبلغ المطلوب مقابل الميزانية المتاحة
    const totalAmount = data.totalAmount || 0;
    const mockBudgetData = {
        available: 180000,
        allocated: 500000,
        spent: 320000,
    };

    const warnings = [];
    let canProceed = true;

    if (totalAmount > mockBudgetData.available) {
        warnings.push({
            type: 'error',
            message: `المبلغ المطلوب (${totalAmount.toLocaleString()} ريال) يتجاوز المتاح (${mockBudgetData.available.toLocaleString()} ريال)`
        });
        canProceed = false;
    } else if (totalAmount > mockBudgetData.available * 0.5) {
        warnings.push({
            type: 'warning',
            message: 'هذا الطلب سيستهلك أكثر من 50% من الميزانية المتبقية'
        });
    }

    const utilizationAfter = ((mockBudgetData.spent + totalAmount) / mockBudgetData.allocated * 100).toFixed(1);
    if (parseFloat(utilizationAfter) > 90) {
        warnings.push({
            type: 'warning',
            message: `نسبة الصرف ستصل إلى ${utilizationAfter}% بعد هذا الطلب`
        });
    }

    return {
        canProceed,
        isAvailable: canProceed,
        requested: totalAmount,
        available: mockBudgetData.available,
        shortfall: canProceed ? 0 : totalAmount - mockBudgetData.available,
        warnings,
        items: [{
            budgetCode: '201',
            budgetName: 'مستلزمات تشغيلية',
            requestedAmount: totalAmount,
            allocated: mockBudgetData.allocated,
            availableBefore: mockBudgetData.available,
            availableAfter: mockBudgetData.available - totalAmount,
            utilizationAfter,
        }],
    };
}

/**
 * حساب التأثير المالي لطلب الصرف - تكامل مباشر مع API
 * @param {Object} data - بيانات طلب الصرف
 */
export async function calculateExchangeImpactAPI(data) {
    if (api?.finance?.warehouseIntegration?.calculateExchangeImpact) {
        try {
            const response = await api.finance.warehouseIntegration.calculateExchangeImpact(data);
            if (response && !response.error) {
                return response;
            }
        } catch (error) {
            console.warn('Failed to calculate exchange impact from API:', error);
        }
    }

    // استخدام الحاسبة المحلية
    const calculator = new FinancialImpactCalculator();
    return calculator.calculateExchangeImpact(data.items || [], data.options || {});
}

/**
 * إنشاء تقرير مالي للمخزون
 */
export async function generateInventoryFinancialReport(params = {}) {
    const { warehouseId, startDate, endDate, reportType = 'summary' } = params;

    // في الإنتاج: إنشاء التقرير من البيانات الفعلية
    return {
        reportType,
        period: { startDate, endDate },
        warehouse: warehouseId,
        generatedAt: new Date().toISOString(),
        data: {}
    };
}

// ==================== React Hook للتكامل المالي ====================

/**
 * Hook لحساب التأثير المالي
 */
export function useFinancialImpact(items) {
    const calculator = new FinancialImpactCalculator();

    if (!items || items.length === 0) {
        return {
            impact: null,
            isCalculating: false,
            error: null
        };
    }

    try {
        const impact = calculator.calculateExchangeImpact(items);
        return {
            impact,
            isCalculating: false,
            error: null
        };
    } catch (error) {
        return {
            impact: null,
            isCalculating: false,
            error: error.message
        };
    }
}

// تصدير المحسوب
export const financialCalculator = new FinancialImpactCalculator();

export default FinancialImpactCalculator;
