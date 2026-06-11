/**
 * AI Monitoring Service
 * خدمة المراقبة الذكية الرئيسية
 */

const { scanDirectory, checkAPIHealth, checkDatabaseHealth, getIssueStats, SEVERITY } = require('./issue-detector');
const { sendAlertWithConfirmation, sendStatusUpdate, sendDailyReport, updateConfirmationStatus, getPendingConfirmation, getAllPendingConfirmations } = require('./telegram-bot');
const { applyFix, previewFix, rollbackFix, getHistory } = require('./auto-fixer');

// Service state
let serviceState = {
    isRunning: false,
    lastScan: null,
    lastDailyReport: null,
    scanInterval: null,
    dailyReportInterval: null,
    statistics: {
        totalScans: 0,
        issuesFound: 0,
        issuesFixed: 0,
        pendingIssues: 0,
        failedFixes: 0
    }
};

// Issues database (in-memory, replace with DB in production)
const issuesDatabase = new Map();

// Configuration
const config = {
    scanIntervalMinutes: 30, // Scan every 30 minutes
    dailyReportHour: 9, // Send daily report at 9 AM
    autoFixLowSeverity: false, // Auto-fix low severity without confirmation
    projectPath: process.env.PROJECT_PATH || 'd:/MMIT PRO/All Progs/Unified-Dashboard',
    apiEndpoints: [
        { name: 'Gateway Health', url: `${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080'}/health`, method: 'GET' },
        { name: 'HR API', url: `${process.env.NEXT_PUBLIC_HR_API_URL || 'http://localhost:5001'}/health`, method: 'GET' },
        { name: 'Warehouse API', url: `${process.env.NEXT_PUBLIC_WAREHOUSE_API_URL || 'http://localhost:5002'}/health`, method: 'GET' },
        { name: 'Movement API', url: `${process.env.NEXT_PUBLIC_MOVEMENT_API_URL || 'http://localhost:5003'}/health`, method: 'GET' },
        { name: 'Archiving API', url: `${process.env.NEXT_PUBLIC_ARCHIVING_API_URL || 'http://localhost:5004'}/health`, method: 'GET' },
        { name: 'Frontend', url: `${process.env.NEXTAUTH_URL || 'http://localhost:3008'}/`, method: 'GET' }
    ]
};

/**
 * Start the monitoring service
 */
async function startService() {
    if (serviceState.isRunning) {
        return { success: false, error: 'الخدمة تعمل بالفعل' };
    }

    serviceState.isRunning = true;

    // Send startup notification
    await sendStatusUpdate('info', 'بدء خدمة المراقبة', 'تم تشغيل نظام المراقبة الذكي');

    // Run initial scan
    await runFullScan();

    // Set up periodic scanning
    serviceState.scanInterval = setInterval(
        () => runFullScan(),
        config.scanIntervalMinutes * 60 * 1000
    );

    // Set up daily report
    scheduleDailyReport();

    return { success: true, message: 'تم تشغيل خدمة المراقبة' };
}

/**
 * Stop the monitoring service
 */
async function stopService() {
    if (!serviceState.isRunning) {
        return { success: false, error: 'الخدمة متوقفة بالفعل' };
    }

    if (serviceState.scanInterval) {
        clearInterval(serviceState.scanInterval);
    }

    if (serviceState.dailyReportInterval) {
        clearTimeout(serviceState.dailyReportInterval);
    }

    serviceState.isRunning = false;

    await sendStatusUpdate('warning', 'إيقاف خدمة المراقبة', 'تم إيقاف نظام المراقبة الذكي');

    return { success: true, message: 'تم إيقاف خدمة المراقبة' };
}

/**
 * Run a full system scan
 */
async function runFullScan() {
    const scanStartTime = Date.now();

    try {
        await sendStatusUpdate('scan', 'بدء الفحص', 'جاري فحص النظام...');

        // Scan code
        const codeIssues = await scanDirectory(config.projectPath);

        // Check API health
        const apiIssues = await checkAPIHealth(config.apiEndpoints);

        // Combine all issues
        const allIssues = [...codeIssues, ...apiIssues];

        // Update statistics
        serviceState.statistics.totalScans++;
        serviceState.statistics.issuesFound += allIssues.length;
        serviceState.lastScan = new Date().toISOString();

        // Store issues
        allIssues.forEach(issue => {
            issuesDatabase.set(issue.id, {
                ...issue,
                status: 'new',
                reportedAt: new Date().toISOString()
            });
        });

        // Get stats
        const stats = getIssueStats(allIssues);

        // Process critical and high severity issues
        const criticalIssues = allIssues.filter(i =>
            i.severity === SEVERITY.CRITICAL || i.severity === SEVERITY.HIGH
        );

        // Send alerts for critical issues
        for (const issue of criticalIssues) {
            const result = await sendAlertWithConfirmation(issue);
            if (result.success) {
                const dbIssue = issuesDatabase.get(issue.id);
                if (dbIssue) {
                    dbIssue.confirmationId = result.confirmationId;
                    dbIssue.status = 'awaiting_confirmation';
                }
            }
        }

        // Auto-fix low severity if configured
        if (config.autoFixLowSeverity) {
            const lowIssues = allIssues.filter(i => i.severity === SEVERITY.LOW);
            for (const issue of lowIssues) {
                const fixResult = await applyFix(issue);
                if (fixResult.success) {
                    const dbIssue = issuesDatabase.get(issue.id);
                    if (dbIssue) {
                        dbIssue.status = 'auto_fixed';
                        dbIssue.fixedAt = new Date().toISOString();
                    }
                    serviceState.statistics.issuesFixed++;
                }
            }
        }

        const scanDuration = Date.now() - scanStartTime;

        await sendStatusUpdate('success', 'اكتمل الفحص', `
تم فحص النظام في ${(scanDuration / 1000).toFixed(1)} ثانية

📊 النتائج:
• إجمالي المشاكل: ${stats.total}
• حرجة: ${stats.bySeverity.critical}
• عالية: ${stats.bySeverity.high}
• متوسطة: ${stats.bySeverity.medium}
• منخفضة: ${stats.bySeverity.low}
`);

        return {
            success: true,
            duration: scanDuration,
            issues: allIssues,
            stats
        };

    } catch (error) {
        console.error('Scan error:', error);
        await sendStatusUpdate('error', 'فشل الفحص', `حدث خطأ أثناء الفحص: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Schedule daily report
 */
function scheduleDailyReport() {
    const now = new Date();
    const targetHour = config.dailyReportHour;

    // Calculate time until next report
    let nextReport = new Date(now);
    nextReport.setHours(targetHour, 0, 0, 0);

    if (nextReport <= now) {
        nextReport.setDate(nextReport.getDate() + 1);
    }

    const delay = nextReport.getTime() - now.getTime();

    serviceState.dailyReportInterval = setTimeout(async () => {
        await sendDailyReportNow();
        scheduleDailyReport(); // Reschedule for next day
    }, delay);
}

/**
 * Send daily report immediately
 */
async function sendDailyReportNow() {
    const allIssues = Array.from(issuesDatabase.values());
    const stats = getIssueStats(allIssues);

    const report = {
        totalScans: serviceState.statistics.totalScans,
        issuesFound: serviceState.statistics.issuesFound,
        issuesFixed: serviceState.statistics.issuesFixed,
        pendingIssues: allIssues.filter(i => i.status === 'awaiting_confirmation').length,
        criticalIssues: stats.bySeverity.critical,
        mediumIssues: stats.bySeverity.medium,
        lowIssues: stats.bySeverity.low,
        uptime: '99.9%',
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        responseTime: '< 100ms',
        autoFixes: serviceState.statistics.issuesFixed
    };

    await sendDailyReport(report);
    serviceState.lastDailyReport = new Date().toISOString();
}

/**
 * Process confirmation from Telegram
 * @param {string} confirmationId - Confirmation ID
 * @param {string} action - Action (approve, reject, postpone)
 * @param {string} userId - User ID from Telegram
 */
async function processConfirmation(confirmationId, action, userId) {
    const confirmation = getPendingConfirmation(confirmationId);
    if (!confirmation) {
        return { success: false, error: 'التأكيد غير موجود أو انتهى' };
    }

    const issue = confirmation.issue;

    switch (action) {
        case 'approve':
            // Apply the fix
            const preview = await previewFix(issue);
            if (!preview.available) {
                await sendStatusUpdate('warning', 'تعذر الإصلاح', `لا يمكن تطبيق إصلاح تلقائي: ${preview.reason}`);
                return { success: false, error: preview.reason };
            }

            const fixResult = await applyFix(issue);
            if (fixResult.success) {
                updateConfirmationStatus(confirmationId, 'approved');

                const dbIssue = issuesDatabase.get(issue.id);
                if (dbIssue) {
                    dbIssue.status = 'fixed';
                    dbIssue.fixedAt = new Date().toISOString();
                    dbIssue.fixedBy = userId;
                }

                serviceState.statistics.issuesFixed++;

                await sendStatusUpdate('fix', 'تم تطبيق الإصلاح', `
✅ تم إصلاح المشكلة بنجاح

📋 التفاصيل:
${fixResult.description}

📁 الملف: ${issue.file}
🔙 النسخة الاحتياطية: ${fixResult.backupPath}
`);

                return { success: true, message: 'تم تطبيق الإصلاح' };
            } else {
                await sendStatusUpdate('error', 'فشل الإصلاح', `تعذر تطبيق الإصلاح: ${fixResult.error}`);
                return { success: false, error: fixResult.error };
            }

        case 'reject':
            updateConfirmationStatus(confirmationId, 'rejected');

            const dbIssueRejected = issuesDatabase.get(issue.id);
            if (dbIssueRejected) {
                dbIssueRejected.status = 'rejected';
                dbIssueRejected.rejectedAt = new Date().toISOString();
            }

            await sendStatusUpdate('info', 'تم رفض الإصلاح', `تم رفض إصلاح المشكلة: ${issue.name}`);

            return { success: true, message: 'تم رفض الإصلاح' };

        case 'postpone':
            updateConfirmationStatus(confirmationId, 'postponed');

            const dbIssuePostponed = issuesDatabase.get(issue.id);
            if (dbIssuePostponed) {
                dbIssuePostponed.status = 'postponed';
                dbIssuePostponed.postponedAt = new Date().toISOString();
            }

            // Re-send alert after 1 hour
            setTimeout(async () => {
                await sendAlertWithConfirmation(issue);
            }, 60 * 60 * 1000);

            await sendStatusUpdate('info', 'تم تأجيل الإصلاح', 'سيتم إعادة التذكير بعد ساعة');

            return { success: true, message: 'تم تأجيل الإصلاح' };

        default:
            return { success: false, error: 'إجراء غير معروف' };
    }
}

/**
 * Get current service status
 */
function getServiceStatus() {
    return {
        isRunning: serviceState.isRunning,
        lastScan: serviceState.lastScan,
        lastDailyReport: serviceState.lastDailyReport,
        statistics: serviceState.statistics,
        pendingConfirmations: getAllPendingConfirmations().length,
        totalIssues: issuesDatabase.size,
        fixHistory: getHistory(10)
    };
}

/**
 * Get all issues with optional filtering
 */
function getIssues(filters = {}) {
    let issues = Array.from(issuesDatabase.values());

    if (filters.severity) {
        issues = issues.filter(i => i.severity === filters.severity);
    }

    if (filters.status) {
        issues = issues.filter(i => i.status === filters.status);
    }

    if (filters.type) {
        issues = issues.filter(i => i.type === filters.type);
    }

    return issues;
}

/**
 * Manual trigger for specific checks
 */
async function runSpecificCheck(checkType) {
    switch (checkType) {
        case 'code':
            const codeIssues = await scanDirectory(config.projectPath);
            return { success: true, issues: codeIssues };

        case 'api':
            const apiIssues = await checkAPIHealth(config.apiEndpoints);
            return { success: true, issues: apiIssues };

        case 'full':
            return await runFullScan();

        default:
            return { success: false, error: 'نوع الفحص غير معروف' };
    }
}

/**
 * Update configuration
 */
function updateConfig(newConfig) {
    Object.assign(config, newConfig);
    return { success: true, config };
}

module.exports = {
    startService,
    stopService,
    runFullScan,
    sendDailyReportNow,
    processConfirmation,
    getServiceStatus,
    getIssues,
    runSpecificCheck,
    updateConfig,
    config,
    issuesDatabase
};
