import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function HeaderClock() {
    const [now, setNow] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Live Clock Update
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close calendar on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            const clickedTrigger = triggerRef.current?.contains(event.target);
            const clickedPanel = panelRef.current?.contains(event.target);
            if (!clickedTrigger && !clickedPanel) {
                setShowCalendar(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!showCalendar) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const panelWidth = 256;
            const viewportPadding = 8;

            const left = Math.min(
                Math.max(viewportPadding, rect.right - panelWidth),
                window.innerWidth - panelWidth - viewportPadding
            );
            const top = rect.bottom + 8;
            setPosition({ top, left });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [showCalendar]);

    const formatDate = (date) => {
        return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="flex items-center gap-4 text-xs font-medium text-textSecondary select-none">
            {/* Date Display (Clickable) */}
            <div 
                ref={triggerRef}
                className="relative"
            >
                <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center gap-1.5 hover:text-textPrimary cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-slate-800/30"
                >
                    <CalendarIcon size={14} />
                    <span>{formatDate(now)}</span>
                </div>
            </div>

            <div className="h-4 w-px bg-slate-700/50"></div>

            {/* Redesigned Modern Clock */}
            <div className="flex items-center gap-2 bg-slate-800/40 rounded-md px-3 py-1 font-mono tracking-widest text-textSecondary border border-slate-700/50 shadow-sm transition-colors hover:bg-slate-800/60 hover:border-slate-600/50 cursor-default">
                <Clock size={12} className="text-textTertiary" />
                <span>{formatTime(now)}</span>
            </div>

            {showCalendar && createPortal(
                <div className="fixed inset-0 pointer-events-none z-[1200]">
                    <div
                        ref={panelRef}
                        className="absolute pointer-events-auto p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200"
                        style={{ top: `${position.top}px`, left: `${position.left}px` }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <SimpleCalendar date={now} />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// Internal Simple Calendar Implementation
function SimpleCalendar({ date }) {
    const today = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
    
    // Adjust for Monday start (0=Mon, 6=Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

    const weeks = [];
    let dayCounter = 1;

    for (let i = 0; i < 6; i++) {
        const week = [];
        for (let j = 0; j < 7; j++) {
            if ((i === 0 && j < startOffset) || dayCounter > daysInMonth) {
                week.push(null);
            } else {
                week.push(dayCounter++);
            }
        }
        weeks.push(week);
        if (dayCounter > daysInMonth) break;
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    return (
        <div className="text-textPrimary select-none">
            <div className="text-center font-bold mb-3 text-sm pb-2 border-b border-slate-700">
                {monthNames[currentMonth]} {currentYear}
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-textTertiary mb-2 font-semibold uppercase tracking-wider">
                {weekDays.map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {weeks.flat().map((d, idx) => (
                    <div 
                        key={idx} 
                        className={`
                            aspect-square flex items-center justify-center rounded-md transition-colors
                            ${!d ? 'invisible' : ''}
                            ${d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                                ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' 
                                : 'hover:bg-slate-800 cursor-default text-textSecondary'
                            }
                        `}
                    >
                        {d}
                    </div>
                ))}
            </div>
        </div>
    );
}
