import React, { useEffect, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';

const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
};

/**
 * Modal Component - نافذة منبثقة
 * تدعم Focus Trap و Accessibility كاملة
 */
const Modal = memo(function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
}) {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    const onCloseRef = useRef(onClose);
    const closeOnOverlayClickRef = useRef(closeOnOverlayClick);
    const titleId = ariaLabelledBy || 'modal-title';
    const descId = ariaDescribedBy || 'modal-description';

    // Keep refs up-to-date without triggering effects
    useEffect(() => {
        onCloseRef.current = onClose;
    });
    useEffect(() => {
        closeOnOverlayClickRef.current = closeOnOverlayClick;
    });

    // Focus trap and keyboard handling - only re-runs when isOpen changes
    useEffect(() => {
        if (!isOpen) return;

        // Store the previously focused element
        previousActiveElement.current = document.activeElement;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCloseRef.current?.();
                return;
            }

            // Focus trap
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        // Focus the first focusable element only once when modal opens
        setTimeout(() => {
            const firstFocusable = modalRef.current?.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
        }, 50);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
            // Restore focus to previously focused element
            previousActiveElement.current?.focus?.();
        };
    }, [isOpen]);

    const handleOverlayClick = useCallback((e) => {
        if (closeOnOverlayClickRef.current && e.target === e.currentTarget) {
            onCloseRef.current?.();
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1050] flex items-center justify-center p-[var(--spacing-4)]"
            role="presentation"
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 z-[1040] bg-[var(--color-gray-900)]/60 backdrop-blur-sm animate-fadeIn"
                onClick={handleOverlayClick}
                aria-hidden="true"
            ></div>

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={subtitle ? descId : undefined}
                className={`relative z-[1050] bg-[var(--card-bg,var(--bg-primary))] rounded-[var(--modal-radius)] shadow-[var(--shadow-modal)] border border-[var(--card-border,var(--border-light))] w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-slideUp`}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-start justify-between p-[var(--spacing-6)] border-b border-[var(--card-border,var(--border-light))]">
                        <div>
                            {title && (
                                <h2 id={titleId} className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--text-primary)]">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p id={descId} className="text-[var(--font-size-sm)] text-[var(--text-secondary)] mt-[var(--spacing-1)]">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-[var(--spacing-2)] rounded-[var(--btn-radius)] hover:bg-[var(--color-background-soft)] transition-colors -m-[var(--spacing-2)]"
                                aria-label="إغلاق النافذة"
                            >
                                <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden break-words wrap-anywhere no-x-scroll p-[var(--spacing-6)] text-[var(--text-primary)]">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-[var(--spacing-6)] border-t border-[var(--card-border,var(--border-light))] flex items-center justify-start gap-[var(--spacing-3)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
});

Modal.displayName = 'Modal';

Modal.propTypes = {
    /** حالة فتح النافذة */
    isOpen: PropTypes.bool.isRequired,
    /** دالة الإغلاق */
    onClose: PropTypes.func.isRequired,
    /** عنوان النافذة */
    title: PropTypes.string,
    /** العنوان الفرعي */
    subtitle: PropTypes.string,
    /** محتوى النافذة */
    children: PropTypes.node,
    /** محتوى الفوتر */
    footer: PropTypes.node,
    /** حجم النافذة */
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
    /** إغلاق عند النقر على الخلفية */
    closeOnOverlayClick: PropTypes.bool,
    /** إظهار زر الإغلاق */
    showCloseButton: PropTypes.bool,
    /** معرف العنوان للـ accessibility */
    'aria-labelledby': PropTypes.string,
    /** معرف الوصف للـ accessibility */
    'aria-describedby': PropTypes.string,
};

export default Modal;

/**
 * Confirmation Modal - نافذة تأكيد
 */
export const ConfirmModal = memo(function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'تأكيد',
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    variant = 'danger',
    loading = false,
}) {
    const variantStyles = {
        danger: {
            btn: 'bg-[var(--color-error)] hover:bg-[var(--color-error-dark)] focus:ring-[var(--color-error)]',
            icon: 'bg-[var(--color-error-light)] text-[var(--color-error)]',
        },
        warning: {
            btn: 'bg-[var(--color-warning)] hover:bg-[var(--color-warning-dark)] focus:ring-[var(--color-warning)]',
            icon: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
        },
        primary: {
            btn: 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]',
            icon: 'bg-[var(--color-primary-50)] text-[var(--color-primary-500)]',
        },
    };

    const currentVariant = variantStyles[variant] || variantStyles.danger;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            title={title}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-[var(--spacing-4)] py-[var(--spacing-2)] border border-[var(--card-border,var(--border-light))] rounded-[var(--btn-radius)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        aria-busy={loading}
                        className={`px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--btn-radius)] text-[var(--text-inverse)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${currentVariant.btn}`}
                    >
                        {loading ? 'جاري التنفيذ...' : confirmText}
                    </button>
                </>
            }
        >
            <div className="text-center">
                {variant === 'danger' && (
                    <div className={`w-12 h-12 rounded-[var(--radius-full)] ${currentVariant.icon} flex items-center justify-center mx-auto mb-[var(--spacing-4)]`} aria-hidden="true">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                )}
                <p className="text-[var(--text-secondary)]">{message}</p>
            </div>
        </Modal>
    );
});

ConfirmModal.displayName = 'ConfirmModal';

ConfirmModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    variant: PropTypes.oneOf(['danger', 'warning', 'primary']),
    loading: PropTypes.bool,
};
