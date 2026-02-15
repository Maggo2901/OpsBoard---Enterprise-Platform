import React from 'react';
import { Search, FolderKanban, Tag } from 'lucide-react';

export default function SearchView({ query, loading, results, onOpenTask }) {
    const getStatusTone = (status = '') => {
        const value = status.toLowerCase();
        if (value.includes('done')) {
            return {
                leftBorder: '#36bf81',
                glow: 'shadow-[0_0_0_1px_rgba(54,191,129,0.22),0_0_30px_-16px_rgba(54,191,129,0.52)]',
                chip: 'bg-emerald-500/30 text-emerald-100 border-emerald-300/55 shadow-[0_0_16px_-10px_rgba(54,191,129,0.9)]',
            };
        }
        if (value.includes('progress')) {
            return {
                leftBorder: '#8a7df7',
                glow: 'shadow-[0_0_0_1px_rgba(138,125,247,0.22),0_0_30px_-16px_rgba(138,125,247,0.5)]',
                chip: 'bg-violet-500/30 text-violet-100 border-violet-300/55 shadow-[0_0_16px_-10px_rgba(138,125,247,0.9)]',
            };
        }
        if (value.includes('to do')) {
            return {
                leftBorder: '#5f8ff2',
                glow: 'shadow-[0_0_0_1px_rgba(95,143,242,0.22),0_0_30px_-16px_rgba(95,143,242,0.5)]',
                chip: 'bg-blue-500/30 text-blue-100 border-blue-300/55 shadow-[0_0_16px_-10px_rgba(95,143,242,0.9)]',
            };
        }
        return {
            leftBorder: '#90a0b8',
            glow: 'shadow-[0_0_0_1px_rgba(144,160,184,0.18),0_0_24px_-15px_rgba(144,160,184,0.4)]',
            chip: 'bg-slate-500/28 text-slate-100 border-slate-300/45 shadow-[0_0_16px_-11px_rgba(144,160,184,0.7)]',
        };
    };

    const highlightMatch = (text = '', search = '') => {
        if (!search || !text) return text;
        const safeQuery = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matcher = new RegExp(`(${safeQuery})`, 'gi');
        const parts = String(text).split(matcher);
        return parts.map((part, index) =>
            index % 2 === 1 ? (
                <span key={`${part}-${index}`} className="search-highlight">
                    {part}
                </span>
            ) : (
                <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
            )
        );
    };

    return (
        <section className="relative z-[1] h-full w-full px-8 xl:px-16 2xl:px-24 py-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/35 text-primary flex items-center justify-center">
                            <Search size={16} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-textPrimary">Global Task Search</h2>
                            <p className="text-xs text-textTertiary">
                                {loading ? 'Searching across all boards...' : `${results.length} result(s) for "${query}"`}
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center text-textTertiary">
                        Searching tasks across all boards...
                    </div>
                ) : results.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center text-textTertiary">
                        No tasks found across all boards.
                    </div>
                ) : (
                    <div className="grid gap-3.5">
                        {results.map((result) => (
                            (() => {
                                const tone = getStatusTone(result.sectionName);
                                return (
                                    <button
                                        key={`${result.boardId}-${result.task.id}`}
                                        type="button"
                                        onClick={() => onOpenTask(result)}
                                        className={`text-left dt-card-surface border border-[rgba(124,156,255,0.2)] hover:border-[rgba(154,182,255,0.42)] rounded-xl p-4 transition-all hover:-translate-y-[2px] hover:shadow-card-hover relative overflow-hidden ${tone.glow}`}
                                        style={{ borderLeft: `4px solid ${tone.leftBorder}` }}
                                    >
                                        <h3 className="text-base font-semibold text-textPrimary">
                                            {highlightMatch(result.task.title, query)}
                                        </h3>
                                        <p className="mt-1 text-sm text-textSecondary line-clamp-2">
                                            {highlightMatch(result.task.description || 'No description provided.', query)}
                                        </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-textTertiary">
                                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold tracking-[0.01em] ${tone.chip}`}>
                                        Status: {result.sectionName}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-300/35 bg-slate-900/80 text-blue-100 px-3 py-1.5 text-[12px] font-medium shadow-[0_0_16px_-11px_rgba(96,152,255,0.75)]">
                                        <FolderKanban size={13} /> Board: {result.boardName}
                                    </span>

                                    {result.labelNames.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/55 px-2 py-1 text-[10px]">
                                            <Tag size={12} /> {highlightMatch(result.labelNames.join(', '), query)}
                                        </span>
                                    )}
                                </div>
                                    </button>
                                );
                            })()
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
