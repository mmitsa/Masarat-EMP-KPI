/**
 * Issue Detection Engine
 * محرك الكشف عن المشاكل في الكود وقواعد البيانات
 */

const fs = require('fs').promises;
const path = require('path');

// Issue types
const ISSUE_TYPES = {
    CODE_ERROR: 'code_error',
    SECURITY_VULNERABILITY: 'security_vulnerability',
    PERFORMANCE_ISSUE: 'performance_issue',
    DATABASE_ISSUE: 'database_issue',
    API_ERROR: 'api_error',
    DEPENDENCY_ISSUE: 'dependency_issue',
    CONFIGURATION_ERROR: 'configuration_error'
};

// Severity levels
const SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

// Detection rules
const detectionRules = {
    // Security vulnerabilities
    security: [
        {
            id: 'SEC001',
            name: 'SQL Injection Risk',
            pattern: /(\$\{.*\}|`.*\$\{.*\}.*`)\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
            severity: SEVERITY.CRITICAL,
            description: 'احتمال وجود ثغرة SQL Injection',
            fix: 'استخدم Parameterized Queries بدلاً من تضمين المتغيرات مباشرة'
        },
        {
            id: 'SEC002',
            name: 'Exposed API Keys',
            pattern: /(api[_-]?key|apikey|secret[_-]?key|password|token)\s*[:=]\s*['"`][^'"`]{10,}['"`]/gi,
            severity: SEVERITY.CRITICAL,
            description: 'مفاتيح API أو كلمات مرور مكشوفة في الكود',
            fix: 'انقل المفاتيح إلى متغيرات البيئة (.env)'
        },
        {
            id: 'SEC003',
            name: 'Eval Usage',
            pattern: /\beval\s*\(/gi,
            severity: SEVERITY.HIGH,
            description: 'استخدام eval() خطير أمنياً',
            fix: 'استخدم بدائل آمنة مثل JSON.parse أو Function constructor'
        },
        {
            id: 'SEC004',
            name: 'Insecure HTTP',
            pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/gi,
            severity: SEVERITY.MEDIUM,
            description: 'استخدام HTTP غير آمن بدلاً من HTTPS',
            fix: 'استبدل http:// بـ https://'
        }
    ],

    // Performance issues
    performance: [
        {
            id: 'PERF001',
            name: 'N+1 Query Pattern',
            pattern: /for\s*\([^)]+\)\s*\{[^}]*await\s+[^}]*query|forEach\s*\([^)]+\)\s*=>\s*\{[^}]*await/gi,
            severity: SEVERITY.HIGH,
            description: 'نمط N+1 Query - استعلامات متعددة داخل حلقة',
            fix: 'استخدم JOIN أو batch queries بدلاً من استعلامات منفصلة'
        },
        {
            id: 'PERF002',
            name: 'Missing Index Hint',
            pattern: /SELECT\s+\*\s+FROM\s+\w+\s+WHERE\s+(?!.*INDEX)/gi,
            severity: SEVERITY.MEDIUM,
            description: 'استعلام SELECT * بدون فهرس واضح',
            fix: 'أضف فهارس للحقول المستخدمة في WHERE'
        },
        {
            id: 'PERF003',
            name: 'Large Array in State',
            pattern: /useState\s*\(\s*\[\s*\{[^}]{500,}/gi,
            severity: SEVERITY.MEDIUM,
            description: 'مصفوفة كبيرة في React State',
            fix: 'استخدم pagination أو virtualization للبيانات الكبيرة'
        }
    ],

    // Code quality
    quality: [
        {
            id: 'CODE001',
            name: 'Console.log in Production',
            pattern: /console\.(log|debug|info)\s*\(/gi,
            severity: SEVERITY.LOW,
            description: 'وجود console.log في الكود',
            fix: 'احذف أو استبدل بـ proper logging'
        },
        {
            id: 'CODE002',
            name: 'Empty Catch Block',
            pattern: /catch\s*\([^)]*\)\s*\{\s*\}/gi,
            severity: SEVERITY.MEDIUM,
            description: 'كتلة catch فارغة - الأخطاء تُتجاهل',
            fix: 'أضف معالجة للأخطاء أو logging'
        },
        {
            id: 'CODE003',
            name: 'Hardcoded Credentials',
            pattern: /(password|passwd|pwd)\s*[:=]\s*['"`][^'"`]+['"`]/gi,
            severity: SEVERITY.CRITICAL,
            description: 'كلمات مرور ثابتة في الكود',
            fix: 'استخدم متغيرات البيئة لتخزين كلمات المرور'
        },
        {
            id: 'CODE004',
            name: 'TODO/FIXME Comments',
            pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)[:.]?\s*.+/gi,
            severity: SEVERITY.LOW,
            description: 'تعليقات TODO/FIXME غير محلولة',
            fix: 'راجع وحل هذه المهام المعلقة'
        }
    ],

    // Database issues
    database: [
        {
            id: 'DB001',
            name: 'Missing Transaction',
            pattern: /(INSERT|UPDATE|DELETE)[^;]+;\s*(INSERT|UPDATE|DELETE)/gi,
            severity: SEVERITY.HIGH,
            description: 'عمليات متعددة بدون Transaction',
            fix: 'أضف BEGIN TRANSACTION و COMMIT'
        },
        {
            id: 'DB002',
            name: 'SELECT * Usage',
            pattern: /SELECT\s+\*\s+FROM/gi,
            severity: SEVERITY.LOW,
            description: 'استخدام SELECT * - قد يؤثر على الأداء',
            fix: 'حدد الحقول المطلوبة فقط'
        }
    ],

    // API issues
    api: [
        {
            id: 'API001',
            name: 'Missing Error Handler',
            pattern: /app\.(get|post|put|delete)\s*\([^,]+,\s*async\s*\([^)]*\)\s*=>\s*\{(?![\s\S]*try\s*\{)/gi,
            severity: SEVERITY.HIGH,
            description: 'API endpoint بدون معالجة أخطاء',
            fix: 'أضف try-catch block لمعالجة الأخطاء'
        },
        {
            id: 'API002',
            name: 'Missing Input Validation',
            pattern: /req\.body\.(?!.*validate|.*schema|.*joi|.*yup)/gi,
            severity: SEVERITY.HIGH,
            description: 'استخدام req.body بدون validation',
            fix: 'أضف validation للمدخلات باستخدام Joi أو Yup'
        }
    ]
};

/**
 * Scan a file for issues
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @returns {Array} Found issues
 */
function scanFileContent(filePath, content) {
    const issues = [];
    const ext = path.extname(filePath).toLowerCase();

    // Skip non-code files
    if (!['.js', '.jsx', '.ts', '.tsx', '.cs', '.sql', '.json'].includes(ext)) {
        return issues;
    }

    // Apply all rules
    Object.entries(detectionRules).forEach(([category, rules]) => {
        rules.forEach(rule => {
            const matches = content.match(rule.pattern);
            if (matches) {
                // Find line numbers for each match
                const lines = content.split('\n');
                matches.forEach(match => {
                    let lineNumber = 0;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes(match.trim().substring(0, 50))) {
                            lineNumber = i + 1;
                            break;
                        }
                    }

                    issues.push({
                        id: `${rule.id}_${Date.now()}`,
                        ruleId: rule.id,
                        type: category,
                        name: rule.name,
                        severity: rule.severity,
                        description: rule.description,
                        suggestedFix: rule.fix,
                        location: `${filePath}:${lineNumber}`,
                        file: filePath,
                        line: lineNumber,
                        match: match.substring(0, 100),
                        detectedAt: new Date().toISOString()
                    });
                });
            }
        });
    });

    return issues;
}

/**
 * Scan a directory recursively
 * @param {string} dirPath - Directory path
 * @param {Array} excludePaths - Paths to exclude
 * @returns {Promise<Array>} All found issues
 */
async function scanDirectory(dirPath, excludePaths = ['node_modules', '.next', '.git', 'dist', 'build']) {
    const issues = [];

    async function scanRecursive(currentPath) {
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                // Skip excluded paths
                if (excludePaths.some(ex => fullPath.includes(ex))) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await scanRecursive(fullPath);
                } else if (entry.isFile()) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const fileIssues = scanFileContent(fullPath, content);
                        issues.push(...fileIssues);
                    } catch (readError) {
                        // Skip files that can't be read
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning ${currentPath}:`, error.message);
        }
    }

    await scanRecursive(dirPath);
    return issues;
}

/**
 * Check database health
 * @param {object} pool - Database pool connection
 * @returns {Promise<Array>} Database issues
 */
async function checkDatabaseHealth(pool) {
    const issues = [];

    try {
        // Check for slow queries (if supported)
        const slowQueryCheck = `
            SELECT query, calls, mean_time, total_time
            FROM pg_stat_statements
            WHERE mean_time > 1000
            ORDER BY mean_time DESC
            LIMIT 10
        `;

        // Check for missing indexes
        const missingIndexCheck = `
            SELECT schemaname, tablename,
                   pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size,
                   seq_scan, idx_scan
            FROM pg_stat_user_tables
            WHERE seq_scan > idx_scan * 10
            AND seq_scan > 1000
        `;

        // Check for table bloat
        const bloatCheck = `
            SELECT schemaname, tablename,
                   pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
                   n_dead_tup as dead_tuples
            FROM pg_stat_user_tables
            WHERE n_dead_tup > 10000
        `;

        // Execute checks if pool is available
        if (pool) {
            try {
                const bloatResult = await pool.query(bloatCheck);
                bloatResult.rows.forEach(row => {
                    issues.push({
                        id: `DB_BLOAT_${row.tablename}_${Date.now()}`,
                        type: ISSUE_TYPES.DATABASE_ISSUE,
                        name: 'Table Bloat Detected',
                        severity: SEVERITY.MEDIUM,
                        description: `الجدول ${row.tablename} يحتوي على ${row.dead_tuples} صفوف ميتة`,
                        suggestedFix: `قم بتشغيل VACUUM ANALYZE ${row.schemaname}.${row.tablename}`,
                        location: `${row.schemaname}.${row.tablename}`,
                        detectedAt: new Date().toISOString()
                    });
                });
            } catch (e) {
                // Query might not be available
            }
        }

    } catch (error) {
        console.error('Database health check error:', error);
    }

    return issues;
}

/**
 * Check API endpoints health
 * @param {Array} endpoints - List of endpoints to check
 * @returns {Promise<Array>} API issues
 */
async function checkAPIHealth(endpoints = []) {
    const issues = [];

    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            const response = await fetch(endpoint.url, {
                method: endpoint.method || 'GET',
                timeout: 10000
            });
            const responseTime = Date.now() - startTime;

            // Check response time
            if (responseTime > 3000) {
                issues.push({
                    id: `API_SLOW_${Date.now()}`,
                    type: ISSUE_TYPES.API_ERROR,
                    name: 'Slow API Response',
                    severity: SEVERITY.MEDIUM,
                    description: `الـ endpoint ${endpoint.name} بطيء (${responseTime}ms)`,
                    suggestedFix: 'راجع الـ endpoint وحسّن الأداء',
                    location: endpoint.url,
                    detectedAt: new Date().toISOString()
                });
            }

            // Check status code
            if (!response.ok) {
                issues.push({
                    id: `API_ERROR_${Date.now()}`,
                    type: ISSUE_TYPES.API_ERROR,
                    name: 'API Error Response',
                    severity: response.status >= 500 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
                    description: `الـ endpoint ${endpoint.name} يُرجع خطأ ${response.status}`,
                    suggestedFix: 'راجع الـ logs وأصلح المشكلة',
                    location: endpoint.url,
                    detectedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            issues.push({
                id: `API_UNREACHABLE_${Date.now()}`,
                type: ISSUE_TYPES.API_ERROR,
                name: 'API Unreachable',
                severity: SEVERITY.CRITICAL,
                description: `لا يمكن الوصول إلى ${endpoint.name}: ${error.message}`,
                suggestedFix: 'تأكد من تشغيل الخدمة والاتصال بالشبكة',
                location: endpoint.url,
                detectedAt: new Date().toISOString()
            });
        }
    }

    return issues;
}

/**
 * Get issue statistics
 * @param {Array} issues - List of issues
 * @returns {object} Statistics
 */
function getIssueStats(issues) {
    return {
        total: issues.length,
        bySeverity: {
            critical: issues.filter(i => i.severity === SEVERITY.CRITICAL).length,
            high: issues.filter(i => i.severity === SEVERITY.HIGH).length,
            medium: issues.filter(i => i.severity === SEVERITY.MEDIUM).length,
            low: issues.filter(i => i.severity === SEVERITY.LOW).length
        },
        byType: issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {})
    };
}

module.exports = {
    ISSUE_TYPES,
    SEVERITY,
    detectionRules,
    scanFileContent,
    scanDirectory,
    checkDatabaseHealth,
    checkAPIHealth,
    getIssueStats
};
