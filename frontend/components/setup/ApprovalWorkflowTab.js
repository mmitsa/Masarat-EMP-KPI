import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../../context/NotificationContext';
import { JOB_TITLES } from '../../lib/permissions';
import { loadModuleWorkflows, saveModuleWorkflows, getWorkflowRoleOptions, generateStepId } from '../../lib/moduleApprovalWorkflows';
import { ContentCard, Button, Badge, Modal } from '../ui';
import Tabs from '../ui/Tabs';
import ApprovalWorkflowDiagram from './ApprovalWorkflowDiagram';
import PermissionGuard, { PermissionDenied } from '../PermissionGuard';
import api from '../../lib/api';
import useEmployeeSearch from '../../hooks/useEmployeeSearch';

// ============================================
// مكون الخطوة القابلة للسحب
// ============================================

function SortableStepItem({ step, index, onRemove, onToggleRequired }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    const getApproverName = (step) => {
        if (step.assignType === 'employee') {
            return step.assigneeName || step.roleId;
        }
        const role = Object.values(JOB_TITLES).find(r => r.id === step.roleId);
        return role?.nameAr || step.roleId;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border transition-all group
                ${isDragging
                    ? 'border-[var(--color-primary-500)] shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
        >
            {/* مقبض السحب */}
            <button
                {...listeners}
                {...attributes}
                className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors"
                aria-label="سحب لإعادة الترتيب"
            >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
            </button>

            {/* رقم الترتيب */}
            <span className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
            </span>

            {/* معلومات الخطوة */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)] truncate">{step.label}</div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-tertiary)]">{getApproverName(step)}</span>
                    {step.assignType === 'employee' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                            موظف
                        </span>
                    )}
                    {step.assignType === 'position' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                            منصب
                        </span>
                    )}
                </div>
            </div>

            {/* مطلوب/اختياري */}
            <button
                onClick={() => onToggleRequired(step.id)}
                className="flex-shrink-0 transition-transform hover:scale-105"
                title={step.required ? 'تحويل إلى اختياري' : 'تحويل إلى مطلوب'}
            >
                <Badge variant={step.required ? 'primary' : 'default'} className="cursor-pointer">
                    {step.required ? 'مطلوب' : 'اختياري'}
                </Badge>
            </button>

            {/* زر الحذف */}
            <button
                onClick={() => onRemove(step.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label={`حذف خطوة ${step.label}`}
                title="حذف الخطوة"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    );
}

// ============================================
// المكون الرئيسي
// ============================================

export default function ApprovalWorkflowTab({ moduleId, className = '' }) {
    const toast = useToast();

    const [workflows, setWorkflows] = useState(() => loadModuleWorkflows(moduleId));
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(() => workflows[0]?.id || null);
    const [showAddModal, setShowAddModal] = useState(false);

    // بيانات نموذج الإضافة
    const [newStepRole, setNewStepRole] = useState('');
    const [newStepLabel, setNewStepLabel] = useState('');
    const [newStepRequired, setNewStepRequired] = useState(true);
    const [newStepAssignMode, setNewStepAssignMode] = useState('position'); // 'position' أو 'employee'
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

    // بحث الموظفين عبر API
    const { employees: searchResults, loading: searchLoading, search: searchEmployeesAPI, clearResults } = useEmployeeSearch();

    // خيارات الأدوار
    const roleOptions = useMemo(() => getWorkflowRoleOptions(), []);

    // المناصب الوظيفية
    const allPositions = useMemo(() => {
        return Object.values(JOB_TITLES).map(j => ({
            value: j.id,
            label: j.nameAr,
            category: j.category,
        }));
    }, []);

    // تحميل تسلسلات الاعتمادات من API (مع fallback إلى localStorage)
    useEffect(() => {
        async function loadFromAPI() {
            try {
                const data = await api.permissionsManagement.getWorkflows(moduleId);
                if (data && data.workflows && data.workflows.length > 0) {
                    // Convert API format to component format
                    const apiWorkflows = data.workflows.map(wf => ({
                        id: wf.workflowId,
                        nameAr: wf.workflowNameAr,
                        steps: wf.steps.map(s => ({
                            id: `step_${s.id}`,
                            order: s.stepOrder,
                            roleId: s.roleId,
                            assignType: s.assignType,
                            assigneeId: s.assigneeId,
                            assigneeName: s.assigneeName,
                            label: s.labelAr,
                            required: s.isRequired,
                        })),
                    }));
                    setWorkflows(apiWorkflows);
                    if (!selectedWorkflowId && apiWorkflows.length > 0) {
                        setSelectedWorkflowId(apiWorkflows[0].id);
                    }
                    // Cache to localStorage
                    localStorage.setItem(`masarat-approval-workflows-${moduleId}`, JSON.stringify(apiWorkflows));
                    return;
                }
            } catch (err) {
                console.warn('Failed to load workflows from API, using localStorage:', err.message);
            }
            // Fallback: existing loadModuleWorkflows from localStorage
            const defaultWf = loadModuleWorkflows(moduleId);
            setWorkflows(defaultWf);
            if (!selectedWorkflowId && defaultWf.length > 0) {
                setSelectedWorkflowId(defaultWf[0].id);
            }
        }
        loadFromAPI();
    }, [moduleId]);

    // نتائج بحث الموظفين (من useEmployeeSearch hook)
    const filteredEmployees = searchResults;

    // العملية المختارة
    const selectedWorkflow = useMemo(
        () => workflows.find(w => w.id === selectedWorkflowId),
        [workflows, selectedWorkflowId]
    );

    // إعداد sensors للسحب والإفلات
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // معالجة نهاية السحب
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setWorkflows(prev => {
            const updated = prev.map(wf => {
                if (wf.id !== selectedWorkflowId) return wf;
                const oldIndex = wf.steps.findIndex(s => s.id === active.id);
                const newIndex = wf.steps.findIndex(s => s.id === over.id);
                const newSteps = arrayMove(wf.steps, oldIndex, newIndex)
                    .map((s, i) => ({ ...s, order: i + 1 }));
                return { ...wf, steps: newSteps };
            });
            saveModuleWorkflows(moduleId, updated);
            return updated;
        });
        toast.success('تم تحديث ترتيب الخطوات');
    }, [selectedWorkflowId, moduleId, toast]);

    // حذف خطوة
    const handleRemoveStep = useCallback((stepId) => {
        setWorkflows(prev => {
            const updated = prev.map(wf => {
                if (wf.id !== selectedWorkflowId) return wf;
                const newSteps = wf.steps
                    .filter(s => s.id !== stepId)
                    .map((s, i) => ({ ...s, order: i + 1 }));
                return { ...wf, steps: newSteps };
            });
            saveModuleWorkflows(moduleId, updated);
            return updated;
        });
        toast.success('تم حذف خطوة الاعتماد');
    }, [selectedWorkflowId, moduleId, toast]);

    // تبديل مطلوب/اختياري
    const handleToggleRequired = useCallback((stepId) => {
        setWorkflows(prev => {
            const updated = prev.map(wf => {
                if (wf.id !== selectedWorkflowId) return wf;
                const newSteps = wf.steps.map(s =>
                    s.id === stepId ? { ...s, required: !s.required } : s
                );
                return { ...wf, steps: newSteps };
            });
            saveModuleWorkflows(moduleId, updated);
            return updated;
        });
    }, [selectedWorkflowId, moduleId]);

    // إضافة خطوة جديدة
    const handleAddStep = useCallback(() => {
        if (!newStepRole || !newStepLabel.trim()) {
            toast.error('يجب تحديد المعتمد وعنوان الخطوة');
            return;
        }

        setWorkflows(prev => {
            const updated = prev.map(wf => {
                if (wf.id !== selectedWorkflowId) return wf;
                const newStep = {
                    id: generateStepId(),
                    order: wf.steps.length + 1,
                    roleId: newStepRole,
                    assignType: newStepAssignMode,
                    assigneeId: newStepAssignMode === 'employee' ? newStepRole : null,
                    assigneeName: newStepAssignMode === 'employee' ? newStepLabel.trim() : null,
                    label: newStepLabel.trim(),
                    required: newStepRequired,
                };
                return { ...wf, steps: [...wf.steps, newStep] };
            });
            saveModuleWorkflows(moduleId, updated);
            return updated;
        });

        resetAddForm();
        toast.success('تمت إضافة خطوة الاعتماد');
    }, [newStepRole, newStepLabel, newStepRequired, newStepAssignMode, selectedWorkflowId, moduleId, toast]);

    // إعادة تعيين نموذج الإضافة
    const resetAddForm = useCallback(() => {
        setNewStepRole('');
        setNewStepLabel('');
        setNewStepRequired(true);
        setNewStepAssignMode('position');
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
        setShowAddModal(false);
        clearResults();
    }, [clearResults]);

    // اختيار موظف
    const handleSelectEmployee = useCallback((emp) => {
        setNewStepRole(emp.id);
        setNewStepLabel(emp.name);
        setEmployeeSearch(emp.name);
        setShowEmployeeDropdown(false);
    }, []);

    // حفظ صريح - API أولاً مع fallback إلى localStorage
    const handleSave = useCallback(async () => {
        // Save to API
        try {
            const apiData = {
                workflows: workflows.map(wf => ({
                    workflowId: wf.id,
                    workflowNameAr: wf.nameAr,
                    isActive: true,
                    steps: (wf.steps || []).map(s => ({
                        stepOrder: s.order,
                        roleId: s.roleId,
                        assignType: s.assignType || 'position',
                        assigneeId: s.assigneeId || null,
                        assigneeName: s.assigneeName || null,
                        labelAr: s.label,
                        isRequired: s.required !== false,
                    })),
                })),
            };
            await api.permissionsManagement.saveAllWorkflows(moduleId, apiData);
        } catch (err) {
            console.warn('Failed to save workflows to API:', err.message);
        }
        // Always cache to localStorage
        saveModuleWorkflows(moduleId, workflows);
        toast.success('تم حفظ تسلسل الاعتمادات بنجاح');
    }, [moduleId, workflows, toast]);

    // تبويبات اختيار المعتمد
    const assignModeTabs = [
        { id: 'position', label: 'بالمنصب', icon: '🏷️' },
        { id: 'employee', label: 'بالاسم', icon: '👤' },
    ];

    // حالة عدم وجود workflows
    if (!workflows || workflows.length === 0) {
        return (
            <PermissionGuard
                requires="it_permissions:manage"
                fallback={<PermissionDenied message="تسلسل الاعتمادات متاح فقط لمدير تقنية المعلومات" />}
            >
                <ContentCard title="تسلسل الاعتمادات" className={className}>
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                            <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                            </svg>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-1">لا توجد تسلسلات اعتمادات معرّفة لهذا الموديول</p>
                        <p className="text-sm text-[var(--text-tertiary)]">يمكن إضافة تسلسلات لاحقاً من إعدادات النظام</p>
                    </div>
                </ContentCard>
            </PermissionGuard>
        );
    }

    return (
        <PermissionGuard
            requires="it_permissions:manage"
            fallback={<PermissionDenied message="تسلسل الاعتمادات متاح فقط لمدير تقنية المعلومات" />}
        >
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
                {/* البانل الأيمن - قائمة العمليات */}
                <div className="lg:col-span-1">
                    <ContentCard title="العمليات" subtitle="اختر عملية لتعديل تسلسل الاعتمادات">
                        <div className="space-y-2">
                            {workflows.map(wf => (
                                <button
                                    key={wf.id}
                                    onClick={() => setSelectedWorkflowId(wf.id)}
                                    className={`w-full text-right p-3 rounded-xl transition-all border
                                        ${selectedWorkflowId === wf.id
                                            ? 'bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)]/10 border-[var(--color-primary-500)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]'
                                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 text-[var(--text-primary)]'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{wf.nameAr}</div>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs text-[var(--text-tertiary)]">
                                            {wf.steps.length} {wf.steps.length === 1 ? 'خطوة' : 'خطوات'}
                                        </span>
                                        {wf.rejectionPolicy && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                                رفض وإرجاع
                                            </span>
                                        )}
                                        {wf.requiredAttachments?.length > 0 && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                                {wf.requiredAttachments.length} مرفقات
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ContentCard>
                </div>

                {/* البانل الأيسر - محرر التسلسل */}
                <div className="lg:col-span-2">
                    {selectedWorkflow ? (
                        <ContentCard
                            title={`تسلسل اعتماد: ${selectedWorkflow.nameAr}`}
                            subtitle="اسحب الخطوات لإعادة الترتيب - اضغط على مطلوب/اختياري للتبديل"
                        >
                            {/* قائمة الخطوات بالسحب والإفلات */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <SortableContext
                                    items={selectedWorkflow.steps.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2 mb-4">
                                        {selectedWorkflow.steps.map((step, index) => (
                                            <SortableStepItem
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                onRemove={handleRemoveStep}
                                                onToggleRequired={handleToggleRequired}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {/* أزرار الإجراءات */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    إضافة خطوة اعتماد
                                </Button>
                                <Button variant="primary" onClick={handleSave}>
                                    حفظ التسلسل
                                </Button>
                            </div>

                            {/* سياسة الرفض (إن وجدت) */}
                            {selectedWorkflow.rejectionPolicy && (
                                <div className="mt-4 p-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">آلية الرفض والإرجاع</h5>
                                            <p className="text-xs text-red-600/80 dark:text-red-400/70 leading-relaxed">
                                                {selectedWorkflow.rejectionPolicy.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* المرفقات الإجبارية (إن وجدت) */}
                            {selectedWorkflow.requiredAttachments && selectedWorkflow.requiredAttachments.length > 0 && (
                                <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">المرفقات الإجبارية</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {selectedWorkflow.requiredAttachments.map((att, idx) => (
                                                    <div key={att.id} className="flex items-center gap-2 text-xs">
                                                        <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-amber-800 dark:text-amber-300">{att.nameAr}</span>
                                                        {att.required && <span className="text-red-500">*</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* الرسم البياني */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                    </svg>
                                    مخطط سير الاعتماد
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                                    <ApprovalWorkflowDiagram
                                        steps={selectedWorkflow.steps}
                                        rejectionPolicy={selectedWorkflow.rejectionPolicy}
                                        requiredAttachments={selectedWorkflow.requiredAttachments}
                                    />
                                </div>
                            </div>
                        </ContentCard>
                    ) : (
                        <ContentCard>
                            <div className="text-center py-12">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                                    <svg className="w-7 h-7 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                                    </svg>
                                </div>
                                <p className="text-[var(--text-secondary)]">اختر عملية من القائمة لعرض تسلسل الاعتمادات</p>
                            </div>
                        </ContentCard>
                    )}
                </div>

                {/* نافذة إضافة خطوة */}
                <Modal
                    isOpen={showAddModal}
                    onClose={resetAddForm}
                    title="إضافة خطوة اعتماد"
                    size="md"
                    footer={
                        <div className="flex items-center gap-3 justify-end">
                            <Button variant="ghost" onClick={resetAddForm}>
                                إلغاء
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddStep}
                                disabled={!newStepRole || !newStepLabel.trim()}
                            >
                                إضافة
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {/* اختيار طريقة تحديد المعتمد */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                تحديد المعتمد
                            </label>
                            <Tabs
                                tabs={assignModeTabs}
                                activeTab={newStepAssignMode}
                                onChange={(tabId) => {
                                    setNewStepAssignMode(tabId);
                                    setNewStepRole('');
                                    setNewStepLabel('');
                                    setEmployeeSearch('');
                                }}
                                size="sm"
                            />
                        </div>

                        {/* اختيار بالمنصب */}
                        {newStepAssignMode === 'position' && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                                    المنصب الوظيفي
                                </label>
                                <select
                                    value={newStepRole}
                                    onChange={(e) => {
                                        setNewStepRole(e.target.value);
                                        const pos = allPositions.find(p => p.value === e.target.value);
                                        if (pos && !newStepLabel.trim()) {
                                            setNewStepLabel(`موافقة ${pos.label}`);
                                        }
                                    }}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                                >
                                    <option value="">اختر المنصب...</option>
                                    {allPositions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* اختيار بالاسم */}
                        {newStepAssignMode === 'employee' && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                                    اسم الموظف
                                </label>
                                <input
                                    type="text"
                                    value={employeeSearch}
                                    onChange={(e) => {
                                        setEmployeeSearch(e.target.value);
                                        setShowEmployeeDropdown(true);
                                        searchEmployeesAPI(e.target.value);
                                        if (!e.target.value.trim()) {
                                            setNewStepRole('');
                                            clearResults();
                                        }
                                    }}
                                    onFocus={() => setShowEmployeeDropdown(true)}
                                    placeholder="ابحث باسم الموظف..."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                                    dir="rtl"
                                />
                                {searchLoading && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 text-center">
                                        <span className="text-sm text-[var(--text-tertiary)]">جاري البحث...</span>
                                    </div>
                                )}
                                {showEmployeeDropdown && !searchLoading && filteredEmployees.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                        {filteredEmployees.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleSelectEmployee(emp)}
                                                className="w-full text-right px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                            >
                                                <div className="text-sm font-medium text-[var(--text-primary)]">{emp.name}</div>
                                                <div className="text-xs text-[var(--text-tertiary)]">{emp.department}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* عنوان الخطوة */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                                عنوان الخطوة
                            </label>
                            <input
                                type="text"
                                value={newStepLabel}
                                onChange={(e) => setNewStepLabel(e.target.value)}
                                placeholder="مثال: موافقة مدير المستودع"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                                dir="rtl"
                            />
                        </div>

                        {/* إلزامية الخطوة */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">خطوة إلزامية</div>
                                <div className="text-xs text-[var(--text-tertiary)]">
                                    {newStepRequired ? 'يجب إكمال هذه الخطوة للمتابعة' : 'يمكن تجاوز هذه الخطوة'}
                                </div>
                            </div>
                            <button
                                onClick={() => setNewStepRequired(!newStepRequired)}
                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                    newStepRequired
                                        ? 'bg-[var(--color-primary-500)]'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                                aria-label={newStepRequired ? 'إلزامية' : 'اختيارية'}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform duration-200 ${
                                    newStepRequired ? 'right-0.5' : 'right-[22px]'
                                }`} />
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </PermissionGuard>
    );
}
