/**
 * Telegram Bot Integration
 * نظام التكامل مع تيليجرام للتنبيهات والتأكيدات
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Store pending confirmations
const pendingConfirmations = new Map();

/**
 * Send a message to Telegram
 * @param {string} message - Message to send
 * @param {object} options - Additional options (parse_mode, reply_markup, etc.)
 */
async function sendMessage(message, options = {}) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' ||
        !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') {
        // Silent return when not configured - avoid console spam
        return { success: false, error: 'Telegram not configured', notConfigured: true };
    }

    try {
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                ...options
            })
        });

        const data = await response.json();
        return { success: data.ok, messageId: data.result?.message_id, data };
    } catch (error) {
        console.error('Telegram send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send an alert with confirmation buttons
 * @param {object} issue - Issue details
 * @returns {Promise<object>} Result with confirmation ID
 */
async function sendAlertWithConfirmation(issue) {
    const confirmationId = `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = `
<b>🚨 تنبيه: تم اكتشاف مشكلة</b>

<b>النوع:</b> ${issue.type}
<b>الخطورة:</b> ${getSeverityEmoji(issue.severity)} ${issue.severity}
<b>الموقع:</b> <code>${issue.location}</code>

<b>الوصف:</b>
${issue.description}

<b>الحل المقترح:</b>
${issue.suggestedFix}

<b>معرف التأكيد:</b> <code>${confirmationId}</code>

للموافقة أرسل: <code>/approve ${confirmationId}</code>
للرفض أرسل: <code>/reject ${confirmationId}</code>
`;

    const result = await sendMessage(message, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ موافق - نفذ الإصلاح', callback_data: `approve_${confirmationId}` },
                    { text: '❌ رفض', callback_data: `reject_${confirmationId}` }
                ],
                [
                    { text: '📋 عرض التفاصيل', callback_data: `details_${confirmationId}` },
                    { text: '⏸️ تأجيل', callback_data: `postpone_${confirmationId}` }
                ]
            ]
        }
    });

    if (result.success) {
        pendingConfirmations.set(confirmationId, {
            issue,
            messageId: result.messageId,
            createdAt: new Date(),
            status: 'pending'
        });
    }

    return { ...result, confirmationId };
}

/**
 * Send a status update
 * @param {string} status - Status type (success, error, info, warning)
 * @param {string} title - Title
 * @param {string} details - Details
 */
async function sendStatusUpdate(status, title, details) {
    const emoji = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
        fix: '🔧',
        scan: '🔍'
    };

    const message = `
<b>${emoji[status] || 'ℹ️'} ${title}</b>

${details}

<i>الوقت: ${new Date().toLocaleString('ar-SA')}</i>
`;

    return sendMessage(message);
}

/**
 * Send daily report
 * @param {object} report - Report data
 */
async function sendDailyReport(report) {
    const message = `
<b>📊 التقرير اليومي - نظام المراقبة الذكي</b>

<b>📈 ملخص المسح:</b>
• إجمالي الفحوصات: ${report.totalScans}
• المشاكل المكتشفة: ${report.issuesFound}
• المشاكل المحلولة: ${report.issuesFixed}
• المشاكل المعلقة: ${report.pendingIssues}

<b>🔴 المشاكل الحرجة:</b> ${report.criticalIssues}
<b>🟡 المشاكل المتوسطة:</b> ${report.mediumIssues}
<b>🟢 المشاكل البسيطة:</b> ${report.lowIssues}

<b>📊 أداء النظام:</b>
• وقت التشغيل: ${report.uptime}
• استخدام الذاكرة: ${report.memoryUsage}
• سرعة الاستجابة: ${report.responseTime}

<b>🔧 الإصلاحات التلقائية:</b> ${report.autoFixes}

<i>التقرير التالي: غداً الساعة 9:00 صباحاً</i>
`;

    return sendMessage(message);
}

/**
 * Get pending confirmation by ID
 * @param {string} confirmationId - Confirmation ID
 */
function getPendingConfirmation(confirmationId) {
    return pendingConfirmations.get(confirmationId);
}

/**
 * Update confirmation status
 * @param {string} confirmationId - Confirmation ID
 * @param {string} status - New status (approved, rejected, postponed)
 */
function updateConfirmationStatus(confirmationId, status) {
    const confirmation = pendingConfirmations.get(confirmationId);
    if (confirmation) {
        confirmation.status = status;
        confirmation.updatedAt = new Date();
        pendingConfirmations.set(confirmationId, confirmation);
        return true;
    }
    return false;
}

/**
 * Get all pending confirmations
 */
function getAllPendingConfirmations() {
    const result = [];
    pendingConfirmations.forEach((value, key) => {
        if (value.status === 'pending') {
            result.push({ id: key, ...value });
        }
    });
    return result;
}

/**
 * Clean old confirmations (older than 24 hours)
 */
function cleanOldConfirmations() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    pendingConfirmations.forEach((value, key) => {
        if (value.createdAt < dayAgo) {
            pendingConfirmations.delete(key);
        }
    });
}

function getSeverityEmoji(severity) {
    const emojis = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
    };
    return emojis[severity?.toLowerCase()] || '⚪';
}

// Clean old confirmations every hour
setInterval(cleanOldConfirmations, 60 * 60 * 1000);

module.exports = {
    sendMessage,
    sendAlertWithConfirmation,
    sendStatusUpdate,
    sendDailyReport,
    getPendingConfirmation,
    updateConfirmationStatus,
    getAllPendingConfirmations,
    cleanOldConfirmations,
    pendingConfirmations
};
