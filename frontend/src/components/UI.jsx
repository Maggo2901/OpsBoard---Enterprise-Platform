import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = ({ children, variant = 'primary', size = 'default', className, ...props }) => {
    const variants = {
        primary: 'text-[#eaf2ff] border border-[#7da6ff55] bg-gradient-to-b from-[#6ea0ff] to-[#4f7fe7] shadow-[0_12px_26px_-14px_rgba(79,127,231,0.9)] hover:brightness-110 hover:shadow-[0_16px_30px_-14px_rgba(89,137,245,0.95)] active:translate-y-[1px]',
        secondary: 'bg-slate-900/60 hover:bg-slate-800/70 text-textPrimary border border-[rgba(124,156,255,0.18)] hover:border-[rgba(154,182,255,0.28)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        danger: 'bg-red-500/12 hover:bg-red-500/18 text-red-300 border border-red-500/28 hover:border-red-400/40',
        ghost: 'hover:bg-white/8 text-textTertiary hover:text-textSecondary',
        clean: 'bg-transparent text-textSecondary hover:text-textPrimary'
    };
    
    const sizes = {
        sm: 'px-2.5 py-1.5 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        icon: 'p-2'
    };
    
    return (
        <button 
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
                'disabled:opacity-50 disabled:pointer-events-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = ({ className, ...props }) => (
    <input 
        className={cn(
            'w-full bg-slate-900/58 border border-[rgba(124,156,255,0.14)] rounded-lg px-3 py-2 text-textPrimary text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
            'placeholder:text-textPlaceholder',
            'focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60',
            'transition-all duration-200 disabled:opacity-60 disabled:text-textMuted',
            className
        )}
        {...props}
    />
);

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md',
    header,
    hideHeader = false,
    bodyClassName,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/72 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className={cn(
                    "bg-surface/90 backdrop-blur-md border border-[rgba(124,156,255,0.2)] ring-1 ring-white/5 rounded-2xl shadow-modal w-full flex flex-col max-h-[90vh]",
                    "animate-in zoom-in-95 duration-200 slide-in-from-bottom-2",
                    maxWidth
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {!hideHeader && (
                    header || (
                        <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-primary tracking-tight">{title}</h2>
                            <button onClick={onClose} className="text-textTertiary hover:text-textPrimary transition-colors p-1 hover:bg-white/5 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )
                )}
                <div className={cn('p-6 overflow-y-auto custom-scrollbar', bodyClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
};
