/**
 * مكون تسليم العهد
 * Custody Handover Component
 */

import React, { useState } from 'react';
import { CUSTODY_TYPES, CUSTODY_CONDITION, CLEARANCE_DEPARTMENTS } from '../../../constants/clearance-types';

import { fmtDate } from '../../../utils/hijriDate';

export default function CustodyHandover({
    custodies = [],
    onHandover,
    onUpdateCondition,
    readOnly = false,
}) {
    const [selectedCustody, setSelectedCustody] = useState(null);
    const [handoverForm, setHandoverForm] = useState({
        condition: 'good',
        notes: '',
        receivedBy: '',
    });

    const getCustodyTypeConfig = (type) => {
        return CUSTODY_TYPES[type] || { label: type, icon: 'cube' };
    };

    const getConditionConfig = (condition) => {
        return CUSTODY_CONDITION[condition] || CUSTODY_CONDITION.good;
    };

    const getDepartmentLabel = (deptId) => {
        return CLEARANCE_DEPARTMENTS[deptId]?.label || deptId;
    };

    const handleHandover = (custody) => {
        setSelectedCustody(custody);
        setHandoverForm({
            condition: 'good',
            notes: '',
            receivedBy: '',
        });
    };

    const confirmHandover = () => {
        if (!selectedCustody) return;
        onHandover?.(selectedCustody.id, {
            ...handoverForm,
            handoverDate: new Date().toISOString(),
        });
        setSelectedCustody(null);
    };

    const pendingCustodies = custodies.filter(c => c.status !== 'handed_over');
    const handedOverCustodies = custodies.filter(c => c.status === 'handed_over');

    const CustodyIcon = ({ type }) => {
        const icons = {
            device: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            vehicle: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            keys: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            ),
            cards: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
            ),
            cash: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            furniture: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            tools: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            documents: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        };
        return icons[type] || icons.documents;
    };

    return (
        <div className="space-y-6">
            {/* العهد المعلقة */}
            {pendingCustodies.length > 0 && (
                <div>
                    <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        العهد المعلقة ({pendingCustodies.length})
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingCustodies.map((custody) => {
                            const typeConfig = getCustodyTypeConfig(custody.type);
                            return (
                                <div
                                    key={custody.id}
                                    className="bg-white dark:bg-gray-900 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                            <CustodyIcon type={custody.type} />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-gray-800 dark:text-gray-100">{custody.name}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{typeConfig.label}</p>
                                            {custody.serialNumber && (
                                                <p className="text-xs text-gray-400 mt-1 font-mono">{custody.serialNumber}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">القسم:</span>
                                            <span className="font-medium">{getDepartmentLabel(custody.department)}</span>
                                        </div>
                                        {custody.value && (
                                            <div className="flex items-center justify-between text-sm mt-1">
                                                <span className="text-gray-500 dark:text-gray-400">القيمة:</span>
                                                <span className="font-medium">{custody.value} ر.س</span>
                                            </div>
                                        )}
                                    </div>

                                    {!readOnly && (
                                        <button
                                            onClick={() => handleHandover(custody)}
                                            className="w-full mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                                        >
                                            تسليم العهدة
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* العهد المسلمة */}
            {handedOverCustodies.length > 0 && (
                <div>
                    <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        العهد المسلمة ({handedOverCustodies.length})
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {handedOverCustodies.map((custody) => {
                            const typeConfig = getCustodyTypeConfig(custody.type);
                            const conditionConfig = getConditionConfig(custody.condition);
                            return (
                                <div
                                    key={custody.id}
                                    className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <CustodyIcon type={custody.type} />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-gray-800 dark:text-gray-100">{custody.name}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{typeConfig.label}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${conditionConfig.color}-100 text-${conditionConfig.color}-700`}>
                                            {conditionConfig.label}
                                        </span>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-emerald-200 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex justify-between">
                                            <span>تم التسليم بواسطة:</span>
                                            <span className="font-medium">{custody.receivedBy}</span>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span>تاريخ التسليم:</span>
                                            <span className="font-medium">
                                                {fmtDate(custody.handoverDate)}
                                            </span>
                                        </div>
                                        {custody.notes && (
                                            <p className="mt-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded p-2">
                                                {custody.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* لا توجد عهد */}
            {custodies.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h4 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-2">لا توجد عهد</h4>
                    <p className="text-gray-400">لم يتم تسجيل أي عهد لهذا الموظف</p>
                </div>
            )}

            {/* نافذة تسليم العهدة */}
            {selectedCustody && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">تسليم العهدة</h3>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <CustodyIcon type={selectedCustody.type} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-800 dark:text-gray-100">{selectedCustody.name}</h5>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{getCustodyTypeConfig(selectedCustody.type).label}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">حالة العهدة</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(CUSTODY_CONDITION).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setHandoverForm({ ...handoverForm, condition: key })}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                handoverForm.condition === key
                                                    ? `bg-${config.color}-500 text-white`
                                                    : `bg-${config.color}-50 text-${config.color}-700 hover:bg-${config.color}-100`
                                            }`}
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">المستلم</label>
                                <input
                                    type="text"
                                    value={handoverForm.receivedBy}
                                    onChange={(e) => setHandoverForm({ ...handoverForm, receivedBy: e.target.value })}
                                    placeholder="اسم المستلم"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">ملاحظات</label>
                                <textarea
                                    value={handoverForm.notes}
                                    onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
                                    rows={3}
                                    placeholder="أي ملاحظات إضافية..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={confirmHandover}
                                disabled={!handoverForm.receivedBy}
                                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                تأكيد التسليم
                            </button>
                            <button
                                onClick={() => setSelectedCustody(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// مكون ملخص العهد
export function CustodySummary({ custodies = [] }) {
    const total = custodies.length;
    const handedOver = custodies.filter(c => c.status === 'handed_over').length;
    const pending = total - handedOver;
    const progress = total > 0 ? Math.round((handedOver / total) * 100) : 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-700 dark:text-gray-200">تسليم العهد</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">{handedOver} / {total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                    <div className="font-bold text-amber-600">{pending}</div>
                    <div className="text-amber-500 text-xs">معلق</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                    <div className="font-bold text-emerald-600">{handedOver}</div>
                    <div className="text-emerald-500 text-xs">مسلم</div>
                </div>
            </div>
        </div>
    );
}
