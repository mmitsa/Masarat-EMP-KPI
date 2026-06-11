/**
 * Auto-Fix Engine
 * محرك الإصلاح التلقائي للمشاكل
 */

const fs = require('fs').promises;
const path = require('path');

// Fix history for rollback
const fixHistory = [];
const MAX_HISTORY = 100;

// Fix strategies for different issue types
const fixStrategies = {
    // Security fixes
    SEC001: async (issue, content) => {
        // SQL Injection - Convert to parameterized query
        // This is a simplified example - real implementation would be more sophisticated
        const fixed = content.replace(
            /`([^`]*)\$\{(\w+)\}([^`]*)`/g,
            (match, before, variable, after) => {
                return `\`${before}$\${${variable}}${after}\``; // Add parameterization hint
            }
        );
        return { fixed, description: 'تم إضافة تلميح للاستعلامات المعلمة' };
    },

    SEC002: async (issue, content) => {
        // Exposed API Keys - Move to environment variable
        const fixed = content.replace(
            /(api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
            (match, keyName) => {
                const envVar = keyName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                return `${keyName}: process.env.${envVar}`;
            }
        );
        return { fixed, description: 'تم نقل المفاتيح إلى متغيرات البيئة' };
    },

    SEC004: async (issue, content) => {
        // HTTP to HTTPS
        const fixed = content.replace(
            /http:\/\/(?!localhost|127\.0\.0\.1)/gi,
            'https://'
        );
        return { fixed, description: 'تم تحويل HTTP إلى HTTPS' };
    },

    // Code quality fixes
    CODE001: async (issue, content) => {
        // Remove console.log
        const fixed = content.replace(
            /^\s*console\.(log|debug|info)\s*\([^)]*\);?\s*$/gm,
            ''
        );
        return { fixed, description: 'تم حذف console.log statements' };
    },

    CODE002: async (issue, content) => {
        // Add error handling to empty catch blocks
        const fixed = content.replace(
            /catch\s*\((\w+)\)\s*\{\s*\}/g,
            'catch ($1) { console.error("Error:", $1); }'
        );
        return { fixed, description: 'تم إضافة معالجة للأخطاء في catch blocks' };
    },

    // Performance fixes
    PERF002: async (issue, content) => {
        // Add comment about SELECT * usage
        const fixed = content.replace(
            /(SELECT\s+\*\s+FROM\s+)(\w+)/gi,
            '/* TODO: Replace SELECT * with specific columns */ $1$2'
        );
        return { fixed, description: 'تم إضافة تذكير لتحديد الحقول المطلوبة' };
    },

    // Database fixes
    DB002: async (issue, content) => {
        // Add comment for SELECT * optimization
        const fixed = content.replace(
            /(SELECT\s+\*\s+FROM)/gi,
            '-- OPTIMIZATION: Consider selecting specific columns\n$1'
        );
        return { fixed, description: 'تم إضافة ملاحظة تحسين للاستعلام' };
    }
};

/**
 * Apply a fix to an issue
 * @param {object} issue - The issue to fix
 * @returns {Promise<object>} Fix result
 */
async function applyFix(issue) {
    try {
        const filePath = issue.file;

        // Read current file content
        const originalContent = await fs.readFile(filePath, 'utf-8');

        // Get fix strategy
        const strategy = fixStrategies[issue.ruleId];
        if (!strategy) {
            return {
                success: false,
                error: 'لا توجد استراتيجية إصلاح لهذا النوع من المشاكل',
                requiresManualFix: true
            };
        }

        // Apply fix
        const { fixed, description } = await strategy(issue, originalContent);

        // Check if any changes were made
        if (fixed === originalContent) {
            return {
                success: false,
                error: 'لم يتم العثور على تغييرات للتطبيق',
                requiresManualFix: true
            };
        }

        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, originalContent);

        // Apply changes
        await fs.writeFile(filePath, fixed);

        // Record in history
        addToHistory({
            issueId: issue.id,
            file: filePath,
            backupPath,
            originalContent,
            newContent: fixed,
            description,
            appliedAt: new Date().toISOString()
        });

        return {
            success: true,
            description,
            backupPath,
            changes: {
                before: originalContent.length,
                after: fixed.length,
                diff: fixed.length - originalContent.length
            }
        };

    } catch (error) {
        console.error('Fix application error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Rollback a fix
 * @param {string} issueId - Issue ID to rollback
 * @returns {Promise<object>} Rollback result
 */
async function rollbackFix(issueId) {
    try {
        const historyEntry = fixHistory.find(h => h.issueId === issueId);
        if (!historyEntry) {
            return { success: false, error: 'لم يتم العثور على الإصلاح في السجل' };
        }

        // Restore original content
        await fs.writeFile(historyEntry.file, historyEntry.originalContent);

        // Remove backup file
        try {
            await fs.unlink(historyEntry.backupPath);
        } catch (e) {
            // Backup might already be removed
        }

        // Mark as rolled back
        historyEntry.rolledBack = true;
        historyEntry.rolledBackAt = new Date().toISOString();

        return {
            success: true,
            message: 'تم التراجع عن الإصلاح بنجاح'
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate fix preview without applying
 * @param {object} issue - The issue
 * @returns {Promise<object>} Preview of the fix
 */
async function previewFix(issue) {
    try {
        const filePath = issue.file;
        const originalContent = await fs.readFile(filePath, 'utf-8');

        const strategy = fixStrategies[issue.ruleId];
        if (!strategy) {
            return {
                available: false,
                reason: 'لا توجد استراتيجية إصلاح تلقائي لهذا النوع'
            };
        }

        const { fixed, description } = await strategy(issue, originalContent);

        // Generate diff
        const originalLines = originalContent.split('\n');
        const fixedLines = fixed.split('\n');
        const diff = [];

        for (let i = 0; i < Math.max(originalLines.length, fixedLines.length); i++) {
            if (originalLines[i] !== fixedLines[i]) {
                diff.push({
                    line: i + 1,
                    original: originalLines[i] || '',
                    fixed: fixedLines[i] || ''
                });
            }
        }

        return {
            available: true,
            description,
            changesCount: diff.length,
            diff: diff.slice(0, 10), // Limit preview to 10 changes
            hasMore: diff.length > 10
        };

    } catch (error) {
        return {
            available: false,
            reason: error.message
        };
    }
}

/**
 * Add entry to fix history
 * @param {object} entry - History entry
 */
function addToHistory(entry) {
    fixHistory.unshift(entry);
    if (fixHistory.length > MAX_HISTORY) {
        fixHistory.pop();
    }
}

/**
 * Get fix history
 * @param {number} limit - Number of entries to return
 */
function getHistory(limit = 50) {
    return fixHistory.slice(0, limit);
}

/**
 * Batch fix multiple issues
 * @param {Array} issues - Issues to fix
 * @param {object} options - Options
 * @returns {Promise<object>} Batch fix result
 */
async function batchFix(issues, options = {}) {
    const results = {
        total: issues.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        details: []
    };

    // Group by file to minimize file operations
    const issuesByFile = {};
    issues.forEach(issue => {
        if (!issuesByFile[issue.file]) {
            issuesByFile[issue.file] = [];
        }
        issuesByFile[issue.file].push(issue);
    });

    // Process each file
    for (const [file, fileIssues] of Object.entries(issuesByFile)) {
        try {
            let content = await fs.readFile(file, 'utf-8');
            let fileModified = false;

            for (const issue of fileIssues) {
                if (!fixStrategies[issue.ruleId]) {
                    results.skipped++;
                    results.details.push({
                        issue: issue.id,
                        status: 'skipped',
                        reason: 'لا توجد استراتيجية إصلاح'
                    });
                    continue;
                }

                try {
                    const { fixed, description } = await fixStrategies[issue.ruleId](issue, content);
                    if (fixed !== content) {
                        content = fixed;
                        fileModified = true;
                        results.successful++;
                        results.details.push({
                            issue: issue.id,
                            status: 'success',
                            description
                        });
                    }
                } catch (e) {
                    results.failed++;
                    results.details.push({
                        issue: issue.id,
                        status: 'failed',
                        error: e.message
                    });
                }
            }

            // Save modified file
            if (fileModified) {
                const backupPath = `${file}.backup.batch.${Date.now()}`;
                const originalContent = await fs.readFile(file, 'utf-8');
                await fs.writeFile(backupPath, originalContent);
                await fs.writeFile(file, content);
            }

        } catch (error) {
            fileIssues.forEach(issue => {
                results.failed++;
                results.details.push({
                    issue: issue.id,
                    status: 'failed',
                    error: error.message
                });
            });
        }
    }

    return results;
}

/**
 * Clean old backup files
 * @param {string} directory - Directory to clean
 * @param {number} maxAgeDays - Maximum age in days
 */
async function cleanBackups(directory, maxAgeDays = 7) {
    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });
        const now = Date.now();
        const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
        let cleaned = 0;

        for (const entry of entries) {
            if (entry.isFile() && entry.name.includes('.backup.')) {
                const filePath = path.join(directory, entry.name);
                const stats = await fs.stat(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    cleaned++;
                }
            }
        }

        return { cleaned };
    } catch (error) {
        return { error: error.message };
    }
}

module.exports = {
    applyFix,
    rollbackFix,
    previewFix,
    getHistory,
    batchFix,
    cleanBackups,
    fixStrategies,
    fixHistory
};
