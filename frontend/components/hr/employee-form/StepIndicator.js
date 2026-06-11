import React, { useMemo } from 'react';
import { isStepComplete } from '../../../lib/hr/employeeValidation';

const STEPS = [
    { step: 1, label: 'البيانات الشخصية', icon: 'user' },
    { step: 2, label: 'البيانات الوظيفية', icon: 'briefcase' },
    { step: 3, label: 'البيانات المالية', icon: 'cash' },
    { step: 4, label: 'بيانات إضافية', icon: 'document' },
];

export default function StepIndicator({ formStep, setFormStep, formData, visitedSteps }) {
    const stepStatuses = useMemo(() => {
        return STEPS.map(s => ({
            ...s,
            complete: isStepComplete(s.step, formData),
            hasErrors: visitedSteps.has(s.step) && !isStepComplete(s.step, formData),
        }));
    }, [formData, visitedSteps]);

    return (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                {stepStatuses.map((s, idx) => (
                    <div key={s.step} className="flex items-center">
                        <button
                            onClick={() => setFormStep(s.step)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                formStep === s.step
                                    ? 'bg-blue-600 text-white'
                                    : s.complete
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                                    : s.hasErrors
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200'
                                    : 'bg-gray-200 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                            }`}
                        >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                formStep === s.step
                                    ? 'bg-white/20'
                                    : s.complete
                                    ? 'bg-green-500 text-white'
                                    : s.hasErrors
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-400/30'
                            }`}>
                                {s.complete ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : s.hasErrors ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    s.step
                                )}
                            </span>
                            <span className="hidden sm:inline">{s.label}</span>
                        </button>
                        {idx < 3 && <div className={`w-8 h-0.5 mx-2 ${s.complete ? 'bg-green-400' : 'bg-gray-300'}`}></div>}
                    </div>
                ))}
            </div>
        </div>
    );
}
