import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlignLeft, Paperclip } from 'lucide-react';

const getAccentFromColumn = (columnId) => {
    const palette = ['#6ea0ff', '#8f7bf8', '#35c78a', '#f0b56a', '#f17979', '#6fd6da'];
    if (!Number.isFinite(Number(columnId))) return palette[0];
    return palette[Math.abs(Number(columnId)) % palette.length];
};

const hexToRgb = (hex) => {
    const normalized = (hex || '').replace('#', '');
    const value = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
    if (value.length !== 6) return null;
    const parsed = Number.parseInt(value, 16);
    if (Number.isNaN(parsed)) return null;
    return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 };
};

const getContrastText = (hexColor) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#f8fafc';
    const normalized = [rgb.r, rgb.g, rgb.b].map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
    return luminance > 0.5 ? '#0f172a' : '#f8fafc';
};

export default function TaskCard({ task, onClick, isOverlay, index = 0 }) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: `task-${task.id}`,
        data: {
            type: 'TASK',
            id: task.id,
            columnId: task.column_id,
            task
        },
        disabled: isOverlay
    });

    const style = {
        transition: transition || 'box-shadow 200ms ease, transform 200ms ease',
        transform: CSS.Transform.toString(transform),
        touchAction: 'none',
        '--stagger-delay': `${Math.min(index, 7) * 36}ms`,
    };

    if (isDragging) {
        return (
            <div 
                ref={setNodeRef} 
                style={style}
                className="bg-surface/30 backdrop-blur-sm h-32 rounded-xl border-2 border-primary/55 border-dashed shadow-[0_0_0_1px_rgba(127,167,255,0.25),0_22px_42px_-24px_rgba(0,0,0,0.92)]"
            />
        );
    }

    const priorityBadge = {
        'Low': 'bg-slate-800 text-textSecondary border-slate-700',
        'Medium': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        'High': 'bg-red-500/10 text-red-400 border-red-500/20'
    }[task.priority] || 'bg-slate-800 text-textSecondary';
    const accentColor = getAccentFromColumn(task.column_id);

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            {...attributes} 
            {...listeners}
            onClick={onClick}
            className={`group dt-card-surface border rounded-xl p-[18px] shadow-card cursor-grab active:cursor-grabbing transition-all duration-200 relative overflow-hidden shrink-0 min-h-[100px] h-auto flex flex-col justify-between dt-enter-task ${
                isOverlay
                    ? 'scale-[1.01] border-[rgba(141,173,255,0.38)] shadow-[0_30px_58px_-26px_rgba(0,0,0,0.98),0_0_0_1px_rgba(128,162,255,0.25)]'
                    : 'border-[rgba(117,144,209,0.24)] hover:border-[rgba(154,182,255,0.52)] hover:-translate-y-[3px] hover:shadow-card-hover'
            }`}
        >
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accentColor }} />

            <div className="space-y-2.5 flex-1">
                {/* Header (Labels) */}
                {task.labels && task.labels.length > 0 && (
                     <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {task.labels.map(l => (
                            <span 
                                key={l.id} 
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide shadow-sm shrink-0" 
                                style={{ backgroundColor: l.color, color: getContrastText(l.color) }}
                            >
                                {l.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h4 className="text-sm font-medium text-textPrimary leading-snug group-hover:text-textPrimary transition-colors break-words whitespace-normal">
                    {task.title}
                </h4>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-2 mt-auto">
                    <div className="flex items-center gap-3 text-textTertiary">
                        {task.due_date && (
                             <div className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded border ${new Date(task.due_date) < new Date() ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-textSecondary border-transparent'}`}>
                                <Calendar size={12} />
                                <span>{new Date(task.due_date).toLocaleString('default', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        )}
                        {(task.description || (task.attachments && task.attachments.length > 0)) && (
                             <div className="flex items-center gap-2 text-textTertiary">
                                 {task.description && <AlignLeft size={12} />}
                                 {task.attachments?.length > 0 && (
                                     <div className="flex items-center gap-1">
                                         <Paperclip size={12} />
                                         <span className="text-[10px]">{task.attachments.length}</span>
                                     </div>
                                 )}
                             </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {task.assignee_name && (
                            <div className="h-5 w-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-textPrimary font-bold ring-1 ring-background shrink-0" title={task.assignee_name}>
                                {task.assignee_name.charAt(0)}
                            </div>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priorityBadge} shrink-0`}>
                            {task.priority}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
