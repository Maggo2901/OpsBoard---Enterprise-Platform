import React, { useMemo, useState } from 'react';
import { Button } from '../UI';
import { Check, Edit2, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import CreateBoardModal from './CreateBoardModal';
import DeleteBoardModal from './DeleteBoardModal';
import RenameBoardModal from './RenameBoardModal';

export default function BoardSidebar({
    boards,
    activeBoardId,
    onSwitchBoard,
    onCreateBoard,
    onRenameBoard,
    onDeleteBoard
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

    const activeBoard = useMemo(
        () => boards.find((board) => board.id === activeBoardId),
        [boards, activeBoardId]
    );

    const handleCreate = async (name) => {
        await onCreateBoard(name);
        setIsCreateModalOpen(false);
    };

    const handleRename = async (name) => {
        await onRenameBoard(name);
        setIsRenameModalOpen(false);
    };

    const handleDelete = async () => {
        await onDeleteBoard(activeBoardId);
        setIsDeleteModalOpen(false);
    };

    return (
        <>
            <aside className="w-[260px] shrink-0 h-[calc(100%-1.5rem)] my-3 ml-3 rounded-2xl border border-[rgba(124,156,255,0.22)] bg-[linear-gradient(180deg,rgba(17,30,52,0.82)_0%,rgba(11,20,36,0.84)_100%)] backdrop-blur-md shadow-[0_22px_50px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(150,182,255,0.09),inset_0_0_0_1px_rgba(118,150,232,0.06)] relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light bg-[radial-gradient(rgba(255,255,255,0.22)_0.55px,transparent_0.55px)] [background-size:3px_3px]" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#79a5ff66] to-transparent" />
                <div className="h-full flex flex-col relative z-[1]">
                    <div className="px-4 pt-5 pb-3 border-b border-[rgba(124,156,255,0.18)]">
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-textTertiary">
                                Boards
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-textSecondary border border-white/10">
                                {boards.length}
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full mt-3 justify-center bg-[linear-gradient(180deg,rgba(45,72,126,0.62)_0%,rgba(31,53,97,0.65)_100%)] border-[rgba(137,166,245,0.32)] hover:bg-[linear-gradient(180deg,rgba(57,86,145,0.68)_0%,rgba(40,65,116,0.72)_100%)] hover:shadow-[0_14px_28px_-18px_rgba(92,140,255,0.9)]"
                        >
                            <Plus size={14} /> New Board
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-3 space-y-1.5">
                        {boards.map((board) => {
                            const isActive = board.id === activeBoardId;
                            return (
                                <button
                                    key={board.id}
                                    type="button"
                                    onClick={() => onSwitchBoard(board.id)}
                                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-all duration-200 relative ${
                                        isActive
                                            ? 'bg-[linear-gradient(180deg,rgba(48,79,142,0.42)_0%,rgba(37,59,104,0.46)_100%)] border border-primary/40 text-primary shadow-[0_0_0_1px_rgba(110,160,255,0.24),0_10px_24px_-16px_rgba(85,131,238,0.85)]'
                                            : 'bg-transparent border border-transparent text-textSecondary hover:text-textPrimary hover:bg-white/[0.05] hover:border-[rgba(136,165,236,0.28)] hover:shadow-[0_10px_22px_-18px_rgba(95,145,245,0.7)]'
                                    }`}
                                >
                                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-[#95beff] to-[#5e8cff] shadow-[0_0_12px_rgba(108,155,255,0.9)]" />}
                                    <span className="truncate text-sm font-medium">{board.name}</span>
                                    {isActive ? <Check size={14} /> : <LayoutGrid size={14} className="text-textMuted" />}
                                </button>
                            );
                        })}
                        {boards.length === 0 && (
                            <div className="text-xs text-textTertiary px-2 py-4 text-center">No boards available.</div>
                        )}
                    </div>

                    <div className="px-3 py-3 border-t border-[rgba(124,156,255,0.18)] space-y-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsRenameModalOpen(true)}
                            disabled={!activeBoard}
                            className="w-full justify-start bg-transparent border-[rgba(124,156,255,0.2)] hover:border-[rgba(156,185,255,0.34)] hover:shadow-[0_10px_24px_-18px_rgba(94,140,238,0.72)]"
                        >
                            <Edit2 size={14} /> Rename Board
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsDeleteModalOpen(true)}
                            disabled={!activeBoard}
                            className="w-full justify-start bg-transparent border-red-500/20 text-red-300 hover:bg-red-500/12 hover:border-red-400/38 hover:shadow-[0_10px_24px_-16px_rgba(255,81,81,0.72)] focus-visible:ring-red-500/35 active:bg-red-500/16"
                        >
                            <Trash2 size={14} /> Delete Board
                        </Button>
                    </div>
                </div>
            </aside>

            <CreateBoardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
            />
            <RenameBoardModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                onConfirm={handleRename}
                currentName={activeBoard?.name || ''}
            />
            <DeleteBoardModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                boardName={activeBoard?.name || ''}
            />
        </>
    );
}
