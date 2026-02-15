import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Archive as ArchiveIcon, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toLocalTime } from '../utils/dateUtils';

export default function ArchiveView({ boardId, currentUser, onClose, onRestore }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        if (boardId) {
            fetchArchivedTasks();
        }
    }, [boardId]);

    const fetchArchivedTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/archived-tasks?board_id=${boardId}`);
            setTasks(res.data);
        } catch (error) {
            console.error("Failed to fetch archived tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (task) => {
        try {
            // Optimistic update
            setTasks(prev => prev.filter(t => t.id !== task.id));
            
            await api.patch(`/tasks/${task.id}/restore`, { user_id: currentUser?.id });
            if (onRestore) onRestore();
        } catch (error) {
            console.error("Failed to restore task", error);
            fetchArchivedTasks(); // Revert on failure
        }
    };

    const filtered = tasks.filter(task => {
        const matchesSearch = !searchTerm || 
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="absolute inset-0 z-40 bg-[#0d172a]/95 backdrop-blur-md flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-[rgba(124,156,255,0.2)] bg-[#0d172a]/80 backdrop-blur-md">
                <div className="flex items-center gap-3 text-textPrimary">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <ArchiveIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-primary">Archived Tasks</h2>
                        <p className="text-xs text-textTertiary font-mono uppercase tracking-wide">
                            {loading ? 'Loading...' : `${filtered.length} Items Found`}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-amber-500 transition-colors" size={16} />
                        <input
                            type="text" 
                            placeholder="Search archive..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900/58 border border-[rgba(124,156,255,0.2)] rounded-lg text-sm text-textPrimary w-64 focus:outline-none focus:border-amber-500/55 focus:ring-1 focus:ring-amber-500/55 transition-all placeholder:text-textPlaceholder"
                        />
                    </div>
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-textSecondary hover:text-textPrimary hover:bg-white/5"
                    >
                        Back to Board
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-textTertiary">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-sm font-medium">Loading archived tasks...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-textTertiary opacity-70">
                        <ArchiveIcon size={48} className="mb-4 text-slate-700" />
                        <p className="text-lg font-medium">No archived tasks found</p>
                        {searchTerm && <p className="text-sm">Try different search terms</p>}
                    </div>
                ) : (
                    <div className="grid gap-4 max-w-5xl mx-auto">
                        {filtered.map(task => (
                            <div key={task.id} className="dt-card-surface border border-[rgba(124,156,255,0.2)] rounded-xl p-4 flex items-center justify-between hover:border-[rgba(150,180,255,0.4)] hover:-translate-y-[2px] transition-all group shadow-card">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h3 className="text-textPrimary font-medium truncate mb-1">{task.title}</h3>
                                    <p className="text-textSecondary text-sm truncate">{task.description || 'No description'}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-textTertiary font-mono">
                                        <span>ID: #{task.id}</span>
                                        <span>•</span>
                                        <span>Archived: {toLocalTime(task.updated_at || Date.now())}</span>
                                        {task.assignee_name && (
                                            <>
                                                <span>•</span>
                                                <span>By: {task.assignee_name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleRestore(task)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-all bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center"
                                >
                                    <RotateCcw size={14} className="mr-2" />
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
