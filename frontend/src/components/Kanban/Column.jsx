import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, ArrowRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import TaskCard from './TaskCard';
import { Input } from '../UI';
import api from '../../services/api';

export default function Column({
    column,
    index = 0,
    tasks,
    onEditTask,
    isOverlay,
    canMoveLeft,
    canMoveRight,
    onMoveLeft,
    onMoveRight,
    onDeleteColumn,
    onRenameColumn,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(column.name);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const menuTriggerRef = useRef(null);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: `col-${column.id}`,
        data: {
            type: 'COLUMN',
            id: column.id,     // Explicit DB ID
            title: column.name,
            column             // Full object fallback
        },
        disabled: isOverlay
    });

    const {
        setNodeRef: setDropZoneRef,
        isOver: isOverDropZone
    } = useDroppable({
        id: `drop-col-${column.id}`,
        data: {
            type: 'COLUMN',
            id: column.id
        },
        disabled: isOverlay
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    useEffect(() => {
        setName(column.name);
    }, [column.name]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const updateMenuPosition = () => {
            if (!menuTriggerRef.current) return;
            const rect = menuTriggerRef.current.getBoundingClientRect();
            const estimatedMenuWidth = 190;
            const left = Math.min(
                Math.max(8, rect.right - estimatedMenuWidth),
                window.innerWidth - estimatedMenuWidth - 8
            );
            const top = Math.min(rect.bottom + 6, window.innerHeight - 12);
            setMenuPosition({ top, left });
        };

        updateMenuPosition();

        const onMouseDown = (event) => {
            const clickedTrigger = menuTriggerRef.current?.contains(event.target);
            const clickedMenu = menuRef.current?.contains(event.target);
            if (!clickedTrigger && !clickedMenu) {
                setIsMenuOpen(false);
            }
        };
        const onEscape = (event) => {
            if (event.key === 'Escape') setIsMenuOpen(false);
        };
        const onWindowResize = () => updateMenuPosition();
        const onWindowScroll = () => updateMenuPosition();
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onEscape);
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('scroll', onWindowScroll, true);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onEscape);
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('scroll', onWindowScroll, true);
        };
    }, [isMenuOpen]);

    const handleRename = async () => {
        const nextName = name.trim();
        if (!nextName) {
            setName(column.name);
            setIsEditing(false);
            return;
        }
        if (nextName !== column.name) {
            if (onRenameColumn) await onRenameColumn(column.id, nextName);
            else await api.put(`/columns/${column.id}`, { name: nextName });
        }
        setName(nextName);
        setIsEditing(false);
    };

    if (isDragging) {
        return (
            <div 
                ref={setNodeRef} 
                className="min-w-[390px] w-[28vw] max-w-[500px] h-full rounded-2xl border-2 border-primary/60 border-dashed bg-slate-900/40 shadow-[0_0_0_1px_rgba(130,166,255,0.2),0_22px_44px_-28px_rgba(0,0,0,0.95)] flex-shrink-0"
                style={style}
            />
        );
    }

    return (
        <div 
            ref={setNodeRef} 
            className={`min-w-[390px] w-[28vw] max-w-[500px] max-h-full h-full flex flex-col flex-shrink-0 group/column dt-floating-column pt-1.5 px-2.5 pb-3 dt-enter-column ${
                isOverlay ? 'cursor-grabbing shadow-[0_28px_60px_-26px_rgba(0,0,0,0.95),0_0_0_1px_rgba(130,166,255,0.26)] rotate-2 scale-[1.02]' : 'hover:-translate-y-[2px]'
            }`}
            style={{ ...style, ['--stagger-delay']: `${index * 55}ms` }}
        >
            <div className="dt-column-topline" />
            {/* Column Header */}
            <div 
                className="p-3.5 flex items-center justify-between mb-2 rounded-xl hover:bg-white/[0.04] hover:-translate-y-[1px] transition-all shrink-0"
            >
                <div
                    className="flex items-center gap-3 flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                    style={{ touchAction: 'none' }}
                >
                    {isEditing ? (
                        <Input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') await handleRename();
                                if (e.key === 'Escape') {
                                    setName(column.name);
                                    setIsEditing(false);
                                }
                            }}
                            className="py-0.5 h-7 text-sm font-semibold bg-slate-900 border-primary"
                        />
                    ) : (
                        <div className="flex items-center gap-3 truncate" onDoubleClick={() => setIsEditing(true)}>
                            <h3 className="font-semibold text-[#f2f7ff] text-sm uppercase tracking-[0.06em] truncate">{column.name}</h3>
                            <span className="text-[11px] text-[#c8d8f5] font-semibold font-mono bg-[#233352]/70 px-2.5 py-0.5 rounded-full border border-[#88a8ea55] shadow-[0_0_0_1px_rgba(120,159,237,0.08),0_0_16px_-8px_rgba(108,152,255,0.5)]">{tasks.length}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-1 group-hover/column:opacity-100 transition-opacity">
                    <div className="relative">
                        <button
                            ref={menuTriggerRef}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(prev => !prev);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-md text-textTertiary hover:text-textPrimary hover:bg-white/5 transition-colors"
                            aria-label={`Section actions for ${column.name}`}
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Task Area */}
            <div
                ref={setDropZoneRef}
                className={`flex-1 overflow-y-auto px-1 pb-2.5 pt-1 flex flex-col gap-3.5 custom-scrollbar min-h-0 rounded-xl transition-all ${
                    isOverDropZone ? 'bg-primary/10 ring-1 ring-primary/45 shadow-[inset_0_0_0_1px_rgba(106,151,255,0.2)]' : ''
                }`}
            >
                <SortableContext 
                    items={tasks.map(t => `task-${t.id}`)} 
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task, taskIndex) => (
                        <TaskCard key={task.id} task={task} index={taskIndex} onClick={() => onEditTask(task)} />
                    ))}
                </SortableContext>
                

            </div>

            {isMenuOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed min-w-[170px] rounded-lg border border-white/10 bg-slate-900 shadow-xl p-1 z-[9999] animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setIsMenuOpen(false);
                            setIsEditing(true);
                        }}
                        className="w-full px-2.5 py-2 rounded-md text-left text-xs text-textSecondary hover:text-textPrimary hover:bg-white/5 flex items-center gap-2"
                    >
                        <Pencil size={12} /> Rename Section
                    </button>
                    <button
                        type="button"
                        disabled={!canMoveLeft}
                        onClick={() => {
                            if (!canMoveLeft) return;
                            setIsMenuOpen(false);
                            if (onMoveLeft) onMoveLeft(column.id);
                        }}
                        className="w-full px-2.5 py-2 rounded-md text-left text-xs text-textSecondary hover:text-textPrimary hover:bg-white/5 flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <ArrowLeft size={12} /> Move Left
                    </button>
                    <button
                        type="button"
                        disabled={!canMoveRight}
                        onClick={() => {
                            if (!canMoveRight) return;
                            setIsMenuOpen(false);
                            if (onMoveRight) onMoveRight(column.id);
                        }}
                        className="w-full px-2.5 py-2 rounded-md text-left text-xs text-textSecondary hover:text-textPrimary hover:bg-white/5 flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <ArrowRight size={12} /> Move Right
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                        type="button"
                        onClick={() => {
                            setIsMenuOpen(false);
                            if (onDeleteColumn) onDeleteColumn(column.id);
                        }}
                        className="w-full px-2.5 py-2 rounded-md text-left text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 flex items-center gap-2"
                    >
                        <Trash2 size={12} /> Delete Section
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}
