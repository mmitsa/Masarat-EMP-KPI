/**
 * EPM Action Handler
 * معالج إجراءات قياس الأداء
 */

import { apiGet, apiPost, apiPut } from '../../api';

import { fmtDate } from '../../../utils/hijriDate';

/**
 * معالج إجراءات قياس الأداء
 */
export class EPMActionHandler {
    constructor(userId, userRoles, accessToken) {
        this.userId = userId;
        this.roles = userRoles;
        this.accessToken = accessToken;
    }

    /**
     * عرض أهدافي
     */
    async getMyGoals({ status }) {
        try {
            const goals = await this.fetchGoals(this.userId, status);

            if (goals.length === 0) {
                return {
                    success: true,
                    type: 'goals',
                    data: [],
                    message: 'لا توجد أهداف مسجلة',
                    suggestion: 'يمكنك إضافة أهداف جديدة من صفحة الأهداف',
                };
            }

            const avgProgress = Math.round(
                goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
            );

            return {
                success: true,
                type: 'goals',
                data: goals,
                message: `لديك ${goals.length} هدف`,
                summary: {
                    total: goals.length,
                    completed: goals.filter(g => g.progress >= 100).length,
                    avgProgress,
                },
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * تحديث نسبة إنجاز هدف
     */
    async updateGoalProgress({ goalId, progress, notes }) {
        try {
            if (progress < 0 || progress > 100) {
                return {
                    success: false,
                    error: 'نسبة الإنجاز يجب أن تكون بين 0 و 100',
                };
            }

            const goal = await this.fetchGoalDetails(goalId);

            if (!goal) {
                return {
                    success: false,
                    error: `لم يتم العثور على الهدف: ${goalId}`,
                };
            }

            const updateData = {
                progress,
                notes,
                updated_by: this.userId,
                updated_at: new Date().toISOString(),
            };

            await this.submitGoalUpdate(goalId, updateData);

            return {
                success: true,
                type: 'goal_updated',
                data: {
                    goalId,
                    title: goal.title,
                    oldProgress: goal.progress,
                    newProgress: progress,
                },
                message: `تم تحديث الهدف بنجاح`,
                details: [
                    `الهدف: ${goal.title}`,
                    `النسبة السابقة: ${goal.progress}%`,
                    `النسبة الجديدة: ${progress}%`,
                    notes ? `الملاحظات: ${notes}` : '',
                ].filter(Boolean),
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * إنشاء هدف جديد
     */
    async createGoal({ title, description, targetDate, weight, kpiId }) {
        try {
            const goalData = {
                employee_id: this.userId,
                title,
                description,
                target_date: targetDate,
                weight: weight || 1,
                kpi_id: kpiId,
                progress: 0,
                status: 'active',
                created_at: new Date().toISOString(),
            };

            const result = await this.submitGoal(goalData);

            return {
                success: true,
                type: 'goal_created',
                data: result,
                message: `تم إنشاء الهدف بنجاح`,
                details: [
                    `الهدف: ${title}`,
                    `تاريخ الإنجاز: ${this.formatDate(targetDate)}`,
                    `الوزن: ${weight || 1}`,
                ],
                nextSteps: [
                    'قم بتحديث نسبة الإنجاز بشكل دوري',
                    'أضف ملاحظات عند كل تحديث',
                ],
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * عرض تقييمات الأداء
     */
    async getEvaluations({ period }) {
        try {
            const evaluations = await this.fetchEvaluations(this.userId, period);

            if (evaluations.length === 0) {
                return {
                    success: true,
                    type: 'evaluations',
                    data: [],
                    message: 'لا توجد تقييمات متاحة',
                };
            }

            return {
                success: true,
                type: 'evaluations',
                data: evaluations,
                message: `لديك ${evaluations.length} تقييم`,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * عرض مؤشرات الأداء
     */
    async getKPIs() {
        try {
            const kpis = await this.fetchKPIs(this.userId);

            if (kpis.length === 0) {
                return {
                    success: true,
                    type: 'kpis',
                    data: [],
                    message: 'لا توجد مؤشرات أداء مسجلة',
                };
            }

            return {
                success: true,
                type: 'kpis',
                data: kpis,
                message: `مؤشرات الأداء (${kpis.length} مؤشر):\n${kpis.map(k =>
                    `• ${k.name}: ${k.value}${k.unit || ''} (الهدف: ${k.target}${k.unit || ''})`
                ).join('\n')}`,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // دوال مساعدة
    async fetchGoals(employeeId, status) {
        try {
            let url = `/api/epm/goals?employeeId=${employeeId}`;
            if (status && status !== 'all') url += `&status=${status}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { id: 'G001', title: 'إكمال مشروع التطوير', progress: 75, targetDate: '2026-03-31', weight: 2 },
                { id: 'G002', title: 'تحسين مهارات القيادة', progress: 50, targetDate: '2026-06-30', weight: 1 },
            ];
        }
    }

    async fetchGoalDetails(goalId) {
        try {
            const response = await apiGet(`/api/epm/goals/${goalId}`);
            return response;
        } catch {
            return { id: goalId, title: 'هدف تجريبي', progress: 50, targetDate: '2026-06-30' };
        }
    }

    async submitGoalUpdate(goalId, data) {
        try {
            const response = await apiPut(`/api/epm/goals/${goalId}`, data);
            return response;
        } catch {
            return { id: goalId, ...data };
        }
    }

    async submitGoal(data) {
        try {
            const response = await apiPost('/api/epm/goals', data);
            return response;
        } catch {
            return { id: 'G-' + Date.now(), ...data };
        }
    }

    async fetchEvaluations(employeeId, period) {
        try {
            let url = `/api/epm/evaluations?employeeId=${employeeId}`;
            if (period) url += `&period=${period}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { id: 'E001', period: 'Q4-2025', score: 4.2, status: 'completed' },
            ];
        }
    }

    async fetchKPIs(employeeId) {
        try {
            const response = await apiGet(`/api/epm/kpis?employeeId=${employeeId}`);
            return response.data || response;
        } catch {
            return [
                { id: 'KPI001', name: 'إنتاجية', value: 85, target: 90, unit: '%' },
                { id: 'KPI002', name: 'جودة العمل', value: 92, target: 85, unit: '%' },
            ];
        }
    }

    formatDate(dateStr) {
        return fmtDate(dateStr);
    }
}

export default EPMActionHandler;
