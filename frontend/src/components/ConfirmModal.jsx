import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button, cn } from './UI';

const TRANSITION_MS = 180;

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
    disableOutsideClose = false,
}) {
    const [isMounted, setIsMounted] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);
    const dialogRef = useRef(null);

    const focusableSelector = useMemo(
        () => 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        []
    );

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        setIsVisible(false);
        const timer = setTimeout(() => setIsMounted(false), TRANSITION_MS);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!isMounted) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMounted]);

    useEffect(() => {
        if (!isMounted) return;
        const timer = setTimeout(() => {
            const focusable = dialogRef.current?.querySelectorAll(focusableSelector);
            if (focusable && focusable.length > 0) {
                focusable[0].focus();
            }
        }, 20);
        return () => clearTimeout(timer);
    }, [isMounted, focusableSelector]);

    useEffect(() => {
        if (!isMounted) return;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                if (onCancel) onCancel();
                return;
            }

            if (event.key !== 'Tab') return;
            const focusable = dialogRef.current?.querySelectorAll(focusableSelector);
            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const current = document.activeElement;

            if (event.shiftKey) {
                if (current === first || !dialogRef.current?.contains(current)) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }

            if (current === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isMounted, onCancel, focusableSelector]);

    if (!isMounted) return null;

    const isDanger = variant === 'danger';

    const handleBackdropClick = () => {
        if (disableOutsideClose) return;
        if (onCancel) onCancel();
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div
                onClick={handleBackdropClick}
                className={cn(
                    'absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-200 ease-out',
                    isVisible ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-0'
                )}
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Confirmation'}
                className={cn(
                    'relative w-full max-w-md rounded-xl border border-white/10 bg-slate-900 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]',
                    'transition-all duration-200 ease-out',
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                )}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        {isDanger && (
                            <span className="inline-flex items-center justify-center rounded-md p-1.5 bg-red-500/15 text-red-300 border border-red-500/25">
                                <AlertTriangle size={14} />
                            </span>
                        )}
                        <h3 className={cn('text-lg font-semibold', isDanger ? 'text-red-200' : 'text-primary')}>{title}</h3>
                    </div>
                    {message && <p className="mt-2 text-sm text-textSecondary leading-relaxed">{message}</p>}
                </div>

                <div className="p-4 flex items-center justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button type="button" variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
