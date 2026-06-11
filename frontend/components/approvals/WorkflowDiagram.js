/**
 * Workflow Diagram Component
 * مكون رسم Workflow (تبسيطي)
 *
 * @module components/approvals/WorkflowDiagram
 * @version 1.0.0
 * @date 2026-02-14
 */

import React from 'react';
import {
    ArrowRightIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

/**
 * Step Status Colors
 */
const STEP_STATUS = {
    completed: 'bg-green-500 border-green-500',
    current: 'bg-blue-500 border-blue-500 animate-pulse',
    pending: 'bg-gray-300 border-gray-300 dark:border-gray-600',
    rejected: 'bg-red-500 border-red-500',
};

/**
 * WorkflowDiagram Component
 */
export default function WorkflowDiagram({ workflow, currentStep = null }) {
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                لا توجد مراحل محددة
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                مراحل Workflow
            </h3>

            {/* Desktop - Horizontal */}
            <div className="hidden md:block">
                <div className="flex items-center justify-between">
                    {workflow.steps.map((step, index) => {
                        const isCompleted = step.status === 'completed';
                        const isCurrent = currentStep === step.id || step.status === 'current';
                        const isRejected = step.status === 'rejected';
                        const isPending = !isCompleted && !isCurrent && !isRejected;

                        let statusClass = STEP_STATUS.pending;
                        if (isCompleted) statusClass = STEP_STATUS.completed;
                        else if (isCurrent) statusClass = STEP_STATUS.current;
                        else if (isRejected) statusClass = STEP_STATUS.rejected;

                        return (
                            <React.Fragment key={step.id || index}>
                                {/* Step */}
                                <div className="flex flex-col items-center gap-3 flex-1">
                                    {/* Circle */}
                                    <div
                                        className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${statusClass} text-white`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircleIcon className="w-6 h-6" />
                                        ) : isRejected ? (
                                            <XCircleIcon className="w-6 h-6" />
                                        ) : isCurrent ? (
                                            <ClockIcon className="w-6 h-6" />
                                        ) : (
                                            <span className="text-sm font-bold">{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {step.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {step.approverName || step.roleName}
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow */}
                                {index < workflow.steps.length - 1 && (
                                    <ArrowRightIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 flex-shrink-0 mx-2" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Mobile - Vertical */}
            <div className="md:hidden space-y-4">
                {workflow.steps.map((step, index) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = currentStep === step.id || step.status === 'current';
                    const isRejected = step.status === 'rejected';

                    let statusClass = STEP_STATUS.pending;
                    if (isCompleted) statusClass = STEP_STATUS.completed;
                    else if (isCurrent) statusClass = STEP_STATUS.current;
                    else if (isRejected) statusClass = STEP_STATUS.rejected;

                    return (
                        <div key={step.id || index} className="flex items-start gap-4">
                            {/* Circle */}
                            <div
                                className={`w-10 h-10 rounded-full border-4 flex items-center justify-center flex-shrink-0 ${statusClass} text-white`}
                            >
                                {isCompleted ? (
                                    <CheckCircleIcon className="w-5 h-5" />
                                ) : isRejected ? (
                                    <XCircleIcon className="w-5 h-5" />
                                ) : isCurrent ? (
                                    <ClockIcon className="w-5 h-5" />
                                ) : (
                                    <span className="text-xs font-bold">{index + 1}</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {step.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {step.approverName || step.roleName}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
