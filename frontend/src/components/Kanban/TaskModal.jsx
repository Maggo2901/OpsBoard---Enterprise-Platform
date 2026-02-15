import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Input, cn } from '../UI';
import ConfirmModal from '../ConfirmModal';
import { AlignLeft, AlertCircle, Archive, CheckCircle2, Clock, File, FileArchive, FileCode2, FileImage, FileText, Paperclip, Plus, Tag, Trash2, X } from 'lucide-react';
import api, { getUploadUrl } from '../../services/api';
import { toLocalTime } from '../../utils/dateUtils';
import DarkDatePicker from './DarkDatePicker';

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];

const SECTION_CARD = 'rounded-xl border border-white/10 bg-slate-900/55 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.75)] p-4';

const PRIORITY_STYLES = {
    Low: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
    Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    High: 'bg-red-500/15 text-red-300 border-red-500/35',
};

const getStatusColor = (statusName = '') => {
    const name = statusName.toLowerCase();
    if (name.includes('done')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
    if (name.includes('progress')) return 'bg-violet-500/15 text-violet-300 border-violet-500/35';
    if (name.includes('test')) return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
    return 'bg-sky-500/15 text-sky-300 border-sky-500/35';
};

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string') return null;
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
        ? normalized.split('').map(char => char + char).join('')
        : normalized;
    if (value.length !== 6) return null;
    const int = Number.parseInt(value, 16);
    if (Number.isNaN(int)) return null;
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

const getLabelTextColor = (hexColor) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#f8fafc';
    const normalized = [rgb.r, rgb.g, rgb.b].map(value => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
    return luminance > 0.5 ? '#0f172a' : '#f8fafc';
};

const getFileExtension = (name = '') => {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
};

const getFileIcon = (extension) => {
    const ext = extension.toLowerCase();
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
    if (['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'css', 'json', 'xml'].includes(ext)) return FileCode2;
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return FileImage;
    if (['txt', 'md', 'pdf', 'doc', 'docx', 'rtf'].includes(ext)) return FileText;
    return File;
};

const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / 1024 ** exponent;
    return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export default function TaskModal({ isOpen, onClose, task, onSubmit, onDelete, onArchive, columns, currentUser, initialColumnId }) {
    const isCreateMode = !task?.id;
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        due_date: '',
        column_id: '',
    });
    const [labels, setLabels] = useState([]);
    const [fullTask, setFullTask] = useState(null);
    const [newLabel, setNewLabel] = useState({ name: '', color: '#3b82f6' });
    const [isLabelComposerOpen, setIsLabelComposerOpen] = useState(false);
    const [showAllActivity, setShowAllActivity] = useState(false);
    const [saveState, setSaveState] = useState('saved');
    const [baseSnapshot, setBaseSnapshot] = useState('');
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        variant: 'danger',
        onConfirm: null,
    });
    const fileInputRef = useRef(null);
    const descriptionRef = useRef(null);

    const statusOptions = useMemo(
        () => columns.map(col => ({ value: Number(col.id), label: col.name })),
        [columns]
    );

    const autoResizeDescription = (target) => {
        if (!target) return;
        target.style.height = 'auto';
        const maxHeightPx = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.56) : 560;
        const nextHeight = Math.min(target.scrollHeight, maxHeightPx);
        target.style.height = `${Math.max(nextHeight, 110)}px`;
        target.style.overflowY = target.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
    };

    useEffect(() => {
        if (!isOpen) return;

        fetchLabels();
        setIsLabelComposerOpen(false);
        setShowAllActivity(false);
        setConfirmState(prev => ({ ...prev, isOpen: false }));

        if (task) {
            const initial = {
                title: task.title,
                description: task.description || '',
                priority: task.priority || 'Medium',
                due_date: task.due_date || '',
                column_id: Number(task.column_id),
            };
            setFormData(initial);
            const snapshot = JSON.stringify(initial);
            setBaseSnapshot(snapshot);
            setSaveState('saved');
            fetchTaskDetails(task.id);
        } else {
            const initial = {
                title: '',
                description: '',
                priority: 'Medium',
                due_date: '',
                column_id: Number(initialColumnId || columns[0]?.id || 0),
            };
            setFormData(initial);
            const snapshot = JSON.stringify(initial);
            setBaseSnapshot(snapshot);
            setSaveState('saved');
            setFullTask(null);
        }
    }, [isOpen, task, initialColumnId, columns]);

    useEffect(() => {
        if (!isOpen || !baseSnapshot || saveState === 'saving') return;
        const currentSnapshot = JSON.stringify(formData);
        setSaveState(currentSnapshot === baseSnapshot ? 'saved' : 'unsaved');
    }, [formData, baseSnapshot, saveState, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const frameId = requestAnimationFrame(() => autoResizeDescription(descriptionRef.current));
        return () => cancelAnimationFrame(frameId);
    }, [isOpen, formData.description]);

    const fetchLabels = async () => {
        try {
            const res = await api.get('/labels');
            setLabels(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Failed labels', error);
            setLabels([]);
        }
    };

    const fetchTaskDetails = async (id) => {
        try {
            const res = await api.get(`/tasks/${id}`);
            setFullTask(res.data);
        } catch (error) {
            console.error('Failed task details', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setSaveState('saving');
            await onSubmit(formData);
            const snapshot = JSON.stringify(formData);
            setBaseSnapshot(snapshot);
            setSaveState('saved');
        } catch (error) {
            console.error('Failed save task', error);
            setSaveState('unsaved');
            alert('Failed to save task changes.');
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !fullTask) return;

        const data = new FormData();
        data.append('file', file);
        data.append('user_id', currentUser.id);

        try {
            await api.post(`/tasks/${fullTask.id}/attachments`, data);
            fetchTaskDetails(fullTask.id);
        } catch (error) {
            alert('Upload failed');
        }
    };

    const openConfirm = ({ title, message, confirmText = 'Confirm', variant = 'danger', onConfirm }) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            confirmText,
            variant,
            onConfirm,
        });
    };

    const closeConfirm = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = async () => {
        const action = confirmState.onConfirm;
        closeConfirm();
        if (typeof action === 'function') {
            await action();
        }
    };

    const performDeleteAttachment = async (attachmentId) => {
        try {
            await api.delete(`/tasks/${fullTask.id}/attachments/${attachmentId}`, {
                data: { user_id: currentUser.id },
            });
            fetchTaskDetails(fullTask.id);
        } catch (error) {
            alert('Failed to delete attachment');
        }
    };

    const handleDeleteAttachment = (attachmentId) => {
        openConfirm({
            title: 'Delete Attachment',
            message: 'This file will be marked for deletion now and permanently removed after retention.',
            confirmText: 'Delete File',
            onConfirm: () => performDeleteAttachment(attachmentId),
        });
    };

    const toggleLabel = async (labelId) => {
        if (!fullTask) return;
        const hasLabel = fullTask.labels.some(label => label.id === labelId);
        if (hasLabel) await api.delete(`/tasks/${fullTask.id}/labels/${labelId}`);
        else await api.post(`/tasks/${fullTask.id}/labels`, { label_id: labelId });
        fetchTaskDetails(fullTask.id);
    };

    const handleCreateLabel = async () => {
        if (!newLabel.name.trim()) return;
        try {
            await api.post('/labels', newLabel);
            setNewLabel(prev => ({ ...prev, name: '' }));
            fetchLabels();
            if (fullTask) fetchTaskDetails(fullTask.id);
        } catch (error) {
            alert('Failed to create label');
        }
    };

    const handleDeleteLabel = (event, id) => {
        event.stopPropagation();
        openConfirm({
            title: 'Delete Label',
            message: 'Delete this label permanently from the workspace?',
            confirmText: 'Delete Label',
            onConfirm: async () => {
                try {
                    await api.delete(`/labels/${id}`);
                    fetchLabels();
                    if (fullTask) fetchTaskDetails(fullTask.id);
                } catch (error) {
                    alert('Failed to delete label');
                }
            },
        });
    };

    const saveIndicator = {
        saved: { label: 'Saved', className: 'text-emerald-300', dot: 'bg-emerald-400' },
        unsaved: { label: 'Unsaved changes', className: 'text-amber-300', dot: 'bg-amber-400' },
        saving: { label: 'Saving...', className: 'text-sky-300', dot: 'bg-sky-400' },
    }[saveState] || { label: 'Saved', className: 'text-emerald-300', dot: 'bg-emerald-400' };

    const headerMetaCreated = fullTask?.created_at ? toLocalTime(fullTask.created_at) : 'Not yet saved';
    const headerMetaUpdated = fullTask?.updated_at ? toLocalTime(fullTask.updated_at) : 'Not yet saved';
    const activityEntries = fullTask?.activities || [];
    const collapsedActivityCount = 4;
    const visibleActivities = showAllActivity ? activityEntries : activityEntries.slice(0, collapsedActivityCount);

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideHeader bodyClassName="p-0" maxWidth="max-w-6xl">
            <form id="task-form" onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                <div className="shrink-0 border-b border-white/10 px-5 py-3 bg-slate-900/85 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 flex items-center gap-4">
                            <div className="min-w-0 flex-1">
                                {isCreateMode && (
                                    <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary mb-1">Create Task</p>
                                )}
                                <input
                                    placeholder={isCreateMode ? 'Create Task' : 'Task Title'}
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    className="w-full min-w-[220px] bg-transparent text-2xl font-bold text-primary placeholder:text-textPlaceholder focus:outline-none"
                                />
                            </div>
                            {!isCreateMode && (
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-textTertiary">
                                    <span>Created <span className="text-textSecondary">{headerMetaCreated}</span></span>
                                    <span className="text-textMuted">|</span>
                                    <span>Updated <span className="text-textSecondary">{headerMetaUpdated}</span></span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-textTertiary hover:text-textPrimary transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                            aria-label="Close task modal"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
                        <div className="xl:col-span-2 space-y-5">
                            <section className={SECTION_CARD}>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-textSecondary uppercase tracking-wide mb-3">
                                        <AlignLeft size={16} /> Description
                                </h3>
                                <textarea
                                    ref={descriptionRef}
                                    placeholder="Add a detailed task description..."
                                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3 text-textPrimary placeholder:text-textPlaceholder focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary/45 text-sm leading-relaxed resize-none"
                                    value={formData.description}
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, description: e.target.value }));
                                        autoResizeDescription(e.target);
                                    }}
                                />
                            </section>

                            <section className={SECTION_CARD}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-textSecondary uppercase tracking-wide">
                                            <Paperclip size={16} /> Attachments
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={!fullTask}
                                            className="border-white/15"
                                        >
                                            <Plus size={14} /> Add File
                                        </Button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {(fullTask?.attachments || []).map(file => (
                                            (() => {
                                                const extension = getFileExtension(file.original_name || file.filename || '');
                                                const FileIcon = getFileIcon(extension);
                                                const fileSize = formatFileSize(file.size);
                                                return (
                                                    <div key={file.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/65 px-3 py-2.5">
                                                        <div className="bg-slate-800 p-1.5 rounded-md text-textSecondary shrink-0">
                                                            <FileIcon size={14} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <a
                                                                href={getUploadUrl(file.path)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                download={file.original_name}
                                                                className="text-sm text-textPrimary hover:text-primary truncate block"
                                                                title={file.original_name}
                                                            >
                                                                {file.original_name}
                                                            </a>
                                                            {fileSize && <div className="text-[11px] text-textTertiary">{fileSize}</div>}
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-md border border-white/15 text-[10px] text-textSecondary font-semibold shrink-0">
                                                            {extension}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAttachment(file.id)}
                                                            className="p-1.5 rounded-md text-red-300 hover:bg-red-500/15 shrink-0"
                                                            title="Delete file"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })()
                                        ))}

                                        {(!fullTask?.attachments || fullTask.attachments.length === 0) && (
                                            <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/35 px-4 py-4 text-center text-sm text-textTertiary">
                                                {fullTask ? 'No attachments yet.' : 'Save task first to attach files.'}
                                            </div>
                                        )}
                                    </div>

                                    {fullTask && <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />}

                                    {fullTask?.pending_deletion?.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-300 uppercase tracking-wide">
                                                <AlertCircle size={12} /> Pending deletion (7 days)
                                            </div>
                                            {fullTask.pending_deletion.map(file => {
                                                const deletedDate = new Date(file.deleted_at.replace(' ', 'T') + 'Z');
                                                const expiryDate = new Date(deletedDate);
                                                expiryDate.setDate(expiryDate.getDate() + 7);
                                                const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                                                return (
                                                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-red-500/25 bg-red-500/8 px-3 py-2">
                                                        <span className="text-xs text-textSecondary truncate pr-2">{file.original_name}</span>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-[11px] text-red-300">{daysLeft > 0 ? `${daysLeft}d left` : 'Deleting...'}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAttachment(file.id)}
                                                                className="text-[11px] text-red-300 hover:text-red-200"
                                                            >
                                                                Delete now
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                            </section>

                            {fullTask && (
                                <section className={SECTION_CARD}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-textSecondary uppercase tracking-wide">
                                            <Clock size={16} /> Activity
                                        </h3>
                                        {activityEntries.length > collapsedActivityCount && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllActivity(prev => !prev)}
                                                className="text-xs text-primary hover:text-primaryHover"
                                            >
                                                {showAllActivity ? 'Show Less' : `Show More (${activityEntries.length})`}
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative space-y-2.5 pl-4 before:absolute before:left-[6px] before:top-1 before:bottom-1 before:w-px before:bg-white/10">
                                        {visibleActivities.map(log => (
                                            <div key={log.id} className="relative">
                                                <span className="absolute -left-[11px] top-2 h-2 w-2 rounded-full bg-primary/70" />
                                                <div className="rounded-lg border border-white/8 bg-slate-950/45 px-3 py-2">
                                                    <div className="text-sm leading-snug text-textSecondary">
                                                        <span className="font-semibold text-textPrimary">{log.user_name || 'Unknown'}</span>{' '}
                                                        {log.action === 'created' && 'created this task'}
                                                        {log.action === 'updated' && 'updated properties'}
                                                        {log.action === 'moved' && (log.details || 'moved this task')}
                                                        {log.action === 'attachment_added' && (log.details || 'uploaded a file')}
                                                        {log.action === 'attachment_deleted' && (log.details || 'deleted an attachment')}
                                                        {log.action === 'attachment_purged' && 'system permanently removed an attachment'}
                                                        {log.action === 'archived' && 'archived this task'}
                                                        {log.action === 'restored' && 'restored this task'}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-textTertiary">{toLocalTime(log.created_at)}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {visibleActivities.length === 0 && <p className="text-sm text-textTertiary">No activity entries yet.</p>}
                                    </div>
                                </section>
                            )}
                        </div>

                        <aside className="space-y-4">
                            <section className={SECTION_CARD}>
                                <label className="label-heading">Status</label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {statusOptions.map((status) => {
                                        const isActive = Number(formData.column_id) === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, column_id: status.value }))}
                                                className={cn(
                                                    'px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150',
                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                                    isActive
                                                        ? cn('shadow-sm', getStatusColor(status.label))
                                                        : 'bg-slate-950/65 text-textSecondary border-white/12 hover:text-textPrimary hover:border-white/25 hover:bg-slate-900/75'
                                                )}
                                            >
                                                {status.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className={SECTION_CARD}>
                                <label className="label-heading">Priority</label>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {['Low', 'Medium', 'High'].map(priority => (
                                        <button
                                            key={priority}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, priority }))}
                                            className={cn(
                                                'px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors',
                                                formData.priority === priority
                                                    ? PRIORITY_STYLES[priority]
                                                    : 'text-textTertiary border-white/10 hover:text-textPrimary hover:bg-white/5'
                                            )}
                                        >
                                            {priority}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className={SECTION_CARD}>
                                <label className="label-heading">Due Date</label>
                                <DarkDatePicker
                                    value={formData.due_date}
                                    onChange={value => setFormData(prev => ({ ...prev, due_date: value }))}
                                    className="mt-2"
                                />
                            </section>

                            <section className={SECTION_CARD}>
                                    <div className="flex items-center justify-between">
                                        <label className="label-heading flex items-center gap-1"><Tag size={10} /> Labels</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsLabelComposerOpen(prev => !prev)}
                                            className="text-xs text-primary hover:text-primaryHover"
                                        >
                                            {isLabelComposerOpen ? 'Hide Add Label' : 'Add Label'}
                                        </button>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {labels.map(label => {
                                            const isActive = (fullTask?.labels || []).some(item => item.id === label.id);
                                            return (
                                                <button
                                                    key={label.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (!fullTask) return;
                                                        toggleLabel(label.id);
                                                    }}
                                                    className={cn(
                                                        'group relative rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                                        isActive ? 'text-textPrimary border-transparent' : 'text-textSecondary border-white/15 hover:border-white/30 hover:text-textPrimary',
                                                        !fullTask ? 'opacity-70 cursor-not-allowed hover:border-white/15 hover:text-textSecondary' : ''
                                                    )}
                                                    style={isActive ? { backgroundColor: label.color, color: getLabelTextColor(label.color), borderColor: label.color } : {}}
                                                    disabled={!fullTask}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isActive ? getLabelTextColor(label.color) : label.color }} />
                                                        {label.name}
                                                    </span>
                                                    <span
                                                        onClick={(event) => handleDeleteLabel(event, label.id)}
                                                        className="absolute -top-1 -right-1 hidden group-hover:inline-flex p-0.5 rounded-full bg-red-500 text-white"
                                                        title="Delete label"
                                                    >
                                                        <X size={8} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        {labels.length === 0 && <p className="text-xs text-textTertiary">No labels available.</p>}
                                    </div>
                                    {!fullTask && (
                                        <p className="mt-2 text-[11px] text-textTertiary">Save task first to assign labels.</p>
                                    )}

                                    {isLabelComposerOpen && (
                                        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/55 p-3.5 space-y-3">
                                            <Input
                                                type="text"
                                                placeholder="Label name"
                                                value={newLabel.name}
                                                onChange={e => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {LABEL_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                                                        className={cn('h-5 w-5 rounded-full border transition-transform', newLabel.color === color ? 'border-white scale-110' : 'border-transparent opacity-80 hover:opacity-100')}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <Button type="button" onClick={handleCreateLabel} disabled={!newLabel.name.trim()} size="sm" className="w-full">
                                                Create Label
                                            </Button>
                                        </div>
                                    )}
                            </section>

                            {task && (
                                <section className={SECTION_CARD}>
                                    <label className="label-heading">Actions</label>
                                    <div className="mt-2 space-y-2">
                                        <Button type="button" variant="secondary" onClick={() => onArchive(task.id)} className="w-full justify-center">
                                            <Archive size={14} /> Archive Task
                                        </Button>
                                        <Button type="button" variant="danger" onClick={() => onDelete(task.id)} className="w-full justify-center">
                                            <Trash2 size={14} /> Delete Task
                                        </Button>
                                    </div>
                                </section>
                            )}
                        </aside>
                    </div>
                </div>

                <div className="sticky bottom-0 z-20 border-t border-white/10 bg-slate-900/90 backdrop-blur-md px-5 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className={cn('inline-flex items-center gap-2 text-xs font-medium', saveIndicator.className)}>
                            <span className={cn('h-2 w-2 rounded-full', saveIndicator.dot, saveState === 'saving' ? 'animate-pulse' : '')} />
                            {saveIndicator.label}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={saveState === 'saving'}>
                                <CheckCircle2 size={15} /> {isCreateMode ? 'Create Task' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                variant={confirmState.variant}
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
            />
        </Modal>
    );
}
