/**
 * مكون نافذة طلب الإجازة
 * Leave Request Modal Component
 */

import React from 'react';
import { Modal } from '../../ui';
import LeaveRequestForm from './LeaveRequestForm';

export default function LeaveRequestModal({
    isOpen,
    onClose,
    employees = [],
    selectedEmployeeId = null,
    balance = null,
    onSubmit,
    loading = false,
    errors = {},
}) {
    const handleSubmit = async (data) => {
        if (onSubmit) {
            await onSubmit(data);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="طلب إجازة جديد"
            size="lg"
        >
            <LeaveRequestForm
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                balance={balance}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={loading}
                errors={errors}
            />
        </Modal>
    );
}