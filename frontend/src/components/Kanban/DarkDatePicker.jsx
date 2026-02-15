import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../UI';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseIsoDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

export default function DarkDatePicker({ value, onChange, className, disabled = false }) {
    const CALENDAR_LAYER_Z_INDEX = 20000;
    const selectedDate = useMemo(() => parseIsoDate(value), [value]);
    const today = useMemo(() => new Date(), []);

    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [viewDate, setViewDate] = useState(selectedDate || today);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (selectedDate && !isOpen) {
            setViewDate(selectedDate);
        }
    }, [selectedDate, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const raf = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(raf);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setIsVisible(false);
            return;
        }

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const panelWidth = 300;
            const panelHeight = 332;

            const left = Math.min(
                Math.max(8, rect.left),
                window.innerWidth - panelWidth - 8
            );

            const canOpenBelow = rect.bottom + panelHeight + 8 <= window.innerHeight;
            const top = canOpenBelow
                ? rect.bottom + 8
                : Math.max(8, rect.top - panelHeight - 8);

            setPosition({ top, left });
        };

        updatePosition();

        const onOutsideClick = (event) => {
            const clickedTrigger = triggerRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedTrigger && !clickedPanel) {
                setIsOpen(false);
            }
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        document.addEventListener('mousedown', onOutsideClick);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            document.removeEventListener('mousedown', onOutsideClick);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen]);

    const monthStart = useMemo(
        () => new Date(viewDate.getFullYear(), viewDate.getMonth(), 1),
        [viewDate]
    );
    const monthEnd = useMemo(
        () => new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0),
        [viewDate]
    );

    const calendarDays = useMemo(() => {
        const days = [];
        const offset = monthStart.getDay();
        const daysInMonth = monthEnd.getDate();
        const daysInPrevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

        for (let i = offset - 1; i >= 0; i -= 1) {
            days.push({
                date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, daysInPrevMonth - i),
                currentMonth: false,
            });
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            days.push({
                date: new Date(viewDate.getFullYear(), viewDate.getMonth(), day),
                currentMonth: true,
            });
        }

        const trailing = 42 - days.length;
        for (let day = 1; day <= trailing; day += 1) {
            days.push({
                date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, day),
                currentMonth: false,
            });
        }
        return days;
    }, [viewDate, monthStart, monthEnd]);

    const renderValue = value
        ? selectedDate?.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Select date';

    return (
        <>
            <div className="relative z-50 overflow-visible">
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        if (disabled) return;
                        setViewDate(selectedDate || today);
                        setIsOpen((prev) => !prev);
                    }}
                    className={cn(
                        'mt-2 w-full h-10 rounded-lg border border-[rgba(124,156,255,0.24)] bg-slate-950/65',
                        'px-3 text-sm text-left text-textPrimary flex items-center justify-between',
                        'focus:outline-none focus:ring-2 focus:ring-primary/55 focus:border-primary/60',
                        'hover:border-[rgba(154,182,255,0.4)] transition-all',
                        disabled ? 'opacity-60 cursor-not-allowed' : '',
                        className
                    )}
                >
                    <span className={value ? 'text-textPrimary' : 'text-textPlaceholder'}>{renderValue}</span>
                    <Calendar size={15} className="text-textSecondary" />
                </button>
            </div>

            {isOpen && createPortal(
                <div className="fixed inset-0 pointer-events-none" style={{ zIndex: CALENDAR_LAYER_Z_INDEX }}>
                    <div
                        ref={panelRef}
                        className={cn(
                            'absolute pointer-events-auto w-[300px] rounded-xl border border-[rgba(124,156,255,0.24)] bg-slate-900/95 backdrop-blur-md',
                            'shadow-[0_24px_48px_-24px_rgba(0,0,0,0.95),0_0_0_1px_rgba(110,160,255,0.18)]',
                            'transition-all duration-150 ease-out',
                            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        )}
                        style={{ top: `${position.top}px`, left: `${position.left}px`, zIndex: CALENDAR_LAYER_Z_INDEX }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-white/5"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="text-sm font-semibold text-textPrimary">
                                {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-white/5"
                                aria-label="Next month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="p-3">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {WEEKDAYS.map((day) => (
                                    <div key={day} className="text-[11px] text-textTertiary text-center font-medium py-1">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map(({ date, currentMonth }) => {
                                    const selected = selectedDate && isSameDay(date, selectedDate);
                                    const isToday = isSameDay(date, today);
                                    return (
                                        <button
                                            key={toIsoDate(date)}
                                            type="button"
                                            onClick={() => {
                                                onChange(toIsoDate(date));
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                'h-9 rounded-md text-xs font-medium transition-all',
                                                currentMonth ? 'text-textPrimary' : 'text-textMuted/65',
                                                'hover:bg-primary/22 hover:text-textPrimary',
                                                selected ? 'bg-primary text-white shadow-[0_0_14px_-8px_rgba(93,142,248,0.95)]' : '',
                                                isToday && !selected ? 'border border-primary/60 text-primary' : 'border border-transparent'
                                            )}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
