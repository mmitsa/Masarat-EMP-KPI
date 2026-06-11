/**
 * مسار اعتماد الترقية
 * Promotion Approval Flow Component
 */

import React, { useState } from 'react';
import { Button, Badge, Modal, Input } from '../../ui';
import { fmtDate } from '../../../utils/hijriDate';

import {
    APPROVAL_LEVELS,
    APPROVAL_STATUS,
    PROMOTION_TYPES,
    getOrderedApprovalLevels,
    canApprove,
} from '../../../constants/promotion-types';

export default function PromotionApprovalFlow({
    promotion,
    currentUserRole,
    onApprove,
    onReject,
    vertical = false,
}) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedLevel, setSelectedLevel] = useState(null);

    if (!promotion) return null;

    const approvalLevels = getOrderedApprovalLevels(promotion.promotionType);

    const handleReject = () => {
        if (selectedLevel && rejectReason) {
            onReject(promotion.id, selectedLevel, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedLevel(null);
        }
    };

    const openRejectModal = (level) => {
        setSelectedLevel(level);
        setShowRejectModal(true);
    };

    const getApprovalByLevel = (levelKey) => {
        const levelMap = {
            'L01': 'hr_department',
            'L02': 'promotion_committee',
            'L03': 'authority',
            'L04': 'ministry',
        };
        const mappedKey = levelMap[levelKey] || levelKey;
        return promotion.approvals?.find(a => a.level === mappedKey);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckIcon className="w-6 h-6 text-white" />
                    </div>
                );
            case 'rejected':
                return (
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                        <XIcon className="w-6 h-6 text-white" />
                    </div>
                );
            case 'returned':
                return (
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                        <ArrowLeftIcon className="w-6 h-6 text-white" />
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-gray-400" />
                    </div>
                );
        }
    };

    const canUserApprove = (level) => {
        const levelMap = {
            'L01': 'hr_manager',
            'L02': 'promotion_committee',
            'L03': 'authority',
            'L04': 'ministry',
        };
        const levelKeyMap = {
            'L01': 'hr_department',
            'L02': 'promotion_committee',
            'L03': 'authority',
            'L04': 'ministry',
        };

        const approval = getApprovalByLevel(level.code);
        const isCurrentLevel = approval?.status === 'pending';
        const hasRole = currentUserRole === levelMap[level.code];

        // Check if previous levels are all approved
        const levelIndex = approvalLevels.findIndex(l => l.code === level.code);
        const previousLevelsApproved = approvalLevels.slice(0, levelIndex).every(l => {
            const prevApproval = getApprovalByLevel(l.code);
            return prevApproval?.status === 'approved';
        });

        return isCurrentLevel && hasRole && previousLevelsApproved;
    };

    return (
        <div className={`${vertical ? 'space-y-4' : 'flex items-start gap-4 overflow-x-auto pb-4'}`}>
            {approvalLevels.map((level, index) => {
                const approval = getApprovalByLevel(level.code);
                const status = approval?.status || 'pending';
                const isCurrentLevel = canUserApprove(level);
                const levelKeyMap = {
                    'L01': 'hr_department',
                    'L02': 'promotion_committee',
                    'L03': 'authority',
                    'L04': 'ministry',
                };

                return (
                    <div key={level.code} className={vertical ? '' : 'flex items-center'}>
                        <div className={`
                            ${vertical ? 'flex gap-4' : 'flex flex-col items-center'}
                            ${vertical ? '' : 'min-w-[180px]'}
                        `}>
                            {/* Status Icon */}
                            <div className={vertical ? '' : 'mb-3'}>
                                {getStatusIcon(status)}
                            </div>

                            {/* Level Info */}
                            <div className={`${vertical ? 'flex-1' : 'text-center'}`}>
                                <h4 className={`font-bold text-gray-900 dark:text-white ${vertical ? '' : 'text-sm'}`}>
                                    {level.label}
                                </h4>

                                {/* Status Badge */}
                                <div className={`${vertical ? 'mt-1' : 'mt-2'}`}>
                                    <Badge variant={
                                        status === 'approved' ? 'success' :
                                        status === 'rejected' ? 'danger' :
                                        status === 'returned' ? 'warning' : 'default'
                                    }>
                                        {APPROVAL_STATUS[status]?.label || 'قيد الانتظار'}
                                    </Badge>
                                </div>

                                {/* Approval Details */}
                                {approval?.approvedBy && (
                                    <div className={`${vertical ? 'mt-2' : 'mt-3'} text-xs text-gray-500 dark:text-gray-400`}>
                                        <p>{approval.approvedBy}</p>
                                        <p>{fmtDate(approval.approvedDate)}</p>
                                    </div>
                                )}

                                {/* Notes */}
                                {approval?.notes && (
                                    <p className={`${vertical ? 'mt-2' : 'mt-2'} text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-2`}>
                                        {approval.notes}
                                    </p>
                                )}

                                {/* Actions */}
                                {isCurrentLevel && (
                                    <div className={`${vertical ? 'mt-3' : 'mt-4'} flex gap-2 ${vertical ? '' : 'justify-center'}`}>
                                        <Button
                                            size="sm"
                                            onClick={() => onApprove(promotion.id, levelKeyMap[level.code])}
                                        >
                                            موافقة
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => openRejectModal(levelKeyMap[level.code])}
                                        >
                                            رفض
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connector */}
                        {!vertical && index < approvalLevels.length - 1 && (
                            <div className="flex-shrink-0 px-4">
                                <div className={`w-12 h-1 ${
                                    status === 'approved' ? 'bg-emerald-500' : 'bg-gray-200'
                                }`} />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                }}
                title="سبب الرفض"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">الرجاء ذكر سبب رفض طلب الترقية:</p>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="سبب الرفض..."
                        required
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                            إلغاء
                        </Button>
                        <Button variant="danger" onClick={handleReject} disabled={!rejectReason}>
                            تأكيد الرفض
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Summary Component
export function PromotionProgressSummary({ promotion }) {
    if (!promotion) return null;

    const approvalLevels = getOrderedApprovalLevels(promotion.promotionType);
    const totalLevels = approvalLevels.length;
    const approvedLevels = promotion.approvals?.filter(a => a.status === 'approved').length || 0;
    const progress = Math.round((approvedLevels / totalLevels) * 100);

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-blue-800 dark:text-blue-200 font-medium">تقدم الاعتماد</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{approvedLevels} / {totalLevels}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                        progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {approvalLevels.map(level => {
                    const levelMap = {
                        'L01': 'hr_department',
                        'L02': 'promotion_committee',
                        'L03': 'authority',
                        'L04': 'ministry',
                    };
                    const approval = promotion.approvals?.find(a => a.level === levelMap[level.code]);
                    const status = approval?.status || 'pending';

                    return (
                        <div
                            key={level.code}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {status === 'approved' ? (
                                <CheckIcon className="w-3 h-3" />
                            ) : status === 'rejected' ? (
                                <XIcon className="w-3 h-3" />
                            ) : (
                                <ClockIcon className="w-3 h-3" />
                            )}
                            <span>{level.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Icons
function CheckIcon({ className = "w-6 h-6" }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

function XIcon({ className = "w-6 h-6" }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

function ClockIcon({ className = "w-6 h-6" }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function ArrowLeftIcon({ className = "w-6 h-6" }) {
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
}
